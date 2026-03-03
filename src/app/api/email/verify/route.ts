import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIP } from "@/lib/rate-limit";

const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const rl = rateLimit(getIP(request), "email-verify", 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.redirect(`${APP_URL}/login?error=too_many_requests`);
  }

  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/login?error=invalid_token`);
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { token },
  });

  if (!verification || verification.expiresAt < new Date()) {
    return NextResponse.redirect(`${APP_URL}/login?error=token_expired`);
  }

  await prisma.user.update({
    where: { id: verification.userId },
    data: { emailVerified: new Date() },
  });

  await prisma.emailVerification.delete({ where: { token } });

  return NextResponse.redirect(`${APP_URL}/login?verified=true`);
}
