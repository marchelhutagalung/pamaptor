import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireSession();
  if (error) return error;

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: {
      userId: true,
      status: true,
      officerLatitude: true,
      officerLongitude: true,
      officerLocationUpdatedAt: true,
    },
  });

  if (!post || post.userId !== session.user.id) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  if (post.status !== "DALAM_TINDAK_LANJUT") {
    return NextResponse.json(
      { error: "Pelacakan tidak tersedia" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    officerLatitude: post.officerLatitude,
    officerLongitude: post.officerLongitude,
    officerLocationUpdatedAt: post.officerLocationUpdatedAt,
  });
}
