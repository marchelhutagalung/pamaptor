"use client";

import { useState } from "react";
import AppImage from "@/components/AppImage";
import CategoryBadge from "@/components/CategoryBadge";
import { MapPin, Calendar, Info } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const STATUS_LABELS: Record<string, string> = {
  HANYA_INFORMASI: "Hanya Informasi",
  PERLU_PERHATIAN: "Perlu Perhatian",
  DALAM_TINDAK_LANJUT: "Dalam Tindak Lanjut",
  SUDAH_DITINDAKLANJUTI: "Sudah Ditindaklanjuti",
  TIDAK_DAPAT_DITINDAKLANJUTI: "Tidak Dapat Ditindaklanjuti",
};

const STATUS_DOT: Record<string, string> = {
  HANYA_INFORMASI: "bg-blue-400",
  PERLU_PERHATIAN: "bg-yellow-400",
  DALAM_TINDAK_LANJUT: "bg-orange-400",
  SUDAH_DITINDAKLANJUTI: "bg-green-400",
  TIDAK_DAPAT_DITINDAKLANJUTI: "bg-gray-400",
};

interface ProfilePost {
  id: string;
  imageUrl: string;
  category: {
    id: string;
    slug: string;
    label: string;
    color: string;
  };
  description: string;
  locationText: string;
  status: string;
  createdAt: string;
}

export default function ProfilePostsGrid({
  posts,
}: {
  posts: ProfilePost[];
}) {
  const [selected, setSelected] = useState<ProfilePost | null>(null);

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-sm">Belum ada postingan</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => setSelected(post)}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <AppImage
              src={post.imageUrl}
              alt="Post"
              fill
              className="object-cover"
              sizes="33vw"
            />
          </button>
        ))}
      </div>

      {/* Bottom Sheet Modal */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="bottom"
          className="bg-gray-950 border-gray-800 text-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-0"
        >
          {selected && (
            <>
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gray-600" />
              </div>

              <SheetHeader className="px-5 pb-3">
                <SheetTitle className="text-white text-left text-lg">
                  Detail Laporan
                </SheetTitle>
              </SheetHeader>

              {/* Image */}
              <div className="relative aspect-video w-full bg-gray-900">
                <AppImage
                  src={selected.imageUrl}
                  alt={selected.description}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              </div>

              {/* Info */}
              <div className="p-5 space-y-4">
                {/* Category & Status */}
                <div className="flex items-center justify-between">
                  <CategoryBadge category={selected.category} />
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${STATUS_DOT[selected.status] || "bg-gray-400"}`}
                    />
                    <span className="text-xs text-gray-400">
                      {STATUS_LABELS[selected.status] || selected.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {selected.description && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Info className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Deskripsi</span>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {selected.description}
                    </p>
                  </div>
                )}

                {/* Location */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Lokasi</span>
                  </div>
                  <p className="text-gray-300 text-sm">{selected.locationText}</p>
                </div>

                {/* Time */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Waktu</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {format(new Date(selected.createdAt), "dd MMMM yyyy, HH:mm", {
                      locale: idLocale,
                    })}
                    <span className="text-gray-500 ml-2">
                      ({formatDistanceToNow(new Date(selected.createdAt), {
                        addSuffix: true,
                        locale: idLocale,
                      })})
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
