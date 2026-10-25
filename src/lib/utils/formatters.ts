export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatWalkingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 1) return '< 1 min';
  if (mins === 1) return '1 min';
  return `${mins} min`;
}

export function formatETA(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} sec`;
  return `${mins} min ${secs} sec`;
}

export function getWalkingTime(distanceMeters: number, speedKmh: number = 5): number {
  const speedMs = (speedKmh * 1000) / 3600;
  return Math.round(distanceMeters / speedMs);
}