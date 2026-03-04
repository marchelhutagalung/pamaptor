"use client";

import { useState } from "react";
import AppImage from "@/components/AppImage";
import ExpandableText from "@/components/ExpandableText";
import ShareButton from "@/components/ShareButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Pin, CircleDot, X, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

interface PostUser {
  id: string;
  name: string;
  selfieUrl?: string | null;
}

interface PostCategory {
  id: string;
  slug: string;
  label: string;
  color: string;
}

interface PostCardProps {
  post: {
    id: string;
    imageUrl: string;
    description: string;
    category: PostCategory;
    locationText: string;
    latitude?: number | null;
    longitude?: number | null;
    isPinned: boolean;
    status: string;
    createdAt: Date | string;
    user: PostUser;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: id,
  });

  const fullDate = format(new Date(post.createdAt), "EEEE, dd MMMM yyyy – HH:mm", {
    locale: id,
  });

  return (
    <>
      <article className="bg-[#111111] rounded-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 pb-3">
          <Avatar className="w-9 h-9 border border-white/20">
            <AvatarImage src={post.user.selfieUrl || undefined} />
            <AvatarFallback className="bg-white/10 text-white text-xs">
              {post.user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {post.user.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {post.isPinned && (
              <Pin className="w-3.5 h-3.5 text-yellow-400 rotate-45" />
            )}
            <span className="text-gray-500 text-xs">{timeAgo}</span>
          </div>
        </div>

        {/* Image — clickable */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="relative aspect-video w-full bg-gray-900 block"
          aria-label="Lihat foto penuh"
        >
          <AppImage
            src={post.imageUrl}
            alt={post.description}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
          />
        </button>

        {/* Footer */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="text-xs font-medium border"
              style={{
                backgroundColor: `${post.category.color}20`,
                color: post.category.color,
                borderColor: `${post.category.color}80`,
              }}
            >
              {post.category.label}
            </Badge>
            <div className="flex items-center gap-1.5">
              <CircleDot className={`w-3 h-3 ${STATUS_COLORS[post.status] || "text-gray-400"}`} />
              <span className={`text-xs ${STATUS_COLORS[post.status] || "text-gray-400"}`}>
                {STATUS_LABELS[post.status] || post.status}
              </span>
            </div>
          </div>

          {post.description && (
            <ExpandableText text={post.description} />
          )}

          {post.locationText && (
            <div className="flex items-start gap-1.5 text-gray-500">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p className="text-xs line-clamp-2">{post.locationText}</p>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-white/5">
            <ShareButton
              imageUrl={post.imageUrl}
              description={post.description}
              categoryLabel={post.category.label}
              categoryColor={post.category.color}
            />
          </div>
        </div>
      </article>

      {/* Full-size image modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onClick={() => setModalOpen(false)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 shrink-0">
            <p className="text-white font-medium text-sm truncate pr-4">
              {post.user.name}
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white shrink-0"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image */}
          <div
            className="flex-1 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <AppImage
              src={post.imageUrl}
              alt={post.description}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Info bar */}
          <div
            className="px-5 py-5 pb-safe space-y-2.5 shrink-0 bg-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            {post.locationText && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                <p className="text-white text-sm leading-snug">{post.locationText}</p>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 shrink-0 text-gray-400" />
              <p className="text-gray-300 text-sm">{fullDate}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
