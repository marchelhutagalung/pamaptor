"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppImage from "@/components/AppImage";
import {
  X,
  Camera,
  Images,
  RotateCcw,
  Loader2,
  ChevronLeft,
  Search,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import LocationPicker from "@/components/LocationPicker";
import { clearDataCache } from "@/lib/sw-register";

interface Category {
  id: string;
  slug: string;
  label: string;
  color: string;
}

const uploadSchema = z.object({
  description: z.string().max(500, "Maksimal 500 karakter"),
  categoryId: z.string().min(1, "Pilih kategori kejadian"),
  locationText: z.string().min(1, "Lokasi harus diisi"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;

type PickerMode = "choose" | "camera" | "form";

export default function UploadPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<PickerMode>("choose");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [videoReady, setVideoReady] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [catSearch, setCatSearch] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  // Fetch categories from API
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  // When stream is set AND video element is mounted, attach the stream
  useEffect(() => {
    const video = videoRef.current;
    if (!stream || !video) return;

    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play().then(() => setVideoReady(true)).catch(() => {});
    };
    if (video.readyState >= 1) {
      video.play().then(() => setVideoReady(true)).catch(() => {});
    }
  }, [stream, mode]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { description: "", categoryId: "", locationText: "" },
  });

  const description = watch("description");
  const selectedCategoryId = watch("categoryId");
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const filteredCategories = catSearch
    ? categories.filter((c) =>
        c.label.toLowerCase().includes(catSearch.toLowerCase())
      )
    : categories;

  // ── Camera helpers ──────────────────────────────────────────────────────────

  const startCamera = async () => {
    setCameraError("");
    setVideoReady(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      setStream(mediaStream);
      setMode("camera");
    } catch {
      setCameraError(
        "Tidak dapat mengakses kamera. Pastikan izin kamera diberikan, atau gunakan galeri."
      );
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setVideoReady(false);
    }
  }, [stream]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !videoReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setImageBlob(blob);
        setImagePreview(URL.createObjectURL(blob));
        stopCamera();
        setMode("form");
      },
      "image/jpeg",
      0.92
    );
  };

  // ── Gallery helper ──────────────────────────────────────────────────────────

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMode("form");
  };

  const resetImage = () => {
    stopCamera();
    setImageFile(null);
    setImageBlob(null);
    setImagePreview(null);
    setMode("choose");
    setCameraError("");
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const onSubmit = async (data: UploadForm) => {
    const blob = imageBlob || imageFile;
    if (!blob) {
      setError("Silakan pilih foto terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", blob, "photo.jpg");
    formData.append("type", "post");

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      const json = await uploadRes.json();
      setError(json.error || "Gagal mengupload foto.");
      setIsLoading(false);
      return;
    }

    const { url: imageUrl } = await uploadRes.json();

    const postRes = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, imageUrl }),
    });

    if (!postRes.ok) {
      const json = await postRes.json();
      setError(json.error || "Gagal membuat laporan.");
      setIsLoading(false);
      return;
    }

    // Clear cached data so home feed shows the new post
    clearDataCache();
    router.replace("/home");
    router.refresh();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
        <button
          onClick={() => {
            if (mode === "camera") {
              stopCamera();
              setMode("choose");
            } else if (mode === "form") {
              resetImage();
            } else {
              router.back();
            }
          }}
          className="p-2 -ml-2 text-white"
          aria-label="Kembali"
        >
          {mode === "choose" ? (
            <X className="w-6 h-6" />
          ) : (
            <ChevronLeft className="w-6 h-6" />
          )}
        </button>
        <h1 className="font-semibold">Buat Laporan</h1>
        {mode === "form" ? (
          <Button
            form="upload-form"
            type="submit"
            disabled={isLoading || !imagePreview}
            className="bg-transparent text-white font-semibold p-0 h-auto hover:text-gray-300 disabled:text-gray-600"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Posting"
            )}
          </Button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {/* ── STEP 1: Choose camera or gallery ── */}
      {mode === "choose" && (
        <div className="flex flex-col items-center justify-center px-6 pt-16 pb-8 gap-6">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold mb-2">Pilih Sumber Foto</h2>
            <p className="text-gray-400 text-sm">
              Ambil foto langsung atau pilih dari galeri
            </p>
          </div>

          {cameraError && (
            <div className="w-full p-3 rounded-xl bg-red-900/50 text-red-300 text-sm text-center">
              {cameraError}
            </div>
          )}

          <button
            onClick={startCamera}
            className="w-full max-w-xs flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">Buka Kamera</p>
              <p className="text-gray-400 text-xs mt-1">
                Foto langsung dari kamera
              </p>
            </div>
          </button>

          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full max-w-xs flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Images className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">Pilih dari Galeri</p>
              <p className="text-gray-400 text-xs mt-1">
                Upload foto dari perangkat
              </p>
            </div>
          </button>
        </div>
      )}

      {/* ── STEP 2: Camera live view ── */}
      {mode === "camera" && (
        <div className="flex flex-col">
          <div className="relative w-full bg-black overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="px-6 py-4 flex justify-center bg-black">
            <button
              onClick={capture}
              disabled={!videoReady}
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-white/10 active:scale-95 transition-transform disabled:opacity-50"
              style={{ width: 72, height: 72 }}
              aria-label="Ambil foto"
            >
              <div className="rounded-full bg-white" style={{ width: 56, height: 56 }} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Form with preview ── */}
      {mode === "form" && (
        <form
          id="upload-form"
          onSubmit={handleSubmit(onSubmit)}
          className="px-4 py-4 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-xl bg-red-900/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative">
              <div className="relative aspect-video rounded-2xl overflow-hidden">
                <AppImage
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={resetImage}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                aria-label="Ganti foto"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Textarea
              {...register("description")}
              placeholder="Deskripsikan kejadian yang kamu lihat..."
              className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 rounded-xl resize-none min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {(description || "").length}/500 karakter
            </p>
          </div>

          {/* Category — searchable dropdown */}
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-sm">Kategori</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCatOpen(!catOpen)}
                className="w-full flex items-center justify-between bg-white/10 border border-white/10 rounded-xl px-3 py-3 text-sm"
              >
                {selectedCategory ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: selectedCategory.color }}
                    />
                    {selectedCategory.label}
                  </span>
                ) : (
                  <span className="text-gray-500">Pilih kategori kejadian</span>
                )}
                <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${catOpen ? "rotate-90" : "-rotate-90"}`} />
              </button>

              {catOpen && (
                <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  {/* Search input */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                    <Search className="w-4 h-4 text-gray-500 shrink-0" />
                    <input
                      type="text"
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      placeholder="Cari kategori..."
                      className="w-full bg-transparent text-white text-sm placeholder:text-gray-500 outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Options */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCategories.length === 0 ? (
                      <div className="px-3 py-3 text-gray-500 text-sm text-center">
                        Tidak ditemukan
                      </div>
                    ) : (
                      filteredCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setValue("categoryId", cat.id, { shouldValidate: true });
                            setCatOpen(false);
                            setCatSearch("");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/10 transition-colors text-left"
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="flex-1 text-white">{cat.label}</span>
                          {selectedCategoryId === cat.id && (
                            <Check className="w-4 h-4 text-blue-400" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.categoryId && (
              <p className="text-red-400 text-xs">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-sm">Tambah lokasi</Label>
            <LocationPicker
              onSelect={(loc) => {
                setValue("locationText", loc.locationText);
                if (loc.latitude) setValue("latitude", loc.latitude);
                if (loc.longitude) setValue("longitude", loc.longitude);
              }}
            />
            {errors.locationText && (
              <p className="text-red-400 text-xs">
                {errors.locationText.message}
              </p>
            )}
          </div>

          <div className="h-4" />
        </form>
      )}

      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGallerySelect}
      />
    </div>
  );
}
