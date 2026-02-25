import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const VALID_STATUSES = [
  "HANYA_INFORMASI",
  "PERLU_PERHATIAN",
  "DALAM_TINDAK_LANJUT",
  "SUDAH_DITINDAKLANJUTI",
  "TIDAK_DAPAT_DITINDAKLANJUTI",
] as const;

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");

  const where: Prisma.PostWhereInput = { isDeleted: false };

  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) }),
    };
  }

  if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    where.status = status as typeof VALID_STATUSES[number];
  }

  const [posts, categoryCountsRaw, totalNew, allCategories] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        category: { select: { id: true, slug: true, label: true, color: true } },
        user: {
          select: { id: true, name: true, selfieUrl: true, email: true, phone: true },
        },
      },
    }),
    prisma.post.groupBy({
      by: ["categoryId"],
      where: { isDeleted: false },
      _count: { categoryId: true },
    }),
    prisma.post.count({ where: { status: "HANYA_INFORMASI", isDeleted: false } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  // Map category counts to include label/color
  const catMap = new Map(allCategories.map((c) => [c.id, c]));
  const categoryCounts = categoryCountsRaw.map((item) => {
    const cat = catMap.get(item.categoryId);
    return {
      label: cat?.label || "Lainnya",
      color: cat?.color || "#6b7280",
      count: item._count.categoryId,
    };
  });

  return NextResponse.json({ posts, categoryCounts, totalNew });
}
