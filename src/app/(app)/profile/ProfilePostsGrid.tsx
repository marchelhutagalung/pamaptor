"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppImage from "@/components/AppImage";
import CategoryBadge from "@/components/CategoryBadge";
import { MapPin, Calendar, Info, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { STATUS_LABELS, STATUS_DOT_COLORS as STATUS_DOT } from "@/lib/constants";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useApiLoadingStatus,
  APILoadingStatus,
} from "@vis.gl/react-google-maps";

interface ProfilePost {
  id: string;
  imageUrl: string;
  category: {
    id: string;
    slug: string;
    label: string;
    color: string;
  };
  description: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  createdAt: string;
}

interface OfficerLocation {
  officerLatitude: number | null;
  officerLongitude: number | null;
  officerLocationUpdatedAt: string | null;
}

function OfficerMapContent({
  reportLat,
  reportLng,
  officerLat,
  officerLng,
  locationText,
}: {
  reportLat: number;
  reportLng: number;
  officerLat: number;
  officerLng: number;
  locationText: string;
}) {
  const status = useApiLoadingStatus();
  const [openInfo, setOpenInfo] = useState<"report" | "officer" | null>(null);
  const center = { lat: (reportLat + officerLat) / 2, lng: (reportLng + officerLng) / 2 };

  if (status === APILoadingStatus.LOADING || status === APILoadingStatus.NOT_LOADED) {
    return <div className="h-48 w-full bg-gray-800 rounded-xl animate-pulse" />;
  }
  if (status === APILoadingStatus.FAILED) {
    return (
      <div className="h-48 w-full bg-gray-900 rounded-xl flex items-center justify-center">
        <p className="text-gray-500 text-sm text-center px-4">Peta tidak dapat dimuat.</p>
      </div>
    );
  }

  return (
    <Map
      defaultCenter={center}
      defaultZoom={13}
      gestureHandling="cooperative"
      disableDefaultUI
      mapId="DEMO_MAP_ID"
      className="h-48 w-full rounded-xl z-0"
      style={{ height: "12rem" }}
    >
      <AdvancedMarker
        position={{ lat: reportLat, lng: reportLng }}
        onClick={() => setOpenInfo("report")}
      />
      {openInfo === "report" && (
        <InfoWindow
          position={{ lat: reportLat, lng: reportLng }}
          onCloseClick={() => setOpenInfo(null)}
        >
          <p className="text-sm text-gray-800">📍 {locationText}</p>
        </InfoWindow>
      )}

      <AdvancedMarker
        position={{ lat: officerLat, lng: officerLng }}
        onClick={() => setOpenInfo("officer")}
      >
        <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
          <span className="text-white text-xs">👮</span>
        </div>
      </AdvancedMarker>
      {openInfo === "officer" && (
        <InfoWindow
          position={{ lat: officerLat, lng: officerLng }}
          onCloseClick={() => setOpenInfo(null)}
        >
          <p className="text-sm text-gray-800">Lokasi Petugas</p>
        </InfoWindow>
      )}
    </Map>
  );
}

