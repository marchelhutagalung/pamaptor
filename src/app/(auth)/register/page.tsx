"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || /^\+?[0-9]+$/.test(val), {
        message: "Nomor HP hanya boleh berisi angka dan tanda +",
      }),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
    role: z.enum(["Masyarakat", "Petugas"]),
    secret: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => data.role !== "Petugas" || (data.secret && data.secret.length > 0),
    {
      message: "Kode akses petugas harus diisi",
      path: ["secret"],
    }
  );

type RegisterForm = z.infer<typeof registerSchema>;

const inputClass =
  "bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-14 rounded-xl";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "Masyarakat" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError("");

    const isPetugas = data.role === "Petugas";

    const endpoint = isPetugas
      ? "/api/auth/register-admin"
      : "/api/auth/register";

    const body = isPetugas
      ? { name: data.name, email: data.email, phone: data.phone, password: data.password, secret: data.secret }
      : { name: data.name, email: data.email, phone: data.phone, password: data.password };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Registrasi gagal.");
      setIsLoading(false);
      return;
    }

    // Petugas is auto-verified, redirect straight to login
    // Masyarakat needs email verification
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

      {/* Role selector */}
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-3">Daftar sebagai:</p>
        <div className="grid grid-cols-2 gap-3">
          {(["Masyarakat", "Petugas"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setValue("role", r, { shouldValidate: true })}
              className={`flex items-center gap-2 px-4 py-3 rounded-full border text-sm font-medium transition-colors ${
                selectedRole === r
                  ? "border-white bg-white/10 text-white"
                  : "border-white/20 text-gray-400"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedRole === r ? "border-white" : "border-gray-500"
                }`}
              >
                {selectedRole === r && (
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
            {...register("name")}
            placeholder="Nama lengkap"
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
          />
          {errors.phone && (
            <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <Input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Password (min. 8 karakter)"
              className={inputClass + " pr-12"}
              autoComplete="new-password"
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

        <div>
          <div className="relative">
            <Input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Konfirmasi password"
              className={inputClass + " pr-12"}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Secret field — only shown for Petugas */}
        {selectedRole === "Petugas" && (
          <div>
            <div className="relative">
              <Input
                {...register("secret")}
                type={showSecret ? "text" : "password"}
                placeholder="Kode akses petugas"
                className={inputClass + " pr-12"}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.secret && (
              <p className="text-red-400 text-xs mt-1">
                {errors.secret.message}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1 px-1">
              Kode ini diberikan oleh admin Pamaptor.
            </p>
          </div>
        )}

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
