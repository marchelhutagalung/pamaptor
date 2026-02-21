import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-md mx-auto pb-20">{children}</div>
      <BottomNav />
      <Toaster />
    </div>
  );
}
