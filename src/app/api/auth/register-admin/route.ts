import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const registerAdminSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional(),
  password: z.string().min(8, "Password minimal 8 karakter"),
  secret: z.string().min(1, "Secret key diperlukan"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
        emailVerified: new Date(), // Auto-verified for admin
      },
    });

    return NextResponse.json(
      {
        message: "Admin berhasil didaftarkan.",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
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
