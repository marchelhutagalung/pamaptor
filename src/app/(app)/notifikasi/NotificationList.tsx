"use client";

import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { STATUS_DOT_COLORS } from "@/lib/constants";

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  post: { id: string } | null;
}

export default function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Bell className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Belum ada notifikasi</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {notifications.map((notif) => (
        <button
          key={notif.id}
          onClick={() => {
            if (notif.post?.id) {
              router.push(`/profile?highlight=${notif.post.id}`);
            }
          }}
          className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-white/5 transition-colors"
        >
          <span
            className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
              notif.isRead
                ? "bg-gray-600"
                : (STATUS_DOT_COLORS["DALAM_TINDAK_LANJUT"] ?? "bg-blue-400")
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm leading-snug ${notif.isRead ? "text-gray-400" : "text-white"}`}>
              {notif.message}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDistanceToNow(new Date(notif.createdAt), {
                addSuffix: true,
                locale: idLocale,
              })}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
