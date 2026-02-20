"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import PostCard from "@/components/PostCard";
import { Loader2 } from "lucide-react";

interface Post {
  id: string;
  imageUrl: string;
  description: string;
  category: {
    id: string;
    slug: string;
    label: string;
    color: string;
  };
  locationText: string;
  isPinned: boolean;
  status: string;
  createdAt: Date | string;
  user: {
    id: string;
    name: string;
    selfieUrl?: string | null;
  };
}

interface TimelineClientProps {
  initialPosts: Post[];
}

export default function TimelineClient({ initialPosts }: TimelineClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [cursor, setCursor] = useState<string | undefined>(
    initialPosts.length === 20 ? initialPosts[initialPosts.length - 1]?.id : undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === 20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || isLoading || !hasMore) return;
    setIsLoading(true);

    const res = await fetch(`/api/posts?cursor=${cursor}`);
    const data = await res.json();

    setPosts((prev) => [...prev, ...data.posts]);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setIsLoading(false);
  }, [cursor, isLoading, hasMore]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isLoading && <Loader2 className="w-6 h-6 animate-spin text-gray-500" />}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-gray-600 text-xs py-4">
          Semua laporan sudah ditampilkan
        </p>
      )}
    </div>
  );
}
