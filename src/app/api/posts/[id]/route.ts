import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireSession();
  if (error) return error;

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      category: { select: { id: true, slug: true, label: true, color: true } },
      user: {
        select: { id: true, name: true, selfieUrl: true },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(post);
}
