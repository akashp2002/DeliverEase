import api from './api';

export async function getRoadDistance(from, to) {
  const res = await api.post('/route/distance', { from, to });
  return res.data.distance;
}
