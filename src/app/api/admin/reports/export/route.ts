import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, string> = {
  HANYA_INFORMASI: "Hanya Informasi",
  PERLU_PERHATIAN: "Perlu Perhatian",
  DALAM_TINDAK_LANJUT: "Dalam Tindak Lanjut",
  SUDAH_DITINDAKLANJUTI: "Sudah Ditindaklanjuti",
  TIDAK_DAPAT_DITINDAKLANJUTI: "Tidak Dapat Ditindaklanjuti",
};

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.PostWhereInput = {};
  if (from || to) {
    where.createdAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) }),
    };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { label: true } },
      user: {
        select: { name: true, email: true, phone: true },
      },
    },
  });

  const rows = posts.map((post, index) => ({
    No: index + 1,
    Tanggal: format(post.createdAt, "dd/MM/yyyy HH:mm"),
    Kategori: post.category.label,
    Deskripsi: post.description,
    Lokasi: post.locationText,
    Status: STATUS_LABELS[post.status] || post.status,
    Pelapor: post.user.name,
    "Email Pelapor": post.user.email,
    "No. HP Pelapor": post.user.phone || "-",
    "URL Foto": post.imageUrl,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

  // Auto-size columns
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, 20),
  }));
  worksheet["!cols"] = colWidths;

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const fromLabel = from || "awal";
  const toLabel = to || format(new Date(), "yyyy-MM-dd");
  const filename = `pamaptor-laporan-${fromLabel}-${toLabel}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
