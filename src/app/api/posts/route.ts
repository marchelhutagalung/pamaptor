import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Accept both full URLs (GCS in prod) and relative paths (/uploads/... in dev)
const imageUrlSchema = z.string().refine(
  (val) => val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"),
  { message: "URL gambar tidak valid" }
);

const createPostSchema = z.object({
  imageUrl: imageUrlSchema,
  description: z.string().max(500, "Deskripsi maksimal 500 karakter"),
  categoryId: z.string().min(1, "Pilih kategori kejadian"),
  locationText: z.string().optional().default(""),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");
  const categoryId = searchParams.get("categoryId");
  const limit = 20;

  const posts = await prisma.post.findMany({
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    where: {
      isDeleted: false,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      category: { select: { id: true, slug: true, label: true, color: true } },
      user: {
        select: { id: true, name: true, selfieUrl: true },
      },
    },
  });

  let nextCursor: string | undefined;
  if (posts.length > limit) {
    const nextItem = posts.pop();
    nextCursor = nextItem?.id;
  }

  return NextResponse.json({ posts, nextCursor });
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  try {
    const body = await request.json();
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    // Masyarakat (USER) must provide a location; admin posts may omit it
    if (session.user.role === "USER" && !validation.data.locationText) {
      return NextResponse.json(
        { error: "Lokasi harus diisi" },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: validation.data.categoryId, isActive: true },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        imageUrl: validation.data.imageUrl,
        description: validation.data.description,
        categoryId: validation.data.categoryId,
        locationText: validation.data.locationText,
        latitude: validation.data.latitude,
        longitude: validation.data.longitude,
        userId: session.user.id,
        // Admin posts are informational announcements, not user reports
        status: session.user.role === "ADMIN" ? "INFORMASI" : "HANYA_INFORMASI",
      },
      include: {
        category: { select: { id: true, slug: true, label: true, color: true } },
        user: {
          select: { id: true, name: true, selfieUrl: true },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Gagal membuat postingan." },
      { status: 500 }
    );
  }
}
