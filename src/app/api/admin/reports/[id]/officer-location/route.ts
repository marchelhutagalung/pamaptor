import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const validation = updateSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { status: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  if (post.status !== "DALAM_TINDAK_LANJUT") {
    return NextResponse.json(
      { error: "Lokasi hanya dapat dibagikan saat status Dalam Tindak Lanjut" },
      { status: 400 }
    );
  }

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: {
      officerLatitude: validation.data.latitude,
      officerLongitude: validation.data.longitude,
      officerLocationUpdatedAt: new Date(),
    },
    select: {
      officerLatitude: true,
      officerLongitude: true,
      officerLocationUpdatedAt: true,
    },
  });

  return NextResponse.json(updated);
}
