import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";

const registerAdminSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password minimal 8 karakter"),
  secret: z.string().min(1, "Secret key diperlukan"),
});

export async function POST(request: NextRequest) {
  const rl = rateLimit(getIP(request), "register-admin", 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const body = await request.json();

    // Verify reCAPTCHA token
    const isHuman = await verifyRecaptcha(body.recaptchaToken);
    if (!isHuman) {
      return NextResponse.json(
        { error: "Verifikasi reCAPTCHA gagal. Silakan coba lagi." },
        { status: 400 }
      );
    }

    const validation = registerAdminSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password, secret } = validation.data;

    // Validate secret key
    const adminSecret = process.env.ADMIN_REGISTER_SECRET;
    if (!adminSecret || secret !== adminSecret) {
      return NextResponse.json(
        { error: "Secret key tidak valid" },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "ADMIN",
        // emailVerified is null until they verify via email
      },
    });

    // Create email verification token (same as regular users)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerification.create({
      data: {
        email,
        token,
        expiresAt,
        userId: user.id,
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: "Registrasi berhasil. Silakan cek email untuk verifikasi." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register admin error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
