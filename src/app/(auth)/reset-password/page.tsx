"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    setError("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: data.password }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Gagal mengubah password.");
      setIsLoading(false);
      return;
    }

    router.push("/login?reset=true");
  };

  if (!token) {
    return (
      <div className="text-white text-center">
        <p className="text-gray-400">Link reset password tidak valid.</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
        <p className="text-gray-400 text-sm">Masukkan password baru Anda.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            {...register("password")}
            type="password"
            placeholder="Password baru"
            className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-14 rounded-xl"
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <Input
            {...register("confirmPassword")}
            type="password"
            placeholder="Konfirmasi password"
            className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-14 rounded-xl"
          />
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 rounded-full bg-white text-black font-semibold"
        >
          {isLoading ? "Menyimpan..." : "Simpan Password Baru"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-white text-center text-sm text-gray-400">Memuat...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
