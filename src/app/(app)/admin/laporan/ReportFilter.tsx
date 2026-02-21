"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "HANYA_INFORMASI", label: "Hanya Informasi" },
  { value: "PERLU_PERHATIAN", label: "Perlu Perhatian" },
  { value: "DALAM_TINDAK_LANJUT", label: "Dalam Tindak Lanjut" },
  { value: "SUDAH_DITINDAKLANJUTI", label: "Sudah Ditindaklanjuti" },
  { value: "TIDAK_DAPAT_DITINDAKLANJUTI", label: "Tidak Dapat Ditindaklanjuti" },
];

export default function ReportFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate: start date must be <= end date
    if (from && to && from > to) {
      setError("Tanggal 'Dari' harus sebelum atau sama dengan tanggal 'Hingga'");
      return;
    }

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);

    router.push(`/admin/laporan?${params.toString()}`);
  };

  const hasFilter = from || to || status;

  const handleReset = () => {
    setFrom("");
    setTo("");
    setStatus("");
    setError("");
    router.push("/admin/laporan");
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 mb-4 space-y-3">
      {error && (
        <div className="p-2.5 rounded-xl bg-red-900/50 text-red-300 text-xs">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Dari</label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setError("");
            }}
            max={to || undefined}
            className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Hingga</label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setError("");
            }}
            min={from || undefined}
            className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white text-sm hover:bg-white/20"
        >
          Filter
        </button>
        {hasFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-red-900/40 border border-red-500/20 rounded-xl text-red-300 text-sm hover:bg-red-900/60"
          >
            Reset
          </button>
        )}
      </div>
    </form>
  );
}
