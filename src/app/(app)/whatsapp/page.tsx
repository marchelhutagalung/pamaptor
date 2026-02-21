import Link from "next/link";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Daftar kontak PAMAPTA — tambah/kurangi sesuai kebutuhan (max 4)
const CONTACTS = [
  {
    name: "PAMAPTA 1",
    phone: "081234567890",
    avatar: "/images/pamapta-1.jpg", // ganti dengan foto asli
  },
  {
    name: "PAMAPTA 2",
    phone: "081234567891",
    avatar: "/images/pamapta-2.jpg",
  },
];

function formatWhatsAppUrl(phone: string) {
  // Remove leading 0, add country code 62 (Indonesia)
  const cleaned = phone.replace(/\D/g, "");
  const international = cleaned.startsWith("0")
    ? "62" + cleaned.slice(1)
    : cleaned;
  return `https://wa.me/${international}`;
}

export default function WhatsAppPage() {
  return (
    <div className="min-h-screen text-white flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-6 pb-8">
        {/* WhatsApp Icon */}
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-5">
          <MessageCircle className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">PAMAPTA MONITOR</h1>
        <p className="text-gray-400 text-sm text-center mb-8 max-w-xs">
          Butuh bantuan atau ingin melaporkan kejadian secara langsung? Silakan
          hubungi tim PAMAPTA di bawah ini melalui WhatsApp.
        </p>

        {/* Contact Cards */}
        <div className="w-full space-y-4">
          {CONTACTS.map((contact) => (
            <div
              key={contact.phone}
              className="bg-white/5 border border-white/10 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12 border border-white/20">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="bg-white/10 text-white text-sm">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-base">{contact.name}</p>
                  <p className="text-gray-400 text-sm">{contact.phone}</p>
                </div>
              </div>
              <a
                href={formatWhatsAppUrl(contact.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 transition-colors font-semibold text-white text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Chat WhatsApp
              </a>
            </div>
          ))}
        </div>

        {/* Emergency call */}
        <div className="mt-8 w-full">
          <p className="text-gray-500 text-xs text-center mb-3">
            Darurat? Hubungi langsung:
          </p>
          <a
            href="tel:110"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 transition-colors font-semibold text-white text-sm"
          >
            <Phone className="w-4 h-4" />
            Panggil 110
          </a>
        </div>
      </div>
    </div>
  );
}
