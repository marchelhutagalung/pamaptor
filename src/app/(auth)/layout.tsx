import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pamaptor",
  description: "Masuk atau daftar akun Pamaptor untuk melaporkan kejadian di sekitar Anda.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
