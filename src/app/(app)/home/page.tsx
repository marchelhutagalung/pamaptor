export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  title: "Beranda | Pamaptor",
  description: "Pantau laporan kejadian terbaru di sekitar Anda.",
};
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TimelineClient from "./TimelineClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import EmergencyCallButton from "@/components/EmergencyCallButton";
import WhatsAppIcon from "@/components/WhatsAppIcon";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!session.user.selfieUrl) redirect("/selfie");

  const [initialPosts, categories] = await Promise.all([
    prisma.post.findMany({
      where: { isDeleted: false },
      take: 20,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        category: { select: { id: true, slug: true, label: true, color: true } },
        user: {
          select: { id: true, name: true, selfieUrl: true },
        },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, slug: true, label: true, color: true },
    }),
  ]);

  return (
    <div className="text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-white/20">
              <AvatarImage src={session.user.selfieUrl || undefined} />
              <AvatarFallback className="bg-white/10 text-white text-sm">
                {session.user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">
                Halo, {session.user.name.split(" ")[0]} 👋
              </p>
              <p className="text-gray-400 text-xs">
                Apa yang terjadi di sekitarmu?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/whatsapp"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </Link>
            <EmergencyCallButton />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 py-4 space-y-4">
        <TimelineClient initialPosts={initialPosts} categories={categories} />
      </div>

      {/* FAB */}
      <Link
        href="/upload"
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-blue-600 shadow-lg flex items-center justify-center text-white text-2xl font-light hover:bg-blue-500 transition-colors"
        aria-label="Buat laporan"
      >
        +
      </Link>
    </div>
  );
}
