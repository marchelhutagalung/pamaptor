"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password harus diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"Masyarakat" | "Petugas">("Masyarakat");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setMessage("Email berhasil diverifikasi. Silakan masuk.");
    }
    if (searchParams.get("registered") === "true") {
      setMessage("Registrasi berhasil. Cek email Anda untuk verifikasi.");
    }
    if (searchParams.get("error") === "token_expired") {
      setError("Link verifikasi sudah kedaluwarsa. Silakan daftar ulang.");
    }
    if (searchParams.get("error") === "invalid_token") {
      setError("Link verifikasi tidak valid.");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    if (!captchaToken) {
      setError("Selesaikan verifikasi CAPTCHA terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      role: role === "Petugas" ? "ADMIN" : "USER",
      captchaToken,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "EmailNotVerified") {
        setError("Email belum diverifikasi. Cek inbox Anda atau kirim ulang link verifikasi.");
        setUnverifiedEmail(data.email);
      } else {
        setError("Email atau password salah, atau peran tidak sesuai.");
        setUnverifiedEmail("");
      }
      turnstileRef.current?.reset();
      setCaptchaToken(null);
      setIsLoading(false);
      return;
    }

    // Fetch session to determine role and selfie status
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();

    if (!session?.user) {
      setError("Gagal masuk. Silakan coba lagi.");
      setIsLoading(false);
      return;
    }

    if (!session.user.selfieUrl) {
      router.push("/selfie");
    } else if (session.user.role === "ADMIN") {
      router.push("/admin/laporan");
    } else {
      router.push("/home");
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unverifiedEmail }),
    });
    setResendLoading(false);
    if (res.status === 429) {
      setError("Terlalu banyak percobaan. Tunggu 24 jam sebelum mengirim ulang.");
      return;
    }
    setError("");
    setUnverifiedEmail("");
    setMessage("Link verifikasi baru telah dikirim. Cek email Anda.");
  };

  return (
    <div className="text-white">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Pamaptor.</h1>
        <p className="text-gray-400">Masuk untuk pantau lingkungan Anda</p>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-900/50 text-green-300 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/50 text-red-300 text-sm space-y-2">
          <p>{error}</p>
          {unverifiedEmail && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="underline text-red-200 hover:text-white disabled:opacity-50"
            >
              {resendLoading ? "Mengirim..." : "Kirim ulang email verifikasi"}
            </button>
          )}
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-3">Masuk sebagai:</p>
        <div className="grid grid-cols-2 gap-3">
          {(["Masyarakat", "Petugas"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex items-center gap-2 px-4 py-3 rounded-full border text-sm font-medium transition-colors ${
                role === r
                  ? "border-white bg-white/10 text-white"
                  : "border-white/20 text-gray-400"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  role === r ? "border-white" : "border-gray-500"
                }`}
              >
                {role === r && (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </span>
              {r}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            {...register("email")}
            type="email"
            placeholder="Email"
            className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-14 rounded-xl"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Kata sandi"
              className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-14 rounded-xl pr-12"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-gray-400 hover:text-white"
          >
            Lupa kata sandi?
          </Link>
        </div>

        <Turnstile
          ref={turnstileRef}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={(token) => { setCaptchaToken(token); setCaptchaError(false); }}
          onExpire={() => setCaptchaToken(null)}
          onError={() => { setCaptchaToken(null); setCaptchaError(true); }}
          options={{ theme: "dark" }}
        />
        {captchaError && (
          <p className="text-yellow-400 text-xs">
            Verifikasi gagal.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => { setCaptchaError(false); turnstileRef.current?.reset(); }}
            >
              Coba lagi
            </button>
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading || !captchaToken}
          className="w-full h-14 rounded-full bg-white text-black font-semibold text-base hover:bg-gray-100 disabled:opacity-50"
        >
          {isLoading ? "Memuat..." : "Masuk"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-8">
        Belum punya akun?{" "}
        <Link href="/register" className="text-white font-semibold">
          Daftar Sekarang
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-white text-center text-sm text-gray-400">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
