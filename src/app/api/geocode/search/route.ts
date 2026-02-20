import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { searchLocation } from "@/lib/nominatim";

export async function GET(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const query = request.nextUrl.searchParams.get("q") || "";
  if (query.length < 3) {
    return NextResponse.json([]);
  }

  const results = await searchLocation(query);
  return NextResponse.json(results);
}
