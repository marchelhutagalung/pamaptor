"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerProps {
  onSelect: (location: {
    locationText: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  value?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function LocationPicker({ onSelect, value }: LocationPickerProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [locationError, setLocationError] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const search = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        const data = await res.json();
        setResults(data);
        setShowResults(data.length > 0);
      } catch {
        // silent fail
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedQuery]);

  const detectLocation = () => {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Browser Anda tidak mendukung geolokasi. Cari lokasi secara manual.");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `/api/geocode/reverse?lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          setQuery(data.displayName);
          onSelect({
            locationText: data.displayName,
            latitude,
            longitude,
          });
        } catch {
          const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setQuery(fallback);
          onSelect({ locationText: fallback, latitude, longitude });
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        setIsDetecting(false);
        setLocationError("Tidak dapat mendapatkan lokasi. Cari lokasi secara manual.");
      }
    );
  };

  const handleSelect = (result: LocationResult) => {
    setQuery(result.display_name);
    setShowResults(false);
    onSelect({
      locationText: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={detectLocation}
        disabled={isDetecting}
        variant="outline"
        className="w-full bg-white/10 border-white/10 text-white hover:bg-white/15 rounded-xl h-12 gap-2"
      >
        {isDetecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4 text-blue-400" />
        )}
        {isDetecting ? "Mendeteksi lokasi..." : "Deteksi Lokasi Otomatis"}
      </Button>

      {locationError && (
        <p className="text-yellow-400 text-xs px-1">{locationError}</p>
      )}

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />
          )}
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Cari lokasi..."
            className="pl-9 bg-white/10 border-white/10 text-white placeholder:text-gray-500 h-12 rounded-xl"
          />
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
            {results.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSelect(result)}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors",
                  "border-b border-white/5 last:border-0"
                )}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-500" />
                  <span className="line-clamp-2">{result.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
