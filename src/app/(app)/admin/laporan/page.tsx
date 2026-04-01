import type { Metadata } from "next";
import { Suspense } from "react";
import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  title: "Manajemen Laporan | Pamaptor",
  description: "Kelola dan tindaklanjuti laporan dari masyarakat.",
};
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
import { CircleDot, ChevronLeft, ChevronRight } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

const VALID_STATUSES = Object.keys(STATUS_LABELS);
const PAGE_SIZE = 10;

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: { q?: string; from?: string; to?: string; status?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/home");

  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  const where: Prisma.PostWhereInput = { isDeleted: false };

  // Text search — matches reporter name, description, location, or category label
  if (searchParams.q) {
    const q = searchParams.q.trim();
    if (q) {
      where.OR = [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { description: { contains: q, mode: "insensitive" } },
        { locationText: { contains: q, mode: "insensitive" } },
        { category: { label: { contains: q, mode: "insensitive" } } },
      ];
    }
  }

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

  const orderBy: Prisma.PostOrderByWithRelationInput[] = [
    { isPinned: "desc" },
    { createdAt: "desc" },
  ];

  const [posts, totalCount, categoryCountsRaw, totalNew, allCategories] =
    await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          category: {
            select: { id: true, slug: true, label: true, color: true },
          },
          user: {
            select: { id: true, name: true, selfieUrl: true },
          },
        },
      }),
      prisma.post.count({ where }),
      prisma.post.groupBy({
        by: ["categoryId"],
        where,
        _count: { categoryId: true },
      }),
      prisma.post.count({ where: { isRead: false, isDeleted: false } }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Build category counts — include ALL active categories, even those with 0 posts
  const countMap = new Map(
    categoryCountsRaw.map((item) => [item.categoryId, item._count.categoryId])
  );
  const categoryCounts = allCategories.map((cat) => ({
    label: cat.label,
    color: cat.color,
    count: countMap.get(cat.id) ?? 0,
  }));

  // Build URL helper that preserves filters
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.from) params.set("from", searchParams.from);
    if (searchParams.to) params.set("to", searchParams.to);
    if (searchParams.status) params.set("status", searchParams.status);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/admin/laporan${qs ? `?${qs}` : ""}`;
  };

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, totalCount);

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

      {/* Ringkasan Laporan */}
      <details className="mx-4 mb-4 bg-white/5 rounded-2xl border border-white/10 group" open>
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none">
          <p className="text-sm font-medium text-gray-400">Ringkasan Laporan</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-600">{totalCount} total</p>
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 transition-transform duration-200 group-open:rotate-90" />
          </div>
        </summary>
        <div className="px-4 pb-4">
          <ReportChart categoryCounts={categoryCounts} />
        </div>
      </details>

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
            <p className="text-sm">
              {searchParams.q
                ? `Tidak ada laporan untuk "${searchParams.q}"`
                : "Tidak ada laporan yang sesuai filter"}
            </p>
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
                      <CircleDot
                        className={`w-3.5 h-3.5 ${STATUS_COLORS[post.status] || "text-gray-400"}`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CategoryBadge category={post.category} />
                    <span
                      className={`text-xs ${STATUS_COLORS[post.status] || "text-gray-400"}`}
                    >
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

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="px-4 pb-6 flex items-center justify-between gap-3">
          {/* Page info */}
          <p className="text-xs text-gray-500">
            {startItem}–{endItem} dari {totalCount} laporan
          </p>

          {/* Prev / Page indicator / Next */}
          <div className="flex items-center gap-2">
            <Link
              href={buildPageUrl(currentPage - 1)}
              aria-disabled={currentPage <= 1}
              className={`flex items-center justify-center w-8 h-8 rounded-xl border text-sm transition-colors ${
                currentPage <= 1
                  ? "border-white/5 text-gray-700 pointer-events-none"
                  : "border-white/10 text-white hover:bg-white/10"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>

            <span className="text-xs text-gray-400 min-w-[64px] text-center">
              {currentPage} / {totalPages}
            </span>

            <Link
              href={buildPageUrl(currentPage + 1)}
              aria-disabled={currentPage >= totalPages}
              className={`flex items-center justify-center w-8 h-8 rounded-xl border text-sm transition-colors ${
                currentPage >= totalPages
                  ? "border-white/5 text-gray-700 pointer-events-none"
                  : "border-white/10 text-white hover:bg-white/10"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
