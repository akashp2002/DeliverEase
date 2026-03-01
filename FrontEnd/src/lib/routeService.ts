import api from './api';

// Single point-to-point distance (kept for other uses)
export async function getRoadDistance(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<number> {
  const res = await api.post('/route/distance', { from, to });
  return res.data.distance;
}

// Distance Matrix — ONE API call for all location pairs.
// locations: array of { lat, lng } — put warehouse first, then deliveries.
// Returns a 2D array: distances[i][j] = road distance in km from location i to location j.
export async function getDistanceMatrix(locations: { lat: number; lng: number }[]): Promise<number[][]> {
  const res = await api.post('/route/matrix', { locations });
  return res.data.distances;
}

// Get the full path GeoJSON and steps from OpenRouteService
export async function getRoadPath(locations: { lat: number; lng: number }[]): Promise<any> {
  const res = await api.post('/route/path', { locations });
  return res.data.data;
}
