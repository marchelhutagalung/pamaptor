// Server-side geocoding uses GOOGLE_MAPS_SERVER_KEY (restricted to Geocoding API, no HTTP referrer restriction).
// Falls back to the public key so local dev with a single key still works.
const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const GEO_BASE = "https://maps.googleapis.com/maps/api";

if (!API_KEY) {
  console.error("[googlemaps] No Google Maps API key set — geocoding will not work");
}

// Keep the same interface shape as nominatim so LocationPicker needs no changes
export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const res = await fetch(
    `${GEO_BASE}/geocode/json?latlng=${lat},${lon}&key=${API_KEY}&language=id`
  );
  if (!res.ok) return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

  const data = await res.json();
  if (data.status !== "OK" || !data.results?.[0]) {
    console.error("[googlemaps] reverseGeocode Google status:", data.status, data.error_message ?? "");
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
  return data.results[0].formatted_address;
}

// Uses Geocoding API (forward geocode) — only requires Geocoding API, not Places API
export async function searchLocation(query: string): Promise<NominatimResult[]> {
  const url = `${GEO_BASE}/geocode/json?address=${encodeURIComponent(query)}&key=${API_KEY}&language=id&region=id`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("[googlemaps] searchLocation HTTP error:", res.status, res.statusText);
    return [];
  }

  const data = await res.json();
  if (data.status !== "OK") {
    console.error("[googlemaps] searchLocation Google status:", data.status, data.error_message ?? "");
    return [];
  }
  if (!Array.isArray(data.results)) return [];

  return data.results.slice(0, 5).map(
    (r: { place_id: string; formatted_address: string; geometry: { location: { lat: number; lng: number } } }, i: number) => ({
      place_id: i,
      display_name: r.formatted_address,
      lat: String(r.geometry.location.lat),
      lon: String(r.geometry.location.lng),
    })
  );
}
