"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Loader2, Send, StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  admin: {
    id: string;
    name: string;
  };
}

export default function ReportNotes({ postId }: { postId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/admin/reports/${postId}/notes`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setNotes(data);
        setIsLoading(false);
      })
      .catch((err) => {
        if ((err as Error).name !== "AbortError") {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [postId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/reports/${postId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan");
      } else {
        setNotes((prev) => [...prev, data]);
        setContent("");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-gray-500" />
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          Catatan Internal
        </p>
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        </div>
      ) : notes.length > 0 ? (
        <div className="space-y-3 mb-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-yellow-300 text-xs font-medium">
                  {note.admin.name}
                </span>
                <span className="text-gray-500 text-xs">
                  {formatDistanceToNow(new Date(note.createdAt), {
                    addSuffix: true,
                    locale: id,
                  })}
                </span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-xs mb-4">Belum ada catatan internal.</p>
      )}

      {/* Add note form */}
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tambah catatan internal..."
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-sm resize-none min-h-[80px]"
          maxLength={1000}
        />
        {error && <p className="text-red-400 text-xs px-1">{error}</p>}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-xs">{content.length}/1000</span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-full disabled:opacity-40 transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Simpan Catatan
          </button>
        </div>
      </div>
    </div>
  );
}
