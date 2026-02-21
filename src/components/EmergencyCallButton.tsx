"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

export default function EmergencyCallButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center"
        aria-label="Panggilan darurat"
      >
        <Phone className="w-5 h-5 text-white" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="bg-gray-950 border-gray-800 text-white rounded-t-3xl p-0"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-gray-600" />
          </div>

          <div className="flex flex-col items-center px-8 pb-8 pt-4">
            {/* Phone icon */}
            <div className="w-28 h-28 rounded-full border-2 border-red-500/30 flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg
                  viewBox="0 0 64 64"
                  className="w-12 h-12"
                  fill="none"
                >
                  {/* Phone handset */}
                  <path
                    d="M18 8c-2 0-6 2-8 6s-2 10 2 16 10 14 18 18 12 4 16 2 6-6 6-8-4-4-4-4l-8 4c-2 1-8-3-12-8S20 20 21 18l4-8s0-4-2-4z"
                    fill="#ef4444"
                  />
                  {/* 24 badge */}
                  <rect x="34" y="4" width="24" height="16" rx="8" fill="#ef4444" />
                  <text
                    x="46"
                    y="15"
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    24
                  </text>
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-4">Butuh Bantuan?</h2>

            {/* Number display */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 mb-3">
              <p className="text-center text-3xl font-bold text-green-400">
                110
              </p>
            </div>

            {/* Warning text */}
            <p className="text-gray-400 text-sm text-center mb-6 max-w-xs">
              Gunakan fitur ini hanya untuk kondisi darurat yang membutuhkan
              penanganan segera.
            </p>

            {/* Call button */}
            <a
              href="tel:110"
              onClick={() => setOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-600 hover:bg-green-500 transition-colors font-bold text-white text-base mb-3"
            >
              <Phone className="w-5 h-5" />
              Hubungi Sekarang
            </a>

            {/* Cancel button */}
            <button
              onClick={() => setOpen(false)}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-base hover:bg-white/10 transition-colors"
            >
              Batal
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
