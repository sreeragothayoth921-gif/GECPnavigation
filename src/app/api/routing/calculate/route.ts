import { NextRequest, NextResponse } from 'next/server';

import campusLocations from '@/data/campus-locations.json';
import campusPaths from '@/data/campus-paths.json';

export const dynamic = 'force-dynamic';

function resolveLocationId(name: string, locations: any[]): string | null {
  const q = name.trim().toLowerCase();

  // Exact match on name
  const exactName = locations.find(l => l.name.toLowerCase() === q);
  if (exactName) return exactName.code;

  // Exact match on code
  const exactCode = locations.find(l => l.code && l.code.toLowerCase() === q);
  if (exactCode) return exactCode.code;

  // Partial match on name
  const partialName = locations.find(l => l.name.toLowerCase().includes(q));
  if (partialName) return partialName.code;

  // Partial match on code
  const partialCode = locations.find(l => l.code && l.code.toLowerCase().includes(q));
  if (partialCode) return partialCode.code;

  // Partial match on name from query
  const partialFromQuery = locations.find(l => q.includes(l.name.toLowerCase()));
  if (partialFromQuery) return partialFromQuery.code;

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { start, end, startId, endId, avoidStairs, wheelchair, walkingSpeedKmh = 5 } = body;

    const destInput = end || endId;
    const srcInput = start || startId;

    if (!destInput) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
    }

    const allLocations = campusLocations as any[];
    const paths = campusPaths as any[];

    // Resolve names to codes
    const resolvedEndCode = resolveLocationId(destInput, allLocations);
    if (!resolvedEndCode) {
      return NextResponse.json({
        error: `Could not find destination "${destInput}". Try: Main Gate, Canteen, Library, CS 110, GATE01, etc.`,
      }, { status: 400 });
    }

    let resolvedStartCode: string | null = null;
    if (srcInput && srcInput !== 'current' && srcInput !== 'My Current Location') {
      resolvedStartCode = resolveLocationId(srcInput, allLocations);
    }

    // Build adjacency list using codes
    const graph = new Map<string, Array<{ target: string; distance: number; path: any }>>();
    const activePaths = paths.filter((p: any) => p.status !== 'BLOCKED');

    for (const loc of allLocations) {
      graph.set(loc.code, []);
    }

    for (const path of activePaths) {
      const srcCode = path.sourceCode;
      const dstCode = path.destinationCode;
      const srcEdges = graph.get(srcCode) || [];
      srcEdges.push({ target: dstCode, distance: path.distanceMeters, path });
      graph.set(srcCode, srcEdges);

      if (path.isBidirectional) {
        const dstEdges = graph.get(dstCode) || [];
        dstEdges.push({ target: srcCode, distance: path.distanceMeters, path });
        graph.set(dstCode, dstEdges);
      }
    }

    if (!resolvedStartCode) {
      return NextResponse.json({ error: 'Please specify a starting location.' }, { status: 400 });
    }

    if (!graph.has(resolvedStartCode) || !graph.has(resolvedEndCode)) {
      return NextResponse.json({ error: 'One or both locations not in graph.' }, { status: 400 });
    }

    // Dijkstra's algorithm
    const dist = new Map<string, number>();
    const prev = new Map<string, { node: string; path: any } | null>();
    const visited = new Set<string>();

    for (const loc of allLocations) {
      dist.set(loc.code, Infinity);
      prev.set(loc.code, null);
    }

    dist.set(resolvedStartCode, 0);
    const queue: Array<{ id: string; dist: number }> = [{ id: resolvedStartCode, dist: 0 }];

    while (queue.length > 0) {
      queue.sort((a, b) => a.dist - b.dist);
      const current = queue.shift()!;

      if (visited.has(current.id)) continue;
      visited.add(current.id);

      if (current.id === resolvedEndCode) break;

      const edges = graph.get(current.id) || [];
      for (const edge of edges) {
        if (visited.has(edge.target)) continue;

        const pathData = edge.path;
        if (avoidStairs && pathData.hasStairs) continue;
        if (wheelchair && !pathData.isAccessible) continue;

        let weight = edge.distance;
        if (pathData.hasStairs) weight *= 1.3;
        if (pathData.status === 'CONSTRUCTION') weight *= 1.5;

        const newDist = dist.get(current.id)! + weight;
        if (newDist < dist.get(edge.target)!) {
          dist.set(edge.target, newDist);
          prev.set(edge.target, { node: current.id, path: pathData });
          queue.push({ id: edge.target, dist: newDist });
        }
      }
    }

    const endDist = dist.get(resolvedEndCode);
    if (endDist === Infinity || endDist === undefined) {
      return NextResponse.json({ error: 'No route found between these locations.' }, { status: 400 });
    }

    // Reconstruct path
    const routePathCodes: string[] = [];
    const routePaths: any[] = [];
    let current: string | null = resolvedEndCode;

    while (current && current !== resolvedStartCode) {
      routePathCodes.unshift(current);
      const p = prev.get(current);
      if (p) {
        routePaths.unshift(p.path);
        current = p.node;
      } else {
        break;
      }
    }
    if (current === resolvedStartCode) {
      routePathCodes.unshift(resolvedStartCode);
    }

    // Get coordinates for the route path
    const locMap = new Map(allLocations.map((l: any) => [l.code, l]));
    const routeCoords = routePathCodes
      .map(code => locMap.get(code))
      .filter((l: any) => l && l.latitude && l.longitude)
      .map((l: any) => ({ lat: l.latitude, lng: l.longitude }));

    // Generate turn-by-turn directions
    const directions: Array<{ step: number; instruction: string; distance: string; icon: string }> = [];
    let stepNum = 1;

    for (let i = 0; i < routePaths.length; i++) {
      const p = routePaths[i];
      const fromLoc = locMap.get(routePathCodes[i]);
      const toLoc = locMap.get(routePathCodes[i + 1]);

      if (i === 0 && fromLoc) {
        directions.push({
          step: stepNum++,
          instruction: `Start at ${fromLoc.name}`,
          distance: '0 m',
          icon: 'start',
        });
      }

      const distMeters = Math.round(p.distanceMeters);
      let icon = 'walk';
      let instruction = '';

      if (p.hasStairs) {
        icon = 'stairs';
        instruction = `Take stairs to ${toLoc?.name || 'next level'}`;
      } else if (p.hasElevator) {
        icon = 'elevator';
        instruction = `Take elevator to ${toLoc?.name || 'next level'}`;
      } else {
        if (fromLoc && toLoc) {
          const dlat = toLoc.latitude - fromLoc.latitude;
          const dlng = toLoc.longitude - fromLoc.longitude;
          if (Math.abs(dlat) > Math.abs(dlng)) {
            instruction = dlat > 0 ? 'Head north' : 'Head south';
          } else {
            instruction = dlng > 0 ? 'Head east' : 'Head west';
          }
          instruction += ` toward ${toLoc.name}`;
        } else {
          instruction = `Walk toward ${toLoc?.name || 'next point'}`;
        }
      }

      directions.push({
        step: stepNum++,
        instruction,
        distance: distMeters >= 1000 ? `${(distMeters / 1000).toFixed(1)} km` : `${distMeters} m`,
        icon,
      });
    }

    const destination = locMap.get(resolvedEndCode);
    if (destination) {
      directions.push({
        step: stepNum++,
        instruction: `Arrive at ${destination.name}`,
        distance: '0 m',
        icon: 'arrive',
      });
    }

    // Calculate walking time
    const walkingSpeedMs = (walkingSpeedKmh * 1000) / 3600;
    const totalTimeSec = Math.round(endDist / walkingSpeedMs);
    const eta = new Date(Date.now() + totalTimeSec * 1000);

    const formatDistance = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
    const formatTime = (sec: number) => {
      if (sec < 60) return `${sec} sec`;
      if (sec < 3600) return `${Math.floor(sec / 60)} min`;
      return `${Math.floor(sec / 3600)} hr ${Math.floor((sec % 3600) / 60)} min`;
    };

    return NextResponse.json({
      distance: formatDistance(endDist),
      walkingTime: formatTime(totalTimeSec),
      eta: eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalDistance: Math.round(endDist),
      totalTime: totalTimeSec,
      directions,
      routeCoords,
      startLocation: locMap.get(resolvedStartCode)?.name || srcInput,
      endLocation: destination?.name || destInput,
    });
  } catch (error) {
    console.error('Routing error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to calculate route: ${msg}` }, { status: 500 });
  }
}