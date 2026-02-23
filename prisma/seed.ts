import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

// Dummy image URLs from Picsum (stable, no auth needed)
const DUMMY_IMAGES = [
  "https://picsum.photos/seed/fire1/800/600",
  "https://picsum.photos/seed/flood2/800/600",
  "https://picsum.photos/seed/accident3/800/600",
  "https://picsum.photos/seed/robbery4/800/600",
  "https://picsum.photos/seed/vandal5/800/600",
  "https://picsum.photos/seed/theft6/800/600",
  "https://picsum.photos/seed/drug7/800/600",
  "https://picsum.photos/seed/other8/800/600",
  "https://picsum.photos/seed/fire9/800/600",
  "https://picsum.photos/seed/accident10/800/600",
];

// Dummy posts data — 20 realistic Indonesian incident reports
const DUMMY_POSTS = [
  {
    description: "Terjadi kebakaran di rumah warga di Gang Mawar. Api cukup besar dan sudah merambat ke rumah sebelah. Warga sekitar sudah berusaha memadamkan dengan alat seadanya.",
    locationText: "Gang Mawar No. 12, Kelurahan Pademangan, Jakarta Utara",
    latitude: -6.1344,
    longitude: 106.8446,
    status: "DALAM_TINDAK_LANJUT",
    isPinned: true,
    categorySlug: "FIRE",
    daysAgo: 0,
  },
  {
    description: "Ditemukan sepeda motor Yamaha NMAX warna hitam terparkir mencurigakan di depan minimarket sejak 3 hari lalu. Tidak ada yang mengambil dan plat nomor sudah dilepas.",
    locationText: "Jl. Raya Bekasi KM 18, Cakung, Jakarta Timur",
    latitude: -6.1867,
    longitude: 106.9775,
    status: "PERLU_PERHATIAN",
    isPinned: false,
    categorySlug: "THEFT",
    daysAgo: 1,
  },
  {
    description: "Tabrakan beruntun antara 3 kendaraan di persimpangan lampu merah. Terdapat 2 korban luka-luka yang sudah dibawa ke RS Cipto. Lalu lintas macet total.",
    locationText: "Persimpangan Jl. Gatot Subroto – Jl. Semanggi, Jakarta Selatan",
    latitude: -6.2297,
    longitude: 106.8177,
    status: "SUDAH_DITINDAKLANJUTI",
    isPinned: false,
    categorySlug: "ACCIDENT",
    daysAgo: 1,
  },
  {
    description: "Terjadi perampokan di warung kelontong. Pelaku 2 orang, salah satunya bersenjata, mengambil uang kasir sekitar 3 juta rupiah kemudian kabur dengan motor.",
    locationText: "Jl. Mangga Besar Raya No. 45, Taman Sari, Jakarta Barat",
    latitude: -6.1481,
    longitude: 106.8205,
    status: "PERLU_PERHATIAN",
    isPinned: true,
    categorySlug: "ROBBERY",
    daysAgo: 2,
  },
  {
    description: "Banjir setinggi lutut orang dewasa sudah merendam jalan utama dan masuk ke dalam rumah warga. Beberapa warga lansia butuh bantuan evakuasi.",
    locationText: "Jl. Pluit Timur Raya, Penjaringan, Jakarta Utara",
    latitude: -6.1126,
    longitude: 106.7938,
    status: "DALAM_TINDAK_LANJUT",
    isPinned: false,
    categorySlug: "FLOOD",
    daysAgo: 2,
  },
  {
    description: "Tembok pagar SD Negeri 05 dicorat-coret dengan tulisan dan gambar tidak senonoh menggunakan cat semprot warna merah. Kejadian diduga terjadi malam hari.",
    locationText: "SDN 05 Cempaka Putih, Jl. Cempaka Putih Timur, Jakarta Pusat",
    latitude: -6.1748,
    longitude: 106.8729,
    status: "HANYA_INFORMASI",
    isPinned: false,
    categorySlug: "VANDALISM",
    daysAgo: 3,
  },
  {
    description: "Warga menemukan beberapa remaja sedang menggunakan narkoba jenis sabu di kolong jembatan. Sudah diusir tapi khawatir akan kembali malam hari.",
    locationText: "Kolong Jembatan Rel KA, Jl. Layang Casablanca, Tebet, Jakarta Selatan",
    latitude: -6.2278,
    longitude: 106.8551,
    status: "PERLU_PERHATIAN",
    isPinned: false,
    categorySlug: "DRUG_ABUSE",
    daysAgo: 3,
  },
  {
    description: "Handphone Samsung Galaxy S22 milik penumpang KRL dicuri saat kepadatan penumpang di dalam gerbong. Pelaku sudah turun di stasiun berikutnya sebelum bisa ditangkap.",
    locationText: "KRL Commuter Line, Stasiun Tanah Abang, Jakarta Pusat",
    latitude: -6.1964,
    longitude: 106.8142,
    status: "SUDAH_DITINDAKLANJUTI",
    isPinned: false,
    categorySlug: "THEFT",
    daysAgo: 4,
  },
  {
    description: "Kebocoran gas elpiji 3kg di dapur rumah warga menyebabkan ledakan kecil. Tidak ada korban jiwa namun dapur mengalami kerusakan dan warga panik.",
    locationText: "Jl. Kebon Jeruk Raya No. 23, Kebon Jeruk, Jakarta Barat",
    latitude: -6.1924,
    longitude: 106.7758,
    status: "SUDAH_DITINDAKLANJUTI",
    isPinned: false,
    categorySlug: "FIRE",
    daysAgo: 5,
  },
  {
    description: "Pohon besar tumbang akibat angin kencang dan menimpa 2 kendaraan roda empat yang terparkir di tepi jalan. Jalan terhalang separuh dan butuh alat berat untuk evakuasi.",
    locationText: "Jl. Sudirman No. 88, Senayan, Jakarta Selatan",
    latitude: -6.2154,
    longitude: 106.8174,
    status: "SUDAH_DITINDAKLANJUTI",
    isPinned: false,
    categorySlug: "OTHERS",
    daysAgo: 5,
  },
  {
    description: "Warga melaporkan ada orang tidak dikenal yang berkeliaran di sekitar kompleks perumahan sejak 3 malam terakhir. Gerak-geriknya mencurigakan dan menolak ditanya.",
    locationText: "Komplek Perumahan Taman Surya, Cengkareng, Jakarta Barat",
    latitude: -6.1505,
    longitude: 106.7375,
    status: "PERLU_PERHATIAN",
    isPinned: false,
    categorySlug: "ROBBERY",
    daysAgo: 6,
  },
  {
    description: "Kecelakaan tunggal, motor menabrak separator jalan tol dan pengemudi terpental. Korban sudah ditolong warga sekitar dan menunggu ambulans.",
    locationText: "Tol Jakarta Outer Ring Road KM 24, Kamal, Jakarta Barat",
    latitude: -6.1265,
    longitude: 106.7213,
    status: "SUDAH_DITINDAKLANJUTI",
    isPinned: false,
    categorySlug: "ACCIDENT",
    daysAgo: 6,
  },
  {
    description: "Pompa air rusak menyebabkan genangan setinggi 40cm di depan Pasar Minggu tidak surut sejak pagi. Pedagang dan pembeli kesulitan akses dan banyak barang dagangan rusak.",
    locationText: "Pasar Minggu, Jl. Ragunan, Jakarta Selatan",
    latitude: -6.2928,
    longitude: 106.8412,
    status: "DALAM_TINDAK_LANJUT",
    isPinned: false,
    categorySlug: "FLOOD",
    daysAgo: 7,
  },
  {
    description: "Kabel listrik PLN menjuntai rendah di atas jalan setelah tiang listrik miring akibat ditabrak truk. Berbahaya bagi warga yang lewat terutama anak-anak.",
    locationText: "Jl. Cipinang Muara, Jatinegara, Jakarta Timur",
    latitude: -6.2166,
    longitude: 106.8816,
    status: "PERLU_PERHATIAN",
    isPinned: false,
    categorySlug: "OTHERS",
    daysAgo: 8,
  },
  {
    description: "Sekelompok pemuda memecahkan kaca etalase toko elektronik dan mencuri beberapa barang. Rekaman CCTV ada tapi kualitasnya kurang jelas karena malam hari.",
    locationText: "Jl. Mangga Dua Raya No. 67, Sawah Besar, Jakarta Pusat",
    latitude: -6.1408,
    longitude: 106.8268,
    status: "PERLU_PERHATIAN",
    isPinned: false,
    categorySlug: "ROBBERY",
    daysAgo: 9,
  },
  {
    description: "Ditemukan beberapa jarum suntik bekas dan alat isap narkoba berserakan di taman bermain anak-anak RT 05. Sangat membahayakan keselamatan anak-anak.",
    locationText: "Taman RT 05, Kelurahan Kapuk, Cengkareng, Jakarta Barat",
    latitude: -6.1448,
    longitude: 106.7321,
    status: "SUDAH_DITINDAKLANJUTI",
    isPinned: false,
    categorySlug: "DRUG_ABUSE",
    daysAgo: 10,
  },
  {
    description: "Kebakaran lahan kosong di pinggir kali membakar beberapa tumpukan sampah dan merambat ke warung kayu di dekatnya. Asap tebal mengganggu warga sekitar.",
    locationText: "Pinggir Kali Ciliwung, Bukit Duri, Tebet, Jakarta Selatan",
    latitude: -6.2355,
    longitude: 106.8506,
    status: "TIDAK_DAPAT_DITINDAKLANJUTI",
    isPinned: false,
    categorySlug: "FIRE",
    daysAgo: 12,
  },
  {
    description: "Terjadi perkelahian antar kelompok remaja di depan sekolah seusai jam pulang. Ada yang terluka terkena benda tumpul. Warga sekitar sudah memisahkan.",
    locationText: "SMA Negeri 68, Jl. Salemba Raya, Senen, Jakarta Pusat",
    latitude: -6.1966,
    longitude: 106.8477,
    status: "SUDAH_DITINDAKLANJUTI",
    isPinned: false,
    categorySlug: "OTHERS",
    daysAgo: 13,
  },
  {
    description: "Dinding mural baru yang dibuat oleh komunitas seni lokal di tembok jembatan dirusak dan dicat ulang oleh orang tak bertanggung jawab. Kerugian diperkirakan jutaan rupiah.",
    locationText: "Jembatan Kampung Melayu, Jl. Jatinegara, Jakarta Timur",
    latitude: -6.2148,
    longitude: 106.8754,
    status: "HANYA_INFORMASI",
    isPinned: false,
    categorySlug: "VANDALISM",
    daysAgo: 14,
  },
  {
    description: "Motor Vario 125 dengan plat B 3421 XYZ dilaporkan hilang dari tempat parkir indomaret. Pemilik memarkir motor sekitar pukul 19.00 dan sudah tidak ada saat kembali pukul 19.30.",
    locationText: "Indomaret Jl. Raya Bogor KM 22, Ciracas, Jakarta Timur",
    latitude: -6.3147,
    longitude: 106.8862,
    status: "HANYA_INFORMASI",
    isPinned: false,
    categorySlug: "THEFT",
    daysAgo: 15,
  },
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

  // Fetch all categories for lookup
  const categories = await prisma.category.findMany();
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // Admin user
  const adminPassword = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pamaptor.com" },
    update: {},
    create: {
      name: "Admin Pamaptor",
      email: "admin@pamaptor.com",
      phone: "081234567890",
      passwordHash: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
      selfieUrl: "https://i.pravatar.cc/150?u=admin",
    },
  });

  // Regular test users
  const userPassword = await bcrypt.hash("user123!", 12);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "user@pamaptor.com" },
      update: {},
      create: {
        name: "Ksatriya Hawin",
        email: "user@pamaptor.com",
        phone: "089876543210",
        passwordHash: userPassword,
        role: "USER",
        emailVerified: new Date(),
        selfieUrl: "https://i.pravatar.cc/150?u=user1",
      },
    }),
    prisma.user.upsert({
      where: { email: "budi@pamaptor.com" },
      update: {},
      create: {
        name: "Budi Santoso",
        email: "budi@pamaptor.com",
        phone: "081298765432",
        passwordHash: userPassword,
        role: "USER",
        emailVerified: new Date(),
        selfieUrl: "https://i.pravatar.cc/150?u=user2",
      },
    }),
    prisma.user.upsert({
      where: { email: "sari@pamaptor.com" },
      update: {},
      create: {
        name: "Sari Dewi",
        email: "sari@pamaptor.com",
        phone: "087756123456",
        passwordHash: userPassword,
        role: "USER",
        emailVerified: new Date(),
        selfieUrl: "https://i.pravatar.cc/150?u=user3",
      },
    }),
    prisma.user.upsert({
      where: { email: "hendra@pamaptor.com" },
      update: {},
      create: {
        name: "Hendra Wijaya",
        email: "hendra@pamaptor.com",
        phone: "082234561234",
        passwordHash: userPassword,
        role: "USER",
        emailVerified: new Date(),
        selfieUrl: "https://i.pravatar.cc/150?u=user4",
      },
    }),
  ]);

  console.log("✅ Created users:");
  console.log(`   Admin  → email: admin@pamaptor.com   password: admin123!`);
  console.log(`   User 1 → email: user@pamaptor.com    password: user123!`);
  console.log(`   User 2 → email: budi@pamaptor.com    password: user123!`);
  console.log(`   User 3 → email: sari@pamaptor.com    password: user123!`);
  console.log(`   User 4 → email: hendra@pamaptor.com  password: user123!`);

  // Seed 20 dummy posts
  let postCount = 0;
  for (let i = 0; i < DUMMY_POSTS.length; i++) {
    const p = DUMMY_POSTS[i];
    const categoryId = catMap[p.categorySlug];
    if (!categoryId) continue;

    // Rotate through the 4 regular users as reporters
    const reporter = users[i % users.length];
    const imageUrl = DUMMY_IMAGES[i % DUMMY_IMAGES.length];

    const daysAgo = p.daysAgo;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    // Vary the hour a bit so ordering looks natural
    createdAt.setHours(8 + (i % 14), (i * 7) % 60, 0, 0);

    // Check if post already exists (idempotent: match by description)
    const existing = await prisma.post.findFirst({
      where: { description: p.description },
    });

    if (!existing) {
      await prisma.post.create({
        data: {
          imageUrl,
          description: p.description,
          categoryId,
          locationText: p.locationText,
          latitude: p.latitude,
          longitude: p.longitude,
          status: p.status as any,
          isPinned: p.isPinned,
          isRead: p.status !== "HANYA_INFORMASI", // unread only for newly received
          userId: reporter.id,
          createdAt,
          updatedAt: createdAt,
        },
      });
      postCount++;
    }
  }

  console.log(`✅ Created ${postCount} dummy posts (skipped existing)`);

  // Add a couple of internal notes on the pinned report
  const pinnedPost = await prisma.post.findFirst({
    where: { isPinned: true },
    orderBy: { createdAt: "desc" },
  });

  if (pinnedPost) {
    const existingNote = await prisma.reportNote.findFirst({
      where: { postId: pinnedPost.id },
    });
    if (!existingNote) {
      await prisma.reportNote.createMany({
        data: [
          {
            content: "Unit Damkar Koja sudah diberangkatkan pukul 14.23. ETA 10 menit.",
            postId: pinnedPost.id,
            adminId: admin.id,
          },
          {
            content: "Api berhasil dipadamkan pukul 15.10. Tidak ada korban jiwa. 2 rumah rusak berat.",
            postId: pinnedPost.id,
            adminId: admin.id,
          },
        ],
      });
      console.log(`✅ Added 2 internal notes to pinned report`);
    }
  }

  console.log("");
  console.log("🎉 Seeding complete!");
  console.log("📌 Note: Users with selfieUrl set will go directly to /home on login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
