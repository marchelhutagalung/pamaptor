"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Registrasi gagal.");
      setIsLoading(false);
      return;
    }

    router.push("/login?registered=true");
  };

  return (
    <div className="text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pamaptor.</h1>
        <p className="text-gray-400">Buat akun untuk mulai memantau</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            {...register("name")}
            placeholder="Nama lengkap"
            className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-14 rounded-xl"
          />
          {errors.name && (
            <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

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
            {...register("phone")}
            type="tel"
            placeholder="Nomor HP (opsional)"
            className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-14 rounded-xl"
          />
        </div>

        <div>
          <Input
            {...register("password")}
            type="password"
            placeholder="Password (min. 8 karakter)"
            className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-14 rounded-xl"
            autoComplete="new-password"
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
            autoComplete="new-password"
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
          className="w-full h-14 rounded-full bg-white text-black font-semibold text-base hover:bg-gray-100 mt-2"
        >
          {isLoading ? "Mendaftar..." : "Daftar"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-8">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-white font-semibold">
          Masuk
        </Link>
      </p>
    </div>
  );
}
