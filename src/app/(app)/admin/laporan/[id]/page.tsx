import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AppImage from "@/components/AppImage";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CategoryBadge from "@/components/CategoryBadge";
import { ArrowLeft, MapPin, Phone, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import ReportDetailActions from "./ReportDetailActions";
import ReportNotes from "./ReportNotes";
import dynamic from "next/dynamic";
import { STATUS_LABELS, STATUS_BG } from "@/lib/constants";

const ReportMap = dynamic(() => import("@/components/ReportMap"), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full bg-gray-900 rounded-xl animate-pulse" />
  ),
});

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/home");

  const post = await prisma.post.findFirst({
    where: { id: params.id, isDeleted: false },
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

  if (!post) notFound();

  // Mark as read when admin opens the report
  if (!post.isRead) {
    await prisma.post.update({
      where: { id: post.id },
      data: { isRead: true },
    });
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/10">
        <Link href="/admin/laporan" className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold flex-1">Detail Laporan</h1>
      </div>

      {/* Image */}
      <div className="relative aspect-video w-full bg-gray-900">
        <AppImage
          src={post.imageUrl}
          alt="Laporan"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Category & Status */}
        <div className="flex items-center justify-between">
          <CategoryBadge category={post.category} />
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              STATUS_BG[post.status] || "bg-gray-800/50 text-gray-300"
            }`}
          >
            {STATUS_LABELS[post.status] || post.status}
          </span>
        </div>

        {/* Description */}
        {post.description && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
              Deskripsi
            </p>
            <p className="text-gray-200 text-sm leading-relaxed">
              {post.description}
            </p>
          </div>
        )}

        {/* Location */}
        <div>
          <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
            Lokasi
          </p>
          <div className="flex items-start gap-2 text-gray-200 mb-3">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
            <p className="text-sm">{post.locationText}</p>
          </div>
          {post.latitude && post.longitude && (
            <ReportMap
              latitude={post.latitude}
              longitude={post.longitude}
              locationText={post.locationText}
            />
          )}
        </div>

        {/* Timestamp */}
        <div>
          <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
            Waktu Laporan
          </p>
          <div className="flex items-center gap-2 text-gray-200">
            <Calendar className="w-4 h-4 text-gray-500" />
            <p className="text-sm">
              {format(post.createdAt, "EEEE, dd MMMM yyyy – HH:mm", {
                locale: id,
              })}
            </p>
          </div>
        </div>

        {/* Reporter */}
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
            Pelapor
          </p>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-white/20">
                <AvatarImage src={post.user.selfieUrl || undefined} />
                <AvatarFallback className="bg-white/10 text-white text-sm">
                  {post.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{post.user.name}</p>
              </div>
            </div>
            {post.user.email && (
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs">{post.user.email}</span>
              </div>
            )}
            {post.user.phone && (
              <a
                href={`tel:${post.user.phone}`}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs underline">{post.user.phone}</span>
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <ReportDetailActions
          postId={post.id}
          currentStatus={post.status}
          isPinned={post.isPinned}
        />

        {/* Internal Notes */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <ReportNotes postId={post.id} />
        </div>
      </div>
    </div>
  );
}
