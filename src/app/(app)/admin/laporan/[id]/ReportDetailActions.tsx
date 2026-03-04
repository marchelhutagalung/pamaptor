"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff, Trash2, Loader2 } from "lucide-react";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/reports/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({
          title: "Laporan dihapus",
          description: "Laporan telah dihapus dan tidak akan ditampilkan lagi.",
        });
        router.replace("/admin/laporan");
        router.refresh();
      } else {
        toast({
          title: "Gagal menghapus",
          description: "Terjadi kesalahan. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Gagal menghapus",
        description: "Periksa koneksi internet Anda.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Status selector — hidden for admin-created info posts */}
      <div>
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
          Ubah Status
        </p>
        {status === "INFORMASI" ? (
          <div className="px-4 py-3 rounded-xl border border-purple-500/20 bg-purple-900/10 text-purple-300 text-sm">
            Post ini adalah informasi dari admin dan tidak memiliki status laporan.
          </div>
        ) : (
          <div className="space-y-2">
            {STATUS_OPTIONS.filter((s) => s.value !== "INFORMASI").map((s) => (
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
        )}
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

      {/* Delete */}
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={isLoading || isDeleting}
          className="w-full h-12 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium">Hapus Laporan</span>
        </button>
      ) : (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-900/20 space-y-3">
          <p className="text-sm text-red-300 text-center">
            Yakin ingin menghapus laporan ini?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
              className="flex-1 h-10 rounded-xl border border-white/10 text-white text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 h-10 rounded-xl bg-red-600 text-white text-sm hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
