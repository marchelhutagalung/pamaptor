import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    const { email } = validation.data;

    // Always return success to prevent user enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate any existing reset tokens for this user
      await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

      await prisma.passwordReset.create({
        data: { email, token, expiresAt, userId: user.id },
      });

      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({
      message: "Jika email terdaftar, link reset password telah dikirim.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
