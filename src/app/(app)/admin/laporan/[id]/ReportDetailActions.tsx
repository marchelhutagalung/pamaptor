"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff, Trash2, Loader2, MapPin, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STATUS_OPTIONS } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

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

  // Location sharing state
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendLocation = useCallback(async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );

      const res = await fetch(`/api/admin/reports/${postId}/officer-location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      if (res.ok) {
        setLastLocationUpdate(new Date());
      } else {
        const data = await res.json();
        toast({
          title: "Gagal memperbarui lokasi",
          description: data.error ?? "Terjadi kesalahan.",
          variant: "destructive",
        });
        stopSharing();
      }
    } catch (err) {
      const isGeoError = err instanceof GeolocationPositionError;
      toast({
        title: "Gagal mendapatkan lokasi",
        description: isGeoError
          ? err.code === 1
            ? "Izin lokasi ditolak. Aktifkan di pengaturan browser."
            : "GPS tidak tersedia. Pastikan perangkat mendukung lokasi."
          : "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
      stopSharing();
    } finally {
      setIsGettingLocation(false);
    }
  }, [postId, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopSharing = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSharingLocation(false);
  }, []);

  const startSharing = useCallback(async () => {
    setIsSharingLocation(true);
    await sendLocation();
    intervalRef.current = setInterval(sendLocation, 300_000); // every 5 minutes
    toast({ title: "Berbagi lokasi aktif", description: "Lokasi Anda diperbarui setiap 5 menit." });
  }, [sendLocation, toast]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Stop sharing if status changes away from DALAM_TINDAK_LANJUT
  useEffect(() => {
    if (status !== "DALAM_TINDAK_LANJUT" && isSharingLocation) {
      stopSharing();
    }
  }, [status, isSharingLocation, stopSharing]);

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

      {/* Officer location sharing — only shown when DALAM_TINDAK_LANJUT */}
      {status === "DALAM_TINDAK_LANJUT" && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
            Lokasi Petugas
          </p>
          {!isSharingLocation ? (
            <button
              onClick={startSharing}
              disabled={isGettingLocation}
              className="w-full h-12 rounded-xl border border-orange-500/30 bg-orange-900/10 text-orange-300 hover:bg-orange-900/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {isGettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Mulai Bagikan Lokasi</span>
            </button>
          ) : (
            <div className="rounded-xl border border-orange-500/30 bg-orange-900/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  <span className="text-sm text-orange-300 font-medium">Lokasi Aktif</span>
                </div>
                <button
                  onClick={stopSharing}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  Berhenti
                </button>
              </div>
              {lastLocationUpdate && (
                <p className="text-xs text-gray-500">
                  Diperbarui{" "}
                  {formatDistanceToNow(lastLocationUpdate, {
                    addSuffix: true,
                    locale: idLocale,
                  })}
                  {" · "}diperbarui otomatis setiap 5 menit
                </p>
              )}
              {isGettingLocation && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Memperbarui lokasi...
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
