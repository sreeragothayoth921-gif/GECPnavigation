import { NextRequest, NextResponse } from 'next/server';

import itBlockGround from '@/data/indoor/it-block-ground.json';
import itBlockFirst from '@/data/indoor/it-block-first.json';

import type { FloorPlan, NavigationNode, NavigationEdge, IndoorRouteResult, IndoorTurnInstruction } from '@/lib/types/indoor';

export const dynamic = 'force-dynamic';

const floorPlans: Record<string, FloorPlan> = {
  'IT_BLOCK-GROUND': itBlockGround as unknown as FloorPlan,
  'IT_BLOCK-FIRST': itBlockFirst as unknown as FloorPlan,
};

function resolveRoomCode(name: string, floorPlan: FloorPlan): string | null {
  const q = name.trim().toLowerCase();

  const exactCode = floorPlan.rooms.find(r => r.code.toLowerCase() === q);
  if (exactCode) {
    // Find the navigation node for this room
    const navNode = floorPlan.navigationNodes.find(n => n.metadata?.roomId === exactCode.id);
    return navNode?.id || exactCode.id;
  }

  const exactName = floorPlan.rooms.find(r => r.name.toLowerCase() === q);
  if (exactName) {
    const navNode = floorPlan.navigationNodes.find(n => n.metadata?.roomId === exactName.id);
    return navNode?.id || exactName.id;
  }

  const partialCode = floorPlan.rooms.find(r => r.code.toLowerCase().includes(q));
  if (partialCode) {
    const navNode = floorPlan.navigationNodes.find(n => n.metadata?.roomId === partialCode.id);
    return navNode?.id || partialCode.id;
  }

  const partialName = floorPlan.rooms.find(r => r.name.toLowerCase().includes(q));
  if (partialName) {
    const navNode = floorPlan.navigationNodes.find(n => n.metadata?.roomId === partialName.id);
    return navNode?.id || partialName.id;
  }

  return null;
}

function buildNavigationGraph(floorPlans: FloorPlan[]): Map<string, NavigationNode> {
  const graph = new Map<string, NavigationNode>();

  // First pass: collect all nodes
  for (const fp of floorPlans) {
    for (const node of fp.navigationNodes) {
      // Store original connections (string IDs) before overwriting
      const originalConnections = (node.connections as unknown as string[]) || [];
      const graphNode = { ...node, connections: [] };
      graph.set(node.id, graphNode);
      // Store original connections on the graph node for second pass
      (graphNode as any)._originalConnections = originalConnections;
    }
  }

  // Build edge map from navigationEdges
  const edgeMap = new Map<string, any>();
  for (const fp of floorPlans) {
    for (const edge of fp.navigationEdges as any[]) {
      edgeMap.set(edge.targetId, edge);
    }
  }

  // Second pass: build connections from original connections
  for (const fp of floorPlans) {
    for (const node of fp.navigationNodes) {
      const graphNode = graph.get(node.id);
      if (!graphNode) continue;

      const originalConnections = (graphNode as any)._originalConnections || [];
      for (const targetId of originalConnections) {
        const edgeProps = edgeMap.get(targetId);
        if (edgeProps) {
          graphNode.connections.push({
            targetId: targetId,
            distance: edgeProps.distance,
            type: edgeProps.type,
            isBidirectional: edgeProps.isBidirectional,
            metadata: edgeProps.metadata,
          });
        } else {
          // Default edge if not found in edgeMap
          graphNode.connections.push({
            targetId: targetId,
            distance: 10,
            type: 'corridor',
            isBidirectional: true,
            metadata: {},
          });
        }
      }
    }
  }

  return graph;
}

