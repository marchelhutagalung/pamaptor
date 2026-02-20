"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, Upload } from "lucide-react";
import AppImage from "@/components/AppImage";

export default function SelfiePage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // When stream is set AND video element is mounted, attach the stream
  useEffect(() => {
    const video = videoRef.current;
    if (!stream || !video) return;

    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play().then(() => setVideoReady(true)).catch(() => {});
    };
    // If metadata already loaded
    if (video.readyState >= 1) {
      video.play().then(() => setVideoReady(true)).catch(() => {});
    }
  }, [stream, cameraActive]); // cameraActive triggers re-run after video element mounts

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setError("");
    setVideoReady(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
      });
      // Set state — the useEffect above will attach stream to video once it mounts
      setStream(mediaStream);
      setCameraActive(true);
    } catch {
      setError("Tidak dapat mengakses kamera. Gunakan upload foto sebagai gantinya.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setCameraActive(false);
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
    // Mirror the image for selfie
    ctx.scale(-1, 1);
    ctx.drawImage(video, -w, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setPreview(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedBlob(file);
    setPreview(URL.createObjectURL(file));
    stopCamera();
  };

  const handleUpload = async () => {
    if (!capturedBlob) return;
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", capturedBlob, "selfie.jpg");
    formData.append("type", "selfie");

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      setError("Gagal mengupload foto. Silakan coba lagi.");
      setIsLoading(false);
      return;
    }

    const { url } = await uploadRes.json();

    const saveRes = await fetch("/api/users/selfie", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selfieUrl: url }),
    });

    if (!saveRes.ok) {
      setError("Gagal menyimpan foto. Silakan coba lagi.");
      setIsLoading(false);
      return;
    }

    await updateSession();
    // Small delay to ensure the JWT cookie is fully set before navigation
    await new Promise((r) => setTimeout(r, 300));
    router.replace("/home");
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Foto Profil</h1>
          <p className="text-gray-400 text-sm">
            Ambil selfie atau upload foto untuk profil Anda
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="mb-6 flex justify-center">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white/20">
              <AppImage src={preview} alt="Preview" fill className="object-cover" />
            </div>
          </div>
        )}

        {/* Camera view */}
        {cameraActive && (
          <div className="mb-4 relative overflow-hidden rounded-2xl aspect-square bg-gray-900">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <div className="space-y-3">
          {!cameraActive && !preview && (
            <>
              <button
                onClick={startCamera}
                className="w-full h-14 rounded-full bg-white text-black font-semibold flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Buka Kamera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-14 rounded-full border border-white/20 text-white font-semibold flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Upload Foto
              </button>
            </>
          )}

          {cameraActive && (
            <button
              onClick={capture}
              disabled={!videoReady}
              className="w-full h-14 rounded-full bg-white text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {videoReady ? "Ambil Foto" : "Memuat kamera..."}
            </button>
          )}

          {preview && !cameraActive && (
            <>
              <button
                onClick={handleUpload}
                disabled={isLoading}
                className="w-full h-14 rounded-full bg-white text-black font-semibold disabled:opacity-50"
              >
                {isLoading ? "Menyimpan..." : "Gunakan Foto Ini"}
              </button>
              <button
                onClick={() => {
                  setPreview(null);
                  setCapturedBlob(null);
                }}
                className="w-full h-14 rounded-full border border-white/20 text-white font-semibold bg-white/5 hover:bg-white/10 transition-colors"
              >
                Foto Ulang
              </button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
