"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff } from "lucide-react";

const POST_STATUSES = [
  { value: "HANYA_INFORMASI", label: "Hanya Informasi", color: "text-blue-400" },
  { value: "PERLU_PERHATIAN", label: "Perlu Perhatian", color: "text-yellow-400" },
  { value: "DALAM_TINDAK_LANJUT", label: "Dalam Tindak Lanjut", color: "text-orange-400" },
  { value: "SUDAH_DITINDAKLANJUTI", label: "Sudah Ditindaklanjuti", color: "text-green-400" },
  { value: "TIDAK_DAPAT_DITINDAKLANJUTI", label: "Tidak Dapat Ditindaklanjuti", color: "text-gray-400" },
];

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
  const [status, setStatus] = useState(currentStatus);
  const [pinned, setPinned] = useState(isPinned);
  const [isLoading, setIsLoading] = useState(false);

  const update = async (data: { status?: string; isPinned?: boolean }) => {
    setIsLoading(true);
    const res = await fetch(`/api/admin/reports/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      if (data.status) setStatus(data.status);
      if (data.isPinned !== undefined) setPinned(data.isPinned);
      router.refresh();
    }
    setIsLoading(false);
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
          {POST_STATUSES.map((s) => (
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
