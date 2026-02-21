import AppImage from "@/components/AppImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

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
    isPinned: boolean;
    status: string;
    createdAt: Date | string;
    user: PostUser;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: id,
  });

  return (
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

      {/* Image */}
      <div className="relative aspect-video w-full bg-gray-900">
        <AppImage
          src={post.imageUrl}
          alt={post.description}
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      </div>

      {/* Footer */}
      <div className="p-4 space-y-2">
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

        {post.description && (
          <p className="text-gray-200 text-sm leading-relaxed line-clamp-3">
            {post.description}
          </p>
        )}

        <div className="flex items-start gap-1.5 text-gray-500">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p className="text-xs line-clamp-2">{post.locationText}</p>
        </div>
      </div>
    </article>
  );
}
