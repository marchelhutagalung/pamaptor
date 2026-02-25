import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { POST_STATUSES, STATUS_NOTIFICATION_MESSAGES } from "@/lib/constants";

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

  // Get existing post to compare status and get userId
  const existing = await prisma.post.findUnique({
    where: { id: params.id },
    select: { status: true, userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  const post = await prisma.post.update({
    where: { id: params.id },
    data: validation.data,
    include: {
      category: { select: { id: true, slug: true, label: true, color: true } },
    },
  });

  // Create notification if status changed
  const newStatus = validation.data.status;
  if (newStatus && newStatus !== existing.status) {
    await prisma.notification.create({
      data: {
        userId: existing.userId,
        type: "STATUS_CHANGED",
        message: STATUS_NOTIFICATION_MESSAGES[newStatus],
        postId: params.id,
      },
    });
  }

  // Revalidate timeline so pin/unpin changes appear immediately
  revalidatePath("/home");

  return NextResponse.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const existing = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, isDeleted: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  // Soft delete — set isDeleted flag instead of removing from DB
  await prisma.post.update({
    where: { id: params.id },
    data: { isDeleted: true, isPinned: false },
  });

  revalidatePath("/home");
  revalidatePath("/admin/laporan");

  return NextResponse.json({ success: true });
}
