"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});

type ForgotForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    await fetch("/api/email/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setIsLoading(false);
    setSent(true);
  };

  return (
    <div className="text-white">
      <Link
        href="/login"
        className="flex items-center gap-2 text-gray-400 mb-8 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Lupa Kata Sandi</h1>
        <p className="text-gray-400 text-sm">
          Masukkan email Anda dan kami akan mengirim link reset password.
        </p>
      </div>

      {sent ? (
        <div className="p-4 rounded-xl bg-green-900/50 text-green-300 text-sm">
          Jika email tersebut terdaftar, link reset password telah dikirim.
          Silakan cek inbox Anda.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register("email")}
              type="email"
              placeholder="Email"
              className="bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-14 rounded-xl"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 rounded-full bg-white text-black font-semibold"
          >
            {isLoading ? "Mengirim..." : "Kirim Link Reset"}
          </Button>
        </form>
      )}
    </div>
  );
}
