"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { STATUS_OPTIONS as BASE_STATUS_OPTIONS } from "@/lib/constants";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  ...BASE_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
];

export default function ReportFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [error, setError] = useState("");

  const buildUrl = (overrides?: {
    q?: string;
    from?: string;
    to?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams();
    const fq = overrides?.q ?? q;
    const ff = overrides?.from ?? from;
    const ft = overrides?.to ?? to;
    const fs = overrides?.status ?? status;
    if (fq) params.set("q", fq);
    if (ff) params.set("from", ff);
    if (ft) params.set("to", ft);
    if (fs) params.set("status", fs);
    const qs = params.toString();
    return `/admin/laporan${qs ? `?${qs}` : ""}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate: start date must be <= end date
    if (from && to && from > to) {
      setError(
        "Tanggal 'Dari' harus sebelum atau sama dengan tanggal 'Hingga'"
      );
      return;
    }

    router.push(buildUrl());
  };

  const hasFilter = q || from || to || status;

  const handleReset = () => {
    setQ("");
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

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama pelapor, deskripsi, lokasi..."
          className="w-full bg-white/10 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-white text-sm placeholder:text-gray-500"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              router.push(buildUrl({ q: "" }));
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

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
