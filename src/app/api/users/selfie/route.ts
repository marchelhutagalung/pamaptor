import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Accept both full URLs (GCS in prod) and relative paths (/uploads/... in dev)
const schema = z.object({
  selfieUrl: z.string().refine(
    (val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"),
    { message: "URL tidak valid" }
  ),
});

export async function PATCH(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: "URL tidak valid" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { selfieUrl: validation.data.selfieUrl },
  });

  return NextResponse.json({ message: "Selfie berhasil disimpan." });
}
