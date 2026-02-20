import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileActions from "./ProfileActions";
import ProfilePostsGrid from "./ProfilePostsGrid";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [user, posts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, selfieUrl: true, phone: true },
    }),
    prisma.post.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        imageUrl: true,
        category: { select: { id: true, slug: true, label: true, color: true } },
        description: true,
        locationText: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-400 text-sm">{posts.length} laporan</p>
          </div>
          <Avatar className="w-16 h-16 border-2 border-white/20">
            <AvatarImage src={user.selfieUrl || undefined} />
            <AvatarFallback className="bg-white/10 text-white text-xl">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <ProfileActions user={user} />
      </div>

      {/* Posts grid */}
      <div className="px-4">
        <h2 className="text-sm font-medium text-gray-400 mb-3 text-center">
          Postingan
        </h2>
        <ProfilePostsGrid posts={JSON.parse(JSON.stringify(posts))} />
      </div>
    </div>
  );
}
