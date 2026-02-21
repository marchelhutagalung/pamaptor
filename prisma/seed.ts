import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { slug: "ROBBERY", label: "Perampokan", color: "#ef4444", order: 1 },
  { slug: "ACCIDENT", label: "Kecelakaan", color: "#f97316", order: 2 },
  { slug: "FIRE", label: "Kebakaran", color: "#eab308", order: 3 },
  { slug: "DRUG_ABUSE", label: "Penyalahgunaan Narkoba", color: "#a855f7", order: 4 },
  { slug: "THEFT", label: "Pencurian", color: "#f43f5e", order: 5 },
  { slug: "FLOOD", label: "Banjir", color: "#3b82f6", order: 6 },
  { slug: "VANDALISM", label: "Vandalisme", color: "#ec4899", order: 7 },
  { slug: "OTHERS", label: "Lainnya", color: "#6b7280", order: 99 },
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
      selfieUrl: null,
    },
  });

  // Regular test user
  const userPassword = await bcrypt.hash("user123!", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@pamaptor.com" },
    update: {},
    create: {
      name: "Ksatriya Hawin",
      email: "user@pamaptor.com",
      phone: "089876543210",
      passwordHash: userPassword,
      role: "USER",
      emailVerified: new Date(),
      selfieUrl: null,
    },
  });

  console.log("✅ Created users:");
  console.log(`   Admin → email: admin@pamaptor.com  password: admin123!`);
  console.log(`   User  → email: user@pamaptor.com   password: user123!`);
  console.log("");
  console.log("📌 Note: selfieUrl is null — you will be redirected to /selfie on first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
