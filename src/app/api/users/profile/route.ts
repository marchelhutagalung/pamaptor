import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").optional(),
  phone: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  const body = await request.json();
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: validation.data,
    select: { id: true, name: true, phone: true },
  });

  return NextResponse.json(user);
}
