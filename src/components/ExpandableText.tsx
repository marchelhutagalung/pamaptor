"use client";

import { useState, useRef, useEffect } from "react";

interface ExpandableTextProps {
  text: string;
  className?: string;
}

export default function ExpandableText({ text, className }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // After mount, check if the text is actually overflowing 3 lines
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight);
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={`text-gray-200 text-sm leading-relaxed ${!expanded ? "line-clamp-3" : ""} ${className ?? ""}`}
      >
        {text}
      </p>

      {isClamped && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          Selengkapnya
        </button>
      )}

      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          Sembunyikan
        </button>
      )}
    </div>
  );
}
