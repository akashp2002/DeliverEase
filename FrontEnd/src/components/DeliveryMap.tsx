import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Waypoint {
  lat: number;
  lng: number;
  label?: string;
  type?: 'warehouse' | 'delivery' | 'current';
}

interface DeliveryMapProps {
  waypoints: Waypoint[];
  showRoute?: boolean;
  showOptimizedRoute?: boolean;
  originalRoute?: Waypoint[];
  optimizedRoute?: Waypoint[];
  height?: string;
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

// Custom marker icons
const createCustomIcon = (type: 'warehouse' | 'delivery' | 'current' = 'delivery') => {
  const colors = {
    warehouse: '#1a365d',
    delivery: '#0d9488',
    current: '#f59e0b',
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colors[type]};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 12px;
          font-weight: bold;
        ">
          ${type === 'warehouse' ? '🏢' : type === 'current' ? '📍' : '📦'}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export function DeliveryMap({
  waypoints,
  showRoute = false,
  showOptimizedRoute = false,
  originalRoute,
  optimizedRoute,
  height = '400px',
  className = '',
  center,
  zoom = 12,
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Calculate center from waypoints if not provided
    const mapCenter = center || (waypoints.length > 0 
      ? {
          lat: waypoints.reduce((sum, w) => sum + w.lat, 0) / waypoints.length,
          lng: waypoints.reduce((sum, w) => sum + w.lng, 0) / waypoints.length,
        }
      : { lat: 28.6139, lng: 77.2090 }); // Default: New Delhi

    // Create map
    const map = L.map(mapRef.current, {
      center: [mapCenter.lat, mapCenter.lng],
      zoom,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add markers for each waypoint
    waypoints.forEach((waypoint, index) => {
      const marker = L.marker([waypoint.lat, waypoint.lng], {
        icon: createCustomIcon(waypoint.type || 'delivery'),
      }).addTo(map);

      if (waypoint.label) {
        marker.bindPopup(`
          <div style="min-width: 150px;">
            <strong>${waypoint.type === 'warehouse' ? 'Warehouse' : `Stop ${index}`}</strong>
            <p style="margin: 4px 0 0;">${waypoint.label}</p>
          </div>
        `);
      }
    });

    // Draw route lines if enabled
    if (showRoute && waypoints.length > 1) {
      const routeCoords = waypoints.map(w => [w.lat, w.lng] as [number, number]);
      L.polyline(routeCoords, {
        color: '#0d9488',
        weight: 4,
        opacity: 0.8,
        dashArray: showOptimizedRoute ? '10, 10' : undefined,
      }).addTo(map);
    }

    // Draw comparison routes if provided
    if (originalRoute && originalRoute.length > 1) {
      const originalCoords = originalRoute.map(w => [w.lat, w.lng] as [number, number]);
      L.polyline(originalCoords, {
        color: '#ef4444',
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10',
      }).addTo(map);
    }

    if (optimizedRoute && optimizedRoute.length > 1) {
      const optimizedCoords = optimizedRoute.map(w => [w.lat, w.lng] as [number, number]);
      L.polyline(optimizedCoords, {
        color: '#10b981',
        weight: 4,
        opacity: 0.9,
      }).addTo(map);
    }

    // Fit bounds to show all markers
    if (waypoints.length > 0) {
      const bounds = L.latLngBounds(waypoints.map(w => [w.lat, w.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [waypoints, showRoute, showOptimizedRoute, originalRoute, optimizedRoute, center, zoom]);

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden border border-border ${className}`}
      style={{ height, width: '100%' }}
    />
  );
}
