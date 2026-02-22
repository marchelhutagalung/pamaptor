"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import PostCard from "@/components/PostCard";
import { Loader2, SlidersHorizontal, X, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  latitude?: number | null;
  longitude?: number | null;
  isPinned: boolean;
  status: string;
  createdAt: Date | string;
  user: {
    id: string;
    name: string;
    selfieUrl?: string | null;
  };
}

interface Category {
  id: string;
  slug: string;
  label: string;
  color: string;
}

interface TimelineClientProps {
  initialPosts: Post[];
  categories: Category[];
}

export default function TimelineClient({
  initialPosts,
  categories,
}: TimelineClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [cursor, setCursor] = useState<string | undefined>(
    initialPosts.length === 20 ? initialPosts[initialPosts.length - 1]?.id : undefined
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === 20);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [triggerLoad, setTriggerLoad] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;

  // Fetch first page for a given categoryId (or all if null)
  const loadFirstPage = useCallback(async (catId: string | null) => {
    setIsLoading(true);
    const url = catId ? `/api/posts?categoryId=${catId}` : `/api/posts`;
    const res = await fetch(url);
    const data = await res.json();
    setPosts(data.posts);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setIsLoading(false);
  }, []);

  // When triggerLoad changes (category switched), re-fetch first page
  useEffect(() => {
    if (triggerLoad === 0) return; // skip on initial mount — use SSR data
    loadFirstPage(selectedCategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerLoad]);

  const loadMore = useCallback(async () => {
    if (!cursor || isLoading || !hasMore) return;
    setIsLoading(true);

    const params = new URLSearchParams({ cursor });
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);

    const res = await fetch(`/api/posts?${params.toString()}`);
    const data = await res.json();

    setPosts((prev) => [...prev, ...data.posts]);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setIsLoading(false);
  }, [cursor, isLoading, hasMore, selectedCategoryId]);

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

  const applyFilter = () => {
    if (pendingCategoryId === selectedCategoryId) {
      setSheetOpen(false);
      return;
    }
    setSelectedCategoryId(pendingCategoryId);
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);
    setTriggerLoad((n) => n + 1);
    setSheetOpen(false);
  };

  const clearFilter = () => {
    if (selectedCategoryId === null) return;
    setSelectedCategoryId(null);
    setPendingCategoryId(null);
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);
    setTriggerLoad((n) => n + 1);
  };

  const openSheet = () => {
    setPendingCategoryId(selectedCategoryId); // start with current selection
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2">
          {/* Filter button */}
          <button
            onClick={openSheet}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedCategoryId
                ? "bg-white text-black border-white"
                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            {selectedCategoryId ? selectedCategory?.label : "Kategori"}
          </button>

          {/* Active filter pill with clear button */}
          {selectedCategoryId && selectedCategory && (
            <button
              onClick={clearFilter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={{
                backgroundColor: `${selectedCategory.color}20`,
                borderColor: `${selectedCategory.color}60`,
                color: selectedCategory.color,
              }}
            >
              {selectedCategory.label}
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Category Bottom Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-gray-900 border-white/10 text-white rounded-t-2xl max-h-[80vh]"
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="text-white">Pilih Kategori</SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto max-h-[50vh] pb-4">
            {/* "Semua" option */}
            <button
              onClick={() => setPendingCategoryId(null)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl mb-1 transition-colors ${
                pendingCategoryId === null
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="text-sm font-medium">Semua Kategori</span>
              </div>
              {pendingCategoryId === null && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Category list */}
            <div className="space-y-1">
              {categories.map((cat) => {
                const isPending = pendingCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setPendingCategoryId(cat.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                      isPending ? "text-white" : "text-gray-400 hover:bg-white/5"
                    }`}
                    style={isPending ? { backgroundColor: `${cat.color}20` } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                    {isPending && (
                      <Check
                        className="w-4 h-4 shrink-0"
                        style={{ color: cat.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Apply button */}
          <div className="pt-2 pb-safe">
            <button
              onClick={applyFilter}
              className="w-full h-12 bg-white text-black rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors"
            >
              {pendingCategoryId
                ? `Tampilkan "${categories.find((c) => c.id === pendingCategoryId)?.label}"`
                : "Tampilkan Semua"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Loading state while switching categories */}
      {isLoading && posts.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg mb-2">Belum ada laporan</p>
          {selectedCategoryId ? (
            <p className="text-sm">Belum ada laporan untuk kategori ini</p>
          ) : (
            <p className="text-sm">Jadilah yang pertama membuat laporan</p>
          )}
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isLoading && posts.length > 0 && (
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          )}
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
