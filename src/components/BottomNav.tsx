"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { href: "/home", icon: Home, label: "Beranda" },
  { href: "/admin/laporan", icon: FileText, label: "Laporan", adminOnly: true },
  { href: "/profile", icon: User, label: "Profil" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";
  const isUser = session?.user.role === "USER";

  const { unreadCount, markAllRead } = useNotifications({
    enabled: !!session && isUser,
  });

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-white/10 safe-area-pb">
      <div className="max-w-md mx-auto flex">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          // Show unread badge on Home tab for regular users only
          const showBadge = item.href === "/home" && isUser && unreadCount > 0;

          const handleClick = () => {
            // Mark all notifications as read when user taps Home tab
            if (item.href === "/home" && isUser && unreadCount > 0) {
              markAllRead();
            }
          };

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleClick}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors",
                isActive ? "text-white" : "text-gray-500"
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    "w-6 h-6",
                    isActive && "stroke-2"
                  )}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
