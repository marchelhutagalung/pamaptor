"use client";

import { useState, useEffect, useCallback } from "react";

interface UseNotificationsOptions {
  enabled: boolean;
}

export function useNotifications({ enabled }: UseNotificationsOptions) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Silently fail — network errors shouldn't break the UI
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [enabled, fetchUnreadCount]);

  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  return { unreadCount, markAllRead, refetch: fetchUnreadCount };
}
