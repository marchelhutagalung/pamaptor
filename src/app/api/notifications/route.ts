import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  markAllRead: z.boolean(),
});

export async function GET(
  _request: NextRequest, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  const { error, session } = await requireSession();
  if (error) return error;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        post: { select: { id: true } },
      },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  try {
    const body = await request.json();
    const validation = patchSchema.safeParse(body);

    if (!validation.success || !validation.data.markAllRead) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ message: "Semua notifikasi ditandai dibaca." });
  } catch (err) {
    console.error("Mark notifications error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan." },
      { status: 500 }
    );
  }
}
