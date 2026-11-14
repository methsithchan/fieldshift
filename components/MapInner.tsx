"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default marker icon path issue in Next.js/Webpack/Turbopack
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMarkerProps {
  position: [number, number];
  onLocationSelect: (lat: number, lon: number) => void;
}

function LocationMarker({ position, onLocationSelect }: LocationMarkerProps) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [position, map]);

  return (
    <Marker position={position} icon={defaultIcon}>
      <Popup>
        <div className="text-xs">
          <strong>Selected Farm Location</strong>
          <br />
          Lat: {position[0].toFixed(4)}°N
          <br />
          Lon: {position[1].toFixed(4)}°E
          <br />
          <span className="text-gray-500 italic">Click map to move pin</span>
        </div>
      </Popup>
    </Marker>
  );
}

interface MapInnerProps {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

export default function MapInner({ lat, lon, onLocationSelect }: MapInnerProps) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={9}
      scrollWheelZoom={true}
      className="h-full w-full rounded-xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={[lat, lon]} onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
}
