"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-white">
      <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Terjadi Kesalahan</h2>
      <p className="text-gray-400 text-sm text-center mb-6">
        Halaman ini tidak dapat dimuat. Coba muat ulang atau kembali ke beranda.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Muat Ulang
        </button>
        <a
          href="/home"
          className="px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-full font-semibold text-sm hover:bg-white/20 transition-colors"
        >
          Kembali
        </a>
      </div>
    </div>
  );
}
