import type { Metadata } from "next";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import NotificationList from "./NotificationList";

export const metadata: Metadata = {
  title: "Notifikasi | Pamaptor",
  description: "Notifikasi status laporan Anda.",
};

export default async function NotifikasiPage() {
  const { error, session } = await requireSession();
  if (error) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      post: { select: { id: true } },
    },
  });

  // Mark all as read
  await prisma.notification.updateMany({
    where: { userId: session!.user.id, isRead: false },
    data: { isRead: true },
  });

  return (
    <div className="text-white">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Notifikasi</h1>
        <p className="text-gray-400 text-sm mt-1">
          {notifications.length} notifikasi
        </p>
      </div>

      <NotificationList
        notifications={JSON.parse(JSON.stringify(notifications))}
      />
    </div>
  );
}
