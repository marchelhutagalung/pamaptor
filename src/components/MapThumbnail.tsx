"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  useApiLoadingStatus,
  APILoadingStatus,
} from "@vis.gl/react-google-maps";

interface MapThumbnailProps {
  latitude: number;
  longitude: number;
}

function ThumbnailContent({ latitude, longitude }: MapThumbnailProps) {
  const status = useApiLoadingStatus();
  const pos = { lat: latitude, lng: longitude };

  if (status === APILoadingStatus.LOADING) {
    return <div className="w-full bg-gray-800 rounded-b-none animate-pulse" style={{ height: "7rem" }} />;
  }

  if (status === APILoadingStatus.FAILED) {
    return <div className="w-full bg-gray-900 rounded-b-none" style={{ height: "7rem" }} />;
  }

  return (
    <Map
      defaultCenter={pos}
      defaultZoom={14}
      gestureHandling="none"
      disableDefaultUI
      keyboardShortcuts={false}
      mapId="DEMO_MAP_ID"
      className="w-full rounded-b-none z-0"
      style={{ height: "7rem" }}
    >
      <AdvancedMarker position={pos} />
    </Map>
  );
}

export default function MapThumbnail({ latitude, longitude }: MapThumbnailProps) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
      <ThumbnailContent latitude={latitude} longitude={longitude} />
    </APIProvider>
  );
}
