import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { token },
  });

  if (!verification || verification.expiresAt < new Date()) {
    return NextResponse.redirect(
      new URL("/login?error=token_expired", request.url)
    );
  }

  await prisma.user.update({
    where: { id: verification.userId },
    data: { emailVerified: new Date() },
  });

  await prisma.emailVerification.delete({ where: { token } });

  return NextResponse.redirect(new URL("/login?verified=true", request.url));
}
