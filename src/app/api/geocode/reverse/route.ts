import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { reverseGeocode } from "@/lib/nominatim";

export async function GET(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const lat = parseFloat(request.nextUrl.searchParams.get("lat") || "");
  const lon = parseFloat(request.nextUrl.searchParams.get("lon") || "");

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "Koordinat tidak valid" }, { status: 400 });
  }

  const displayName = await reverseGeocode(lat, lon);
  return NextResponse.json({ displayName, lat, lon });
}
