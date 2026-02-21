"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
  from?: string;
  to?: string;
}

export default function ExportButton({ from, to }: ExportButtonProps) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const url = `/api/admin/reports/export?${params.toString()}`;

  return (
    <a
      href={url}
      download
      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-white/20 rounded-xl text-white text-sm hover:bg-white/10 transition-colors"
    >
      <Download className="w-4 h-4" />
      Unduh Excel {from || to ? `(${from || "awal"} – ${to || "sekarang"})` : "(Semua)"}
    </a>
  );
}
