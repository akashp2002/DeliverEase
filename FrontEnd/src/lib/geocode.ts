/**
 * Geocoding utility using OpenStreetMap Nominatim API (free, no API key required)
 * Converts address to latitude/longitude coordinates
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Geocode an address to get latitude and longitude
 * Uses OpenStreetMap Nominatim API
 * 
 * @param address - Full address string
 * @returns GeocodingResult with lat, lng, and display name
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'DeliverEase-App', // Required by Nominatim ToS
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn('No results found for address:', address);
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode to get address from coordinates
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address string
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'DeliverEase-App',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Validate if coordinates are within India
 */
export function isCoordinateInIndia(lat: number, lng: number): boolean {
  // India's approximate bounding box
  const minLat = 8.0;
  const maxLat = 35.0;
  const minLng = 68.0;
  const maxLng = 98.0;

  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
