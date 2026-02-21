import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CategoryBadge from "@/components/CategoryBadge";
import ReportChart from "@/components/ReportChart";
import ExportButton from "./ExportButton";
import ReportFilter from "./ReportFilter";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { CircleDot } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  HANYA_INFORMASI: "Hanya Informasi",
  PERLU_PERHATIAN: "Perlu Perhatian",
  DALAM_TINDAK_LANJUT: "Dalam Tindak Lanjut",
  SUDAH_DITINDAKLANJUTI: "Sudah Ditindaklanjuti",
  TIDAK_DAPAT_DITINDAKLANJUTI: "Tidak Dapat Ditindaklanjuti",
};

const STATUS_COLORS: Record<string, string> = {
  HANYA_INFORMASI: "text-blue-400",
  PERLU_PERHATIAN: "text-yellow-400",
  DALAM_TINDAK_LANJUT: "text-orange-400",
  SUDAH_DITINDAKLANJUTI: "text-green-400",
  TIDAK_DAPAT_DITINDAKLANJUTI: "text-gray-400",
};

const VALID_STATUSES = Object.keys(STATUS_LABELS);

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/home");

  const where: Prisma.PostWhereInput = {};

  if (searchParams.from || searchParams.to) {
    where.createdAt = {
      ...(searchParams.from && { gte: new Date(searchParams.from) }),
      ...(searchParams.to && {
        lte: new Date(new Date(searchParams.to).setHours(23, 59, 59, 999)),
      }),
    };
  }

  if (searchParams.status && VALID_STATUSES.includes(searchParams.status)) {
    where.status = searchParams.status as Prisma.EnumPostStatusFilter;
  }

  const [posts, categoryCountsRaw, totalNew, allCategories] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        category: { select: { id: true, slug: true, label: true, color: true } },
        user: {
          select: { id: true, name: true, selfieUrl: true },
        },
      },
    }),
    prisma.post.groupBy({ by: ["categoryId"], where, _count: { categoryId: true } }),
    prisma.post.count({ where: { isRead: false } }),
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

  return (
    <div className="text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Laporan</h1>
          {totalNew > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {totalNew} baru
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm">Pantau semua laporan masuk</p>
      </div>

      {/* Chart */}
      <div className="mx-4 mb-4 p-4 bg-white/5 rounded-2xl border border-white/10">
        <p className="text-sm font-medium text-gray-400 mb-3">
          Laporan per Kategori
        </p>
        <ReportChart categoryCounts={categoryCounts} />
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="px-4 mb-4 h-24" />}>
        <ReportFilter />
      </Suspense>

      {/* Export */}
      <div className="px-4 mb-4">
        <ExportButton from={searchParams.from} to={searchParams.to} />
      </div>

      {/* Report list */}
      <div className="px-4 space-y-3 pb-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">Tidak ada laporan yang sesuai filter</p>
          </div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/admin/laporan/${post.id}`}
              className={`block rounded-2xl border p-4 hover:bg-white/10 transition-colors ${
                post.isRead
                  ? "bg-white/5 border-white/10"
                  : "bg-blue-950/30 border-blue-500/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9 border border-white/20 shrink-0">
                  <AvatarImage src={post.user.selfieUrl || undefined} />
                  <AvatarFallback className="bg-white/10 text-white text-xs">
                    {post.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {post.user.name}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!post.isRead && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          Baru
                        </span>
                      )}
                      <CircleDot className={`w-3.5 h-3.5 ${STATUS_COLORS[post.status] || "text-gray-400"}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CategoryBadge category={post.category} />
                    <span className={`text-xs ${STATUS_COLORS[post.status] || "text-gray-400"}`}>
                      {STATUS_LABELS[post.status] || post.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-2">
                    {post.description || post.locationText}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    {formatDistanceToNow(post.createdAt, {
                      addSuffix: true,
                      locale: id,
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
