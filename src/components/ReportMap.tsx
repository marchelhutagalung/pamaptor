"use client";

import { useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useApiLoadingStatus,
  APILoadingStatus,
} from "@vis.gl/react-google-maps";

interface ReportMapProps {
  latitude: number;
  longitude: number;
  locationText: string;
}

function MapContent({ latitude, longitude, locationText }: ReportMapProps) {
  const status = useApiLoadingStatus();
  const [open, setOpen] = useState(false);
  const pos = { lat: latitude, lng: longitude };

  if (status === APILoadingStatus.LOADING || status === APILoadingStatus.NOT_LOADED) {
    return <div className="h-48 w-full bg-gray-800 rounded-xl animate-pulse" />;
  }

  if (status === APILoadingStatus.FAILED) {
    return (
      <div className="h-48 w-full bg-gray-900 rounded-xl flex items-center justify-center">
        <p className="text-gray-500 text-sm text-center px-4">
          Peta tidak dapat dimuat.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Map
        defaultCenter={pos}
        defaultZoom={15}
        gestureHandling="cooperative"
        disableDefaultUI
        mapId="DEMO_MAP_ID"
        className="h-48 w-full rounded-xl z-0"
        style={{ height: "12rem" }}
      >
        <AdvancedMarker position={pos} onClick={() => setOpen(true)} />
        {open && (
          <InfoWindow position={pos} onCloseClick={() => setOpen(false)}>
            <p className="text-sm text-gray-800">{locationText}</p>
          </InfoWindow>
        )}
      </Map>
      <a
        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-blue-400 hover:bg-white/10 transition-colors"
      >
        Buka di Google Maps
      </a>
    </div>
  );
}

export default function ReportMap({ latitude, longitude, locationText }: ReportMapProps) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      <MapContent latitude={latitude} longitude={longitude} locationText={locationText} />
    </APIProvider>
  );
}
