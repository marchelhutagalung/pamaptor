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
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(new Set());

  const toggleLabel = (label: string) => {
    setExpandedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

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
      <div className="flex flex-col gap-1">
        {visible.map((cat) => {
          const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
          const isLabelExpanded = expandedLabels.has(cat.label);
          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => toggleLabel(cat.label)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left w-full"
            >
              {/* Color dot */}
              <span
                className="shrink-0 w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />

              {/* Label + progress */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium text-white/90 transition-all duration-200 ${
                    isLabelExpanded ? "" : "truncate"
                  }`}
                >
                  {cat.label}
                </p>
                <div className="mt-1.5 h-0.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>

              {/* Count + pct */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-white leading-none">
                  {cat.count}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">{pct}%</p>
              </div>
            </button>
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
