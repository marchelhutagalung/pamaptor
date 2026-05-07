/**
 * Cloudflare Turnstile server-side token verification.
 * Call this in API routes and NextAuth authorize() before trusting user input.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // In development, skip verification if no secret is configured
  if (!secret) {
    if (process.env.NODE_ENV === "development") return true;
    return false;
  }

  // Cloudflare Turnstile always-pass test secret — allow in dev/test
  if (secret === "1x0000000000000000000000000000000AA") return true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
        signal: controller.signal,
      }
    );

    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
