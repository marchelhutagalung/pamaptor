import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Pamaptor",
  description: "Masuk atau daftar akun Pamaptor untuk melaporkan kejadian di sekitar Anda.",
};

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">{children}</div>
      {recaptchaSiteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
          strategy="afterInteractive"
        />
      )}
    </div>
  );
}
