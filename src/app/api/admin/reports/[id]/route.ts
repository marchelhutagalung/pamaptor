import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const POST_STATUSES = [
  "HANYA_INFORMASI",
  "PERLU_PERHATIAN",
  "DALAM_TINDAK_LANJUT",
  "SUDAH_DITINDAKLANJUTI",
  "TIDAK_DAPAT_DITINDAKLANJUTI",
] as const;

const updateSchema = z.object({
  status: z.enum(POST_STATUSES).optional(),
  isPinned: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      category: { select: { id: true, slug: true, label: true, color: true } },
      user: {
        select: {
          id: true,
          name: true,
          selfieUrl: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(post);
}

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

  const post = await prisma.post.update({
    where: { id: params.id },
    data: validation.data,
    include: {
      category: { select: { id: true, slug: true, label: true, color: true } },
    },
  });

  // Revalidate timeline so pin/unpin changes appear immediately
  revalidatePath("/home");

  return NextResponse.json(post);
}
