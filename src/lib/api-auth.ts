import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Session } from "next-auth";

type AuthResult =
  | { error: NextResponse; session: null }
  | { error: null; session: Session };

export async function requireSession(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireSession();
  if (result.error) return result;
  if (result.session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }
  return result;
}
