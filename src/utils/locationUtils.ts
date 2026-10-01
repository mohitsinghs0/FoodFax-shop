/**
 * Location and distance utilities for FoodFax
 */

/**
 * Computes Haversine distance between two latitude/longitude points in kilometers.
 */
export function computeHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Format relative time for shop location updates (e.g. "Current stall location updated 5 minutes ago")
 */
export function formatLocationRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Location not updated yet';
  const updated = new Date(dateStr).getTime();
  if (isNaN(updated)) return 'Location not updated yet';
  const diffSec = Math.max(0, Math.floor((Date.now() - updated) / 1000));
  
  if (diffSec < 60) return 'Updated just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return 'Updated 1 minute ago';
  if (diffMin < 60) return `Updated ${diffMin} minutes ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'Updated 1 hour ago';
  if (diffHours < 24) return `Updated ${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