export default function ProfilePostsGrid({
  posts,
}: {
  posts: ProfilePost[];
}) {
  const [selected, setSelected] = useState<ProfilePost | null>(null);
  const [officerLocation, setOfficerLocation] = useState<OfficerLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Auto-open sheet when navigated from notification with ?highlight=postId
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (!highlightId || posts.length === 0) return;
    const post = posts.find((p) => p.id === highlightId);
    if (post) {
      setOfficerLocation(null);
      setShowImage(false);
      setSelected(post);
      // Remove the param from URL without re-render
      router.replace("/profile", { scroll: false });
    }
  }, [searchParams, posts, router]);

  const fetchOfficerLocation = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/officer-location`);
      if (res.ok) {
        const data: OfficerLocation = await res.json();
        setOfficerLocation(data);
      } else {
        setOfficerLocation(null);
      }
    } catch {
      setOfficerLocation(null);
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (!selected || selected.status !== "DALAM_TINDAK_LANJUT") {
      setOfficerLocation(null);
      return;
    }

    setLoadingLocation(true);
    fetchOfficerLocation(selected.id);

    const interval = setInterval(() => fetchOfficerLocation(selected.id), 300_000);
    return () => clearInterval(interval);
  }, [selected, fetchOfficerLocation]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-sm">Belum ada postingan</p>
      </div>
    );
  }

  const handleOpen = (post: ProfilePost) => {
    setOfficerLocation(null);
    setShowImage(false);
    setSelected(post);
  };

  const hasOfficerLocation =
    officerLocation?.officerLatitude != null &&
    officerLocation?.officerLongitude != null;

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => handleOpen(post)}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <AppImage
              src={post.imageUrl}
              alt="Post"
              fill
              className="object-cover"
              sizes="33vw"
            />
          </button>
        ))}
      </div>

      {/* Bottom Sheet Modal */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="bottom"
          className="bg-gray-950 border-gray-800 text-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-0"
        >
          {selected && (
            <>
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gray-600" />
              </div>

              <SheetHeader className="px-5 pb-3">
                <SheetTitle className="text-white text-left text-lg">
                  Detail Laporan
                </SheetTitle>
              </SheetHeader>

              <div className="p-5 space-y-4">
                {/* Category & Status */}
                <div className="flex items-center justify-between">
                  <CategoryBadge category={selected.category} />
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${STATUS_DOT[selected.status] || "bg-gray-400"}`}
                    />
                    <span className="text-xs text-gray-400">
                      {STATUS_LABELS[selected.status] || selected.status}
                    </span>
                  </div>
                </div>

                {/* Officer location tracking — shown at top when DALAM_TINDAK_LANJUT */}
                {selected.status === "DALAM_TINDAK_LANJUT" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-orange-400">
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                      <span className="text-xs font-medium">Lokasi Petugas</span>
                    </div>

                    {loadingLocation ? (
                      <div className="h-48 w-full bg-gray-800 rounded-xl flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                      </div>
                    ) : hasOfficerLocation && selected.latitude && selected.longitude ? (
                      <>
                        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
                          <OfficerMapContent
                            reportLat={selected.latitude}
                            reportLng={selected.longitude}
                            officerLat={officerLocation!.officerLatitude!}
                            officerLng={officerLocation!.officerLongitude!}
                            locationText={selected.locationText}
                          />
                        </APIProvider>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${officerLocation!.officerLatitude!},${officerLocation!.officerLongitude!}&destination=${selected.latitude},${selected.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-blue-400 hover:bg-white/10 transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          Lihat Rute di Google Maps
                        </a>
                        {officerLocation?.officerLocationUpdatedAt && (
                          <p className="text-xs text-gray-500 text-center">
                            Diperbarui{" "}
                            {formatDistanceToNow(
                              new Date(officerLocation.officerLocationUpdatedAt),
                              { addSuffix: true, locale: idLocale }
                            )}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="h-14 w-full bg-gray-900 rounded-xl flex items-center justify-center">
                        <p className="text-gray-500 text-sm">
                          Petugas belum membagikan lokasi
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsible image */}
                <button
                  onClick={() => setShowImage((v) => !v)}
                  className="w-full flex items-center justify-between py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider">Foto Laporan</span>
                  {showImage ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showImage && (
                  <div className="relative aspect-video w-full bg-gray-900 rounded-xl overflow-hidden -mt-2">
                    <AppImage
                      src={selected.imageUrl}
                      alt={selected.description}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                  </div>
                )}

                {/* Description */}
                {selected.description && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Info className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Deskripsi</span>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {selected.description}
                    </p>
                  </div>
                )}

                {/* Location */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Lokasi</span>
                  </div>
                  <p className="text-gray-300 text-sm">{selected.locationText}</p>
                </div>

                {/* Time */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Waktu</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {format(new Date(selected.createdAt), "dd MMMM yyyy, HH:mm", {
                      locale: idLocale,
                    })}
                    <span className="text-gray-500 ml-2">
                      ({formatDistanceToNow(new Date(selected.createdAt), {
                        addSuffix: true,
                        locale: idLocale,
                      })})
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
