import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Pamaptor",
    template: "%s | Pamaptor",
  },
  description: "Pantau dan laporkan kejadian di lingkungan Anda secara cepat dan mudah.",
  manifest: "/manifest.json",
  applicationName: "Pamaptor",
  keywords: ["laporan", "kejadian", "lingkungan", "keamanan", "masyarakat"],
  openGraph: {
    type: "website",
    siteName: "Pamaptor",
    title: "Pamaptor — Pantau Lingkungan Anda",
    description: "Laporkan kejadian di sekitar Anda secara cepat dan mudah.",
    locale: "id_ID",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f1135",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} antialiased bg-app`}>
        <ServiceWorkerProvider />
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
