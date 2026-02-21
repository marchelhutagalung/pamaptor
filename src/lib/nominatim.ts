const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "Pamaptor/1.0 (contact@pamaptor.com)";

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string> {
  const res = await fetch(
    `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { "User-Agent": USER_AGENT } }
  );

  if (!res.ok) {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

  const data = await res.json();
  return data.display_name ?? `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

export async function searchLocation(
  query: string
): Promise<NominatimResult[]> {
  const res = await fetch(
    `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=id`,
    { headers: { "User-Agent": USER_AGENT } }
  );

  if (!res.ok) return [];
  return res.json();
}