function dijkstra(
  graph: Map<string, NavigationNode>,
  startId: string,
  endId: string,
  options: { avoidStairs?: boolean; wheelchair?: boolean } = {}
): { path: NavigationNode[]; edges: NavigationEdge[]; totalDistance: number; totalTime: number; floors: string[] } | null {
  if (!graph.has(startId) || !graph.has(endId)) return null;

  const dist = new Map<string, number>();
  const prev = new Map<string, { nodeId: string; edge: NavigationEdge } | null>();
  let visited = new Set<string>();

  for (const nodeId of graph.keys()) {
    dist.set(nodeId, Infinity);
    prev.set(nodeId, null);
  }
  visited = new Set<string>();

  dist.set(startId, 0);
  const queue: Array<{ id: string; dist: number }> = [{ id: startId, dist: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === endId) break;

    const node = graph.get(current.id);
    if (!node) continue;

    for (const edge of node.connections) {
      if (visited.has(edge.targetId)) continue;

      if (options.avoidStairs && edge.type === 'stair' && !edge.metadata?.hasElevator) continue;
      if (options.wheelchair && edge.metadata?.isAccessible === false) continue;

      let weight = edge.distance;
      if (edge.type === 'stair' && !edge.metadata?.hasElevator) weight *= 1.3;
      if (edge.metadata?.hasElevator && edge.type === 'elevator') weight *= 1.1;

      const newDist = dist.get(current.id)! + weight;
      if (newDist < dist.get(edge.targetId)!) {
        dist.set(edge.targetId, newDist);
        prev.set(edge.targetId, { nodeId: current.id, edge });
        queue.push({ id: edge.targetId, dist: newDist });
      }
    }
  }

  const endDist = dist.get(endId);
  if (endDist === Infinity || endDist === undefined) return null;

  const path: NavigationNode[] = [];
  const edges: NavigationEdge[] = [];
  let current: string | null = endId;

  while (current && current !== startId) {
    const node = graph.get(current);
    if (node) path.unshift(node);
    const p = prev.get(current);
    if (p) {
      edges.unshift(p.edge);
      current = p.nodeId;
    } else {
      break;
    }
  }
  if (current === startId) {
    const startNode = graph.get(startId);
    if (startNode) path.unshift(startNode);
  }

  const floors = [...new Set(path.map(n => n.floor))];

  return { path, edges, totalDistance: Math.round(endDist), totalTime: Math.ceil(endDist / 1.4), floors };
}

