"use client";

import dynamic from "next/dynamic";

// Dynamically import MapInner with SSR disabled to prevent Leaflet window reference errors
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500">
      Loading map...
    </div>
  ),
});

interface MapProps {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

export default function Map({ lat, lon, onLocationSelect }: MapProps) {
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <MapInner lat={lat} lon={lon} onLocationSelect={onLocationSelect} />
      <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[11px] font-medium text-gray-700 shadow backdrop-blur-xs z-10">
        Click anywhere on map to reposition pin
      </div>
    </div>
  );
}
