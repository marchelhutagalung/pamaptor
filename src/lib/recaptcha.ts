/**
 * Server-side reCAPTCHA v3 verification helper.
 *
 * - If RECAPTCHA_SECRET_KEY is not set, verification is skipped (dev mode).
 * - Rejects tokens with score < 0.5 (Google's recommended threshold).
 */

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export async function verifyRecaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // Skip verification in dev (no secret configured)
  if (!secret) return true;

  // No token provided — fail
  if (!token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data: RecaptchaResponse = await res.json();

    // Must be successful AND score >= 0.5
    return data.success === true && (data.score ?? 0) >= 0.5;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}