function generateInstructions(path: NavigationNode[], edges: NavigationEdge[], graph: Map<string, NavigationNode>): IndoorTurnInstruction[] {
  const instructions: IndoorTurnInstruction[] = [];
  let stepNum = 1;

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const fromNode = path[i];
    const toNode = path[i + 1];
    const targetNode = graph.get(edge.targetId);

    if (i === 0 && fromNode) {
      instructions.push({
        step: stepNum++,
        action: 'continue',
        description: `Start at ${fromNode.metadata?.label || fromNode.id}`,
        distance: 0,
        nodeId: fromNode.id,
        floor: fromNode.floor,
        roomName: fromNode.metadata?.label,
      });
    }

    let action: IndoorTurnInstruction['action'] = 'continue';
    let description = '';

    if (edge.type === 'stair') {
      action = 'take_stairs';
      description = `Take stairs to ${toNode.floor} floor`;
    } else if (edge.type === 'elevator') {
      action = 'take_elevator';
      description = `Take elevator to ${toNode.floor} floor`;
    } else if (edge.type === 'door') {
      if (toNode.type === 'room_entrance') {
        action = 'enter_room';
        description = `Enter ${toNode.metadata?.label || toNode.id}`;
      } else {
        action = 'exit_room';
        description = `Exit ${fromNode.metadata?.label || fromNode.id}`;
      }
    } else {
      if (fromNode.floor !== toNode.floor) {
        action = 'continue';
        description = `Continue on ${toNode.floor} floor`;
      } else {
        action = 'continue';
        description = `Walk toward ${toNode.metadata?.label || 'next area'}`;
      }
    }

    instructions.push({
      step: stepNum++,
      action,
      description,
      distance: edge.distance,
      nodeId: toNode.id,
      floor: toNode.floor,
      roomName: toNode.metadata?.label,
    });
  }

  const destination = path[path.length - 1];
  if (destination) {
    instructions.push({
      step: stepNum++,
      action: 'arrive',
      description: `Arrive at ${destination.metadata?.label || destination.id}`,
      distance: 0,
      nodeId: destination.id,
      floor: destination.floor,
      roomName: destination.metadata?.label,
    });
  }

  return instructions;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { start, end, building, startFloor, endFloor, avoidStairs, wheelchair } = body;

    if (!start || !end) {
      return NextResponse.json({ error: 'Start and destination are required' }, { status: 400 });
    }

    const targetBuilding = building || 'IT_BLOCK';
    const availableFloors = Object.keys(floorPlans).filter(k => k.startsWith(targetBuilding));
    if (availableFloors.length === 0) {
      return NextResponse.json({ error: `Building ${targetBuilding} not found` }, { status: 400 });
    }

    const allFloorPlans = availableFloors.map(k => floorPlans[k]);

    let startFloorPlan: FloorPlan | null = null;
    let endFloorPlan: FloorPlan | null = null;

    if (startFloor) {
      startFloorPlan = floorPlans[`${targetBuilding}-${startFloor.toUpperCase()}`] || null;
    }
    if (endFloor) {
      endFloorPlan = floorPlans[`${targetBuilding}-${endFloor.toUpperCase()}`] || null;
    }

    if (!startFloorPlan) {
      for (const fp of allFloorPlans) {
        const code = resolveRoomCode(start, fp);
        if (code) { startFloorPlan = fp; break; }
      }
    }
    if (!endFloorPlan) {
      for (const fp of allFloorPlans) {
        const code = resolveRoomCode(end, fp);
        if (code) { endFloorPlan = fp; break; }
      }
    }

    if (!startFloorPlan || !endFloorPlan) {
      return NextResponse.json({
        error: `Could not find start or destination. Available: ${allFloorPlans.map(f => f.rooms.map(r => r.code).join(', ')).join('; ')}`
      }, { status: 400 });
    }

    const startCode = resolveRoomCode(start, startFloorPlan);
    const endCode = resolveRoomCode(end, endFloorPlan);

    if (!startCode || !endCode) {
      return NextResponse.json({
        error: `Could not resolve room codes. Start: ${start}, End: ${end}`
      }, { status: 400 });
    }

    const graph = buildNavigationGraph(allFloorPlans);

    const startNodeId = startCode;
    const endNodeId = endCode;

    const result = dijkstra(graph, startNodeId, endNodeId, { avoidStairs, wheelchair });

    if (!result) {
      return NextResponse.json({ error: 'No route found between these locations.' }, { status: 400 });
    }

    const instructions = generateInstructions(result.path, result.edges, graph);

    const eta = new Date(Date.now() + result.totalTime * 1000);

    return NextResponse.json({
      distance: result.totalDistance >= 1000 ? `${(result.totalDistance / 1000).toFixed(1)} km` : `${result.totalDistance} m`,
      walkingTime: result.totalTime < 60 ? `${result.totalTime} sec` : `${Math.floor(result.totalTime / 60)} min ${result.totalTime % 60} sec`,
      eta: eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalDistance: result.totalDistance,
      totalTime: result.totalTime,
      directions: instructions,
      routeCoords: result.path.map(n => ({ lat: n.position.x, lng: n.position.y })),
      startLocation: graph.get(startNodeId)?.metadata?.label || start,
      endLocation: graph.get(endNodeId)?.metadata?.label || end,
      floors: result.floors,
      path: result.path,
      edges: result.edges,
      instructions: instructions,
    } as unknown as IndoorRouteResult);
  } catch (error) {
    console.error('Indoor routing error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to calculate indoor route: ${msg}` }, { status: 500 });
  }
}