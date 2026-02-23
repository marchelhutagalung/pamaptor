import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { uploadToGCS } from "@/lib/gcs";
import sharp from "sharp";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB raw input limit
const MAX_OUTPUT_SIZE = 500 * 1024; // 500KB after compression
const MAX_DIMENSION = 1280; // max width or height in px

async function compressImage(
  buffer: Buffer,
  targetBytes: number
): Promise<{ data: Buffer; contentType: string }> {
  let img = sharp(buffer).rotate(); // auto-rotate based on EXIF

  // Resize if larger than MAX_DIMENSION
  const metadata = await img.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    img = img.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Try quality levels from high to low until under target size
  const qualities = [85, 75, 65, 50, 40];

  for (const quality of qualities) {
    const compressed = await img
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    if (compressed.length <= targetBytes) {
      return { data: compressed, contentType: "image/jpeg" };
    }
  }

  // Last resort: resize smaller + low quality
  const finalBuffer = await sharp(buffer)
    .rotate()
    .resize(960, 960, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 30, mozjpeg: true })
    .toBuffer();

  return { data: finalBuffer, contentType: "image/jpeg" };
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireSession();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "post";

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Hanya file JPEG, PNG, dan WebP yang diizinkan" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 10MB" },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Compress image to under 500KB
    const { data: optimized, contentType } = await compressImage(
      rawBuffer,
      MAX_OUTPUT_SIZE
    );

    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");

    let destination: string;
    if (type === "selfie") {
      destination = `selfies/${session.user.id}/selfie.jpg`;
    } else {
      destination = `posts/${session.user.id}/${timestamp}-${random}.jpg`;
    }

    const url = await uploadToGCS(optimized, destination, contentType);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Gagal mengupload file. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
