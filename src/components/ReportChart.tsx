"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CategoryCount {
  label: string;
  color: string;
  count: number;
}

const INITIAL_VISIBLE = 6;

export default function ReportChart({
  categoryCounts,
}: {
  categoryCounts: CategoryCount[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (categoryCounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
        Belum ada data
      </div>
    );
  }

  const total = categoryCounts.reduce((sum, c) => sum + c.count, 0);

  // Sort descending by count
  const sorted = [...categoryCounts].sort((a, b) => b.count - a.count);

  const canExpand = sorted.length > INITIAL_VISIBLE;
  const visible = expanded ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hiddenCount = sorted.length - INITIAL_VISIBLE;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {visible.map((cat) => {
          const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
          return (
            <div
              key={cat.label}
              className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex flex-col gap-2"
            >
              {/* Category badge */}
              <span
                className="self-start text-[11px] font-semibold px-2 py-0.5 rounded-full max-w-full break-words"
                style={{
                  backgroundColor: `${cat.color}26`, // ~15% opacity
                  color: cat.color,
                }}
              >
                {cat.label}
              </span>

              {/* Count */}
              <p className="text-3xl font-bold text-white leading-none">
                {cat.count}
              </p>

              {/* Percentage label */}
              <p className="text-xs text-gray-500">{pct}% dari total</p>

              {/* Progress bar */}
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Sembunyikan
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Tampilkan {hiddenCount} kategori lainnya
            </>
          )}
        </button>
      )}
    </div>
  );
}
