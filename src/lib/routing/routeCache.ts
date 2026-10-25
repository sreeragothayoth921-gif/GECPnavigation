import type { GraphEdge } from "./graph";

interface RouteResult {
  path: string[];
  edges: GraphEdge[];
  totalDistance: number;
  totalTime: number;
  eta: Date;
}

interface RoutingOptions {
  avoidStairs: boolean;
  wheelchairAccessible: boolean;
  avoidBlocked: boolean;
  avoidRestricted: boolean;
}

const routeCache = new Map<string, { route: RouteResult; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 200;

export function generateRouteKey(
  start: string,
  end: string,
  options: RoutingOptions
): string {
  const parts = [
    start,
    end,
    options.avoidStairs ? "1" : "0",
    options.wheelchairAccessible ? "1" : "0",
    options.avoidBlocked ? "1" : "0",
    options.avoidRestricted ? "1" : "0",
  ];
  return parts.join(":");
}

export function getCachedRoute(key: string): RouteResult | null {
  const entry = routeCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    routeCache.delete(key);
    return null;
  }

  return entry.route;
}

export function setCachedRoute(key: string, route: RouteResult): void {
  routeCache.set(key, {
    route,
    timestamp: Date.now(),
  });

  if (routeCache.size > MAX_CACHE_SIZE) {
    const oldestKey = routeCache.keys().next().value;
    if (oldestKey !== undefined) {
      routeCache.delete(oldestKey);
    }
  }
}

export function clearRouteCache(): void {
  routeCache.clear();
}
