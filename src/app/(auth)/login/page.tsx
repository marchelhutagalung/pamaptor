"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"Masyarakat" | "Petugas">("Masyarakat");

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
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      role: role === "Petugas" ? "ADMIN" : "USER",
      redirect: false,
    });

    if (result?.error) {
      setError("Email atau password salah, peran tidak sesuai, atau email belum diverifikasi.");
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
        <div className="mb-4 p-3 rounded-lg bg-red-900/50 text-red-300 text-sm">
          {error}
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
          <Input
            {...register("password")}
            type="password"
            placeholder="Kata sandi"
            className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-14 rounded-xl"
            autoComplete="current-password"
          />
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

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 rounded-full bg-white text-black font-semibold text-base hover:bg-gray-100"
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
