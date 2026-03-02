import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  // ── Tindak Pidana ──────────────────────────────────────────────────────────
  { slug: "MURDER",            label: "Tindak Pidana Pembunuhan",                                    color: "#dc2626", order: 1  },
  { slug: "ASSAULT",           label: "Tindak Pidana Penganiayaan",                                  color: "#ef4444", order: 2  },
  { slug: "MOB_VIOLENCE",      label: "Tindak Pidana Pengeroyokan",                                  color: "#f97316", order: 3  },
  { slug: "GROUP_FIGHT",       label: "Tindak Pidana Penyerangan dan Perkelahian Berkelompok (Tawuran)", color: "#fb923c", order: 4  },
  { slug: "UNLAWFUL_DETENTION",label: "Tindak Pidana Penyekapan",                                    color: "#f59e0b", order: 5  },
  { slug: "KIDNAPPING",        label: "Tindak Pidana Penculikan",                                    color: "#eab308", order: 6  },
  { slug: "HOSTAGE",           label: "Tindak Pidana Penyanderaan",                                  color: "#ca8a04", order: 7  },
  { slug: "SEXUAL_ASSAULT",    label: "Tindak Pidana Pencabulan",                                    color: "#ec4899", order: 8  },
  { slug: "RAPE",              label: "Tindak Pidana Perkosaan",                                     color: "#db2777", order: 9  },
  { slug: "EXTORTION",         label: "Tindak Pidana Perundungan",                                   color: "#a855f7", order: 10 },
  { slug: "DOMESTIC_VIOLENCE", label: "Tindak Pidana Kekerasan dalam Rumah Tangga",                  color: "#9333ea", order: 11 },
  { slug: "THEFT",             label: "Tindak Pidana Pencurian",                                     color: "#f43f5e", order: 12 },
  { slug: "THEFT_AGGRAVATED",  label: "Tindak Pidana Pencurian dengan Pemberatan",                   color: "#e11d48", order: 13 },
  { slug: "VEHICLE_THEFT",     label: "Tindak Pidana Pencurian Kendaraan Bermotor",                  color: "#be123c", order: 14 },
  { slug: "LIVESTOCK_THEFT",   label: "Tindak Pidana Pencurian Ternak",                              color: "#9f1239", order: 15 },
  { slug: "HOUSE_THEFT",       label: "Tindak Pidana Pencurian pada Rumah Kosong",                   color: "#881337", order: 16 },
  { slug: "ROBBERY",           label: "Tindak Pidana Pencurian dengan Kekerasan",                    color: "#7f1d1d", order: 17 },
  { slug: "EXTORTION_VIOLENT", label: "Tindak Pidana Pemerasan dengan Kekerasan",                    color: "#6b21a8", order: 18 },
  { slug: "VANDALISM_WORSHIP", label: "Tindak Pidana Perusakan Tempat Ibadah",                       color: "#1d4ed8", order: 19 },
  { slug: "VANDALISM_ELECTRIC",label: "Tindak Pidana Perusakan Bangunan Listrik",                    color: "#1e40af", order: 20 },
  { slug: "VANDALISM_TRAFFIC", label: "Tindak Pidana Perusakan Bangunan Lalu Lintas Umum",           color: "#1e3a8a", order: 21 },
  { slug: "VANDALISM_BUILDING",label: "Tindak Pidana Perusakan Gedung",                              color: "#1e3a5f", order: 22 },
  { slug: "VANDALISM_PROPERTY",label: "Tindak Pidana Perusakan dan Penghancuran Barang",             color: "#164e63", order: 23 },
  // ── Peristiwa ───────────────────────────────────────────────────────────────
  { slug: "BOMB_THREAT",       label: "Peristiwa Ancaman Bom",                                       color: "#dc2626", order: 24 },
  { slug: "TRAFFIC_ACCIDENT",  label: "Peristiwa Kecelakaan Lalu Lintas",                            color: "#f97316", order: 25 },
  { slug: "HIT_AND_RUN",       label: "Peristiwa Kecelakaan Lalu Lintas Tabrak Lari",                color: "#ea580c", order: 26 },
  { slug: "PUBLIC_TRANSPORT_ACCIDENT", label: "Peristiwa Kecelakaan Angkutan Umum",                  color: "#c2410c", order: 27 },
  { slug: "FIRE",              label: "Peristiwa Kebakaran",                                         color: "#eab308", order: 28 },
  { slug: "EARTHQUAKE",        label: "Peristiwa Gempa Bumi",                                        color: "#a16207", order: 29 },
  { slug: "FLOOD",             label: "Peristiwa Banjir",                                            color: "#3b82f6", order: 30 },
  { slug: "LANDSLIDE",         label: "Peristiwa Tanah Longsor",                                     color: "#92400e", order: 31 },
  { slug: "FOUND_BODY",        label: "Peristiwa Penemuan Mayat",                                    color: "#374151", order: 32 },
  { slug: "FOOD_POISONING",    label: "Peristiwa Keracunan Makanan",                                 color: "#15803d", order: 33 },
  // ── Program ─────────────────────────────────────────────────────────────────
  { slug: "MBG",               label: "MBG",                                                          color: "#0ea5e9", order: 34 },
  // ── Lainnya ─────────────────────────────────────────────────────────────────
  { slug: "OTHERS",            label: "Lainnya",                                                      color: "#6b7280", order: 99 },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Seed categories
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { label: cat.label, color: cat.color, order: cat.order },
      create: cat,
    });
  }
  console.log(`✅ Created ${DEFAULT_CATEGORIES.length} categories`);

  console.log("");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
