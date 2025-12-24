'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js (only run on client)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapViewProps {
  startLat: number;
  startLng: number;
  startLocationName: string;
  radius: number; // in meters
}

export function MapView({ startLat, startLng, startLocationName, radius }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isInRadius, setIsInRadius] = useState(false);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current).setView([startLat, startLng], 16);
    mapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add starting location marker
    const startMarker = L.marker([startLat, startLng]).addTo(map);
    startMarker.bindPopup(`<strong>Starting Point</strong><br/>${startLocationName}`);

    // Add radius circle
    L.circle([startLat, startLng], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      radius: radius,
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [startLat, startLng, startLocationName, radius]);

  // Get and update user location
  useEffect(() => {
    if (!mapRef.current) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Calculate distance
        const distance = L.latLng(startLat, startLng).distanceTo(L.latLng(latitude, longitude));
        setIsInRadius(distance <= radius);

        // Update or create user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else if (mapRef.current) {
          const userIcon = L.divIcon({
            className: 'custom-user-marker',
            html: `
              <div style="
                width: 20px;
                height: 20px;
                background-color: #ef4444;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(mapRef.current)
            .bindPopup('You are here');
        }

        // Adjust map bounds to show both markers if user location is far
        if (mapRef.current && distance > radius * 2) {
          const bounds = L.latLngBounds(
            [startLat, startLng],
            [latitude, longitude]
          );
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [startLat, startLng, radius]);

  return (
    <div className="relative z-0">
      <div ref={mapContainerRef} className="w-full h-64 md:h-96 rounded-lg overflow-hidden" />

      {userLocation && (
        <div className={`absolute top-4 left-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
          isInRadius
            ? 'bg-green-500 text-white'
            : 'bg-orange-500 text-white'
        }`}>
          {isInRadius
            ? '✓ You are in the starting area!'
            : '⚠ You are outside the starting area'}
        </div>
      )}
    </div>
  );
}
