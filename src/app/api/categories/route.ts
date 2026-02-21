import { NextRequest, NextResponse } from "next/server";
import { requireSession, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET — list active categories (for all authenticated users)
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { id: true, slug: true, label: true, color: true },
  });

  return NextResponse.json(categories);
}

// POST — create a new category (admin only)
const createSchema = z.object({
  slug: z.string().min(1).max(50).transform((v) => v.toUpperCase().replace(/\s+/g, "_")),
  label: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna harus format hex (#RRGGBB)"),
  order: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const validation = createSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    );
  }

  const existing = await prisma.category.findUnique({
    where: { slug: validation.data.slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Kategori dengan slug tersebut sudah ada" },
      { status: 409 }
    );
  }

  const maxOrder = await prisma.category.aggregate({ _max: { order: true } });
  const category = await prisma.category.create({
    data: {
      ...validation.data,
      order: validation.data.order ?? (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
