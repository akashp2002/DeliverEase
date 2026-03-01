import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRoadPath } from '@/lib/routeService';

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
  type?: 'warehouse' | 'delivery' | 'current' | 'agent';
}

interface DeliveryMapProps {
  waypoints: Waypoint[];
  showRoute?: boolean;
  showOptimizedRoute?: boolean;
  originalRoute?: Waypoint[];
  optimizedRoute?: Waypoint[];
  routeCoordinates?: [number, number][]; // Pre-fetched route to draw
  height?: string;
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

// Custom marker icons
const createCustomIcon = (type: 'warehouse' | 'delivery' | 'current' | 'agent' = 'delivery') => {
  const colors = {
    warehouse: '#1a365d',
    delivery: '#0d9488',
    current: '#f59e0b',
    agent: '#3b82f6',
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
          ${type === 'warehouse' ? '🏢' : type === 'agent' ? '🚚' : type === 'current' ? '📍' : '📦'}
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
  routeCoordinates,
  height = '400px',
  className = '',
  center,
  zoom = 12,
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const waypointsStr = JSON.stringify(waypoints);
  const routeCoordinatesStr = JSON.stringify(routeCoordinates);
  const originalRouteStr = JSON.stringify(originalRoute);
  const optimizedRouteStr = JSON.stringify(optimizedRoute);

  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Initialize map only ONCE
    if (!mapInstanceRef.current) {
      const mapCenter = center || (waypoints.length > 0
        ? {
          lat: waypoints.reduce((sum, w) => sum + w.lat, 0) / waypoints.length,
          lng: waypoints.reduce((sum, w) => sum + w.lng, 0) / waypoints.length,
        }
        : { lat: 28.6139, lng: 77.2090 });

      const map = L.map(mapRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // 2. Clear previous layers (markers and lines)
    map.eachLayer((layer) => {
      // Don't remove the tile layer (the actual map background!)
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // 3. Add current waypoints as markers
    waypoints.forEach((waypoint, index) => {
      const marker = L.marker([waypoint.lat, waypoint.lng], {
        icon: createCustomIcon(waypoint.type || 'delivery'),
        zIndexOffset: waypoint.type === 'agent' ? 1000 : waypoint.type === 'current' ? 500 : 0 // Make sure Blue Dot is always on top
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

    // 4. Draw route if enabled
    async function drawRoadRoute(points: Waypoint[], color: string, isDashed: boolean = false) {
      if (!points || points.length < 2) return;
      try {
        const locations = points.map(w => ({ lat: w.lat, lng: w.lng }));
        const data = await getRoadPath(locations);

        if (data.features && data.features[0]) {
          const route = data.features[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );

          // Only draw if map hasn't unmounted during the fetch
          if (mapInstanceRef.current === map) {
            L.polyline(route, {
              color,
              weight: 5,
              opacity: 0.9,
              dashArray: isDashed ? '10, 10' : undefined
            }).addTo(map);
          }
        }
      } catch (err) {
        console.error("Road route draw failed", err);
      }
    }

    if (routeCoordinates && routeCoordinates.length > 0) {
      L.polyline(routeCoordinates, {
        color: showOptimizedRoute ? '#10b981' : '#3b82f6',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
    } else {
      if (showOptimizedRoute && originalRoute && optimizedRoute) {
        drawRoadRoute(originalRoute, '#ef4444', true);
        drawRoadRoute(optimizedRoute, '#10b981', false);
      } else if (showRoute && waypoints.length > 1) {
        drawRoadRoute(waypoints, showOptimizedRoute ? '#10b981' : '#3b82f6');
      }
    }

    // 5. Fit bounds to all markers (Optional during live tracking to avoid jerky camera)
    // Only fit bounds if we have waypoints and it's the first render or zoom/center isn't strict
    if (waypoints.length > 0 && !center && zoom === 12) {
      const bounds = L.latLngBounds(waypoints.map(w => [w.lat, w.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current && mapRef.current === null) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypointsStr, showRoute, showOptimizedRoute, routeCoordinatesStr, originalRouteStr, optimizedRouteStr, center?.lat, center?.lng, zoom]);

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden border border-border ${className}`}
      style={{ height, width: '100%' }}
    />
  );
}
