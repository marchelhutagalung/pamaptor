"use client";

import { useState } from "react";
import { Share2, Instagram, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { addWatermark } from "@/lib/watermark";

interface ShareButtonProps {
  imageUrl: string;
  description: string;
}

export default function ShareButton({ imageUrl, description }: ShareButtonProps) {
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInstagramStory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const watermarked = await addWatermark(blob);
      const file = new File([watermarked], "pamaptor.jpg", { type: "image/jpeg" });

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ files: [file] });
          setSheetOpen(false);
          return;
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
        }
      }

      // Fallback: download watermarked image + guide user
      const objectUrl = URL.createObjectURL(watermarked);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "pamaptor.jpg";
      a.click();
      URL.revokeObjectURL(objectUrl);
      setSheetOpen(false);
      toast({
        title: "Gambar diunduh",
        description: "Buka Instagram, buat Story baru, lalu pilih gambar ini.",
      });
    } catch {
      toast({
        title: "Gagal memuat gambar",
        description: "Periksa koneksi internet Anda.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors py-0.5"
        aria-label="Bagikan"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="text-xs">Bagikan</span>
      </button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-gray-900 border-white/10 text-white rounded-t-2xl"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="text-white">Bagikan</SheetTitle>
          </SheetHeader>

          <div className="py-2">
            <button
              type="button"
              onClick={handleInstagramStory}
              disabled={isLoading}
              className="flex items-center gap-4 w-full px-4 py-3.5 text-white hover:bg-white/5 rounded-xl transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f9ce34]/20 via-[#ee2a7b]/20 to-[#6228d7]/20 flex items-center justify-center shrink-0">
                {isLoading
                  ? <Loader2 style={{ width: 18, height: 18 }} className="text-[#ee2a7b] animate-spin" />
                  : <Instagram style={{ width: 18, height: 18 }} className="text-[#ee2a7b]" />
                }
              </span>
              <div>
                <p className="text-sm font-medium">Instagram Story</p>
                <p className="text-xs text-gray-400">
                  {isLoading ? "Memuat gambar..." : "Bagikan sebagai Story"}
                </p>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
