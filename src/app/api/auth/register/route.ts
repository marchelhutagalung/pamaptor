import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import crypto from "crypto";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password minimal 8 karakter"),
  tncAccepted: z.literal(true, { errorMap: () => ({ message: "Anda harus menyetujui syarat dan ketentuan" }) }),
  captchaToken: z.string().min(1, "CAPTCHA diperlukan"),
});

export async function POST(request: NextRequest) {
  const rl = rateLimit(getIP(request), "register", 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password, captchaToken } = validation.data;

    const captchaValid = await verifyTurnstile(captchaToken);
    if (!captchaValid) {
      return NextResponse.json(
        { error: "Verifikasi CAPTCHA gagal. Silakan coba lagi." },
        { status: 400 }
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
        tncAccepted: true,
        tncAcceptedAt: new Date(),
      },
    });

    // Create email verification token
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

    let emailSent = true;
    try {
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      emailSent = false;
      console.error("Register: failed to send verification email to", email, emailError);
    }

    return NextResponse.json(
      {
        message: emailSent
          ? "Registrasi berhasil. Silakan cek email untuk verifikasi."
          : "Akun berhasil dibuat, tetapi email verifikasi gagal terkirim. Silakan hubungi admin.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
