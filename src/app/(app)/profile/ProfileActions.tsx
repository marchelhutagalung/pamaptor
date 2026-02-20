"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { clearAllCaches } from "@/lib/sw-register";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Pencil, Share2, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  selfieUrl?: string | null;
  phone?: string | null;
}

export default function ProfileActions({ user }: { user: User }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    setIsSaving(false);
    setEditOpen(false);
    router.refresh();
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${user.name} di Pamaptor`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link disalin!");
    }
  };

  const btnClass =
    "flex-1 flex items-center justify-center gap-2 h-10 rounded-full border border-white/20 bg-white/5 text-white text-sm font-medium hover:bg-white/15 transition-colors";
  const iconBtnClass =
    "w-10 h-10 flex items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15 transition-colors shrink-0";

  return (
    <div className="flex gap-3">
      {/* Edit Profile */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <button className={btnClass}>
            <Pencil className="w-3.5 h-3.5" />
            Edit Profil
          </button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-sm">Nama</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/10 border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-sm">No. HP</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                className="bg-white/10 border-white/10 text-white"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 bg-white text-black hover:bg-gray-100 rounded-full font-semibold disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share */}
      <button onClick={handleShare} className={btnClass}>
        <Share2 className="w-3.5 h-3.5" />
        Bagikan
      </button>

      {/* Settings */}
      <Sheet>
        <SheetTrigger asChild>
          <button className={iconBtnClass} aria-label="Pengaturan">
            <Settings className="w-4 h-4" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="bg-gray-900 border-white/10 text-white rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle className="text-white">Pengaturan</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <button
              onClick={() => {
                clearAllCaches();
                signOut({ callbackUrl: "/login" });
              }}
              className="flex items-center gap-3 w-full px-4 py-4 text-red-400 hover:bg-white/5 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Keluar</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
