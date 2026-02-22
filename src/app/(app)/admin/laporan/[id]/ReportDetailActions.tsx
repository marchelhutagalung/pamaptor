"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STATUS_OPTIONS } from "@/lib/constants";

interface ReportDetailActionsProps {
  postId: string;
  currentStatus: string;
  isPinned: boolean;
}

export default function ReportDetailActions({
  postId,
  currentStatus,
  isPinned,
}: ReportDetailActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState(currentStatus);
  const [pinned, setPinned] = useState(isPinned);
  const [isLoading, setIsLoading] = useState(false);

  const update = async (data: { status?: string; isPinned?: boolean }) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        if (data.status) setStatus(data.status);
        if (data.isPinned !== undefined) setPinned(data.isPinned);
        router.refresh();
        toast({
          title: data.status ? "Status diperbarui" : data.isPinned ? "Laporan disematkan" : "Sematan dilepas",
          description: data.status
            ? `Status berhasil diubah ke "${STATUS_OPTIONS.find((s) => s.value === data.status)?.label}"`
            : data.isPinned
            ? "Laporan akan muncul di atas timeline"
            : "Laporan tidak lagi disematkan",
        });
      } else {
        toast({
          title: "Gagal memperbarui",
          description: "Terjadi kesalahan. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Gagal memperbarui",
        description: "Periksa koneksi internet Anda.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== status) {
      update({ status: newStatus });
    }
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Status selector */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
          Ubah Status
        </p>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              disabled={isLoading}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left disabled:opacity-50 ${
                status === s.value
                  ? "border-white/30 bg-white/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                  status === s.value ? "border-white" : "border-gray-600"
                }`}
              >
                {status === s.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
              <span
                className={`text-sm font-medium ${
                  status === s.value ? "text-white" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pin toggle */}
      <button
        onClick={() => update({ isPinned: !pinned })}
        disabled={isLoading}
        className="w-full h-12 rounded-xl border border-white/20 text-white hover:bg-white/10 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
      >
        {pinned ? (
          <>
            <PinOff className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">Lepas Sematkan</span>
          </>
        ) : (
          <>
            <Pin className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Sematkan di Timeline</span>
          </>
        )}
      </button>
    </div>
  );
}
