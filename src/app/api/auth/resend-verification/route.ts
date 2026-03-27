import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getIP } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const rl = rateLimit(getIP(request), "resend-verification", 3, 24 * 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email diperlukan." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 to avoid leaking whether an email exists
    if (!user || user.emailVerified) {
      return NextResponse.json({ message: "Jika email terdaftar dan belum diverifikasi, link baru telah dikirim." });
    }

    // Delete old tokens for this email and create a fresh one
    await prisma.emailVerification.deleteMany({ where: { email } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerification.create({
      data: { email, token, expiresAt, userId: user.id },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json({ message: "Jika email terdaftar dan belum diverifikasi, link baru telah dikirim." });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
