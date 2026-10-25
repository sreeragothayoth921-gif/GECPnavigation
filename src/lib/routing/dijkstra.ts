import type { AdjacencyList, GraphEdge, RoutingOptions } from "./graph";

export interface RouteResult {
  path: string[];
  edges: GraphEdge[];
  totalDistance: number;
  totalTime: number;
  eta: Date;
}

interface HeapEntry {
  nodeId: string;
  cost: number;
}

class MinHeap {
  private heap: HeapEntry[] = [];

  get size(): number {
    return this.heap.length;
  }

  push(nodeId: string, cost: number): void {
    this.heap.push({ nodeId, cost });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): HeapEntry | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  decreaseKey(nodeId: string, newCost: number): void {
    for (let i = 0; i < this.heap.length; i++) {
      if (this.heap[i].nodeId === nodeId && this.heap[i].cost > newCost) {
        this.heap[i].cost = newCost;
        this.bubbleUp(i);
        return;
      }
    }
  }

  contains(nodeId: string): boolean {
    return this.heap.some((e) => e.nodeId === nodeId);
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].cost <= this.heap[idx].cost) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }

  private sinkDown(idx: number): void {
    const length = this.heap.length;
    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      let smallest = idx;

      if (left < length && this.heap[left].cost < this.heap[smallest].cost) {
        smallest = left;
      }
      if (right < length && this.heap[right].cost < this.heap[smallest].cost) {
        smallest = right;
      }
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }
}

function isEdgeAllowed(edge: GraphEdge, options: RoutingOptions): boolean {
  if (edge.status === "blocked") return false;
  if (options.avoidRestricted && (edge.status === "restricted" || edge.status === "construction")) {
    return false;
  }
  if (options.wheelchairAccessible && !edge.isAccessible) return false;
  if (options.avoidStairs && edge.hasStairs && !edge.hasElevator) return false;
  return true;
}

function computeEdgeWeight(edge: GraphEdge, options: RoutingOptions): number {
  let weight = edge.distance;
  if (edge.hasStairs && !edge.hasElevator) {
    weight *= 1.3;
  }
  if (edge.status === "construction") {
    weight *= 1.5;
  }
  return weight;
}

function reconstructPath(predecessors: Map<string, string>, endId: string): string[] {
  const path: string[] = [];
  let current: string | null = endId;
  while (current !== null) {
    path.unshift(current);
    current = predecessors.get(current) ?? null;
  }
  return path;
}

function reconstructEdges(graph: AdjacencyList, path: string[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const sourceEdges = graph.get(path[i]) ?? [];
    const edge = sourceEdges.find((e) => e.target === path[i + 1]);
    if (edge) edges.push(edge);
  }
  return edges;
}

export function dijkstra(
  graph: AdjacencyList,
  startId: string,
  endId: string,
  options: RoutingOptions,
): RouteResult | null {
  if (!graph.has(startId) || !graph.has(endId)) return null;
  if (startId === endId) return null;

  const dist = new Map<string, number>();
  const predecessors = new Map<string, string>();
  const visited = new Set<string>();
  const pq = new MinHeap();

  for (const nodeId of graph.keys()) {
    dist.set(nodeId, Infinity);
  }
  dist.set(startId, 0);
  pq.push(startId, 0);

  while (pq.size > 0) {
    const current = pq.pop()!;
    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    if (current.nodeId === endId) break;

    const edges = graph.get(current.nodeId) ?? [];
    for (const edge of edges) {
      if (!isEdgeAllowed(edge, options)) continue;
      if (visited.has(edge.target)) continue;

      const weight = computeEdgeWeight(edge, options);
      const newDist = (dist.get(current.nodeId) ?? Infinity) + weight;
      const currentDist = dist.get(edge.target) ?? Infinity;

      if (newDist < currentDist) {
        dist.set(edge.target, newDist);
        predecessors.set(edge.target, current.nodeId);
        pq.decreaseKey(edge.target, newDist);
        if (!pq.contains(edge.target)) {
          pq.push(edge.target, newDist);
        }
      }
    }
  }

  const finalDist = dist.get(endId);
  if (finalDist === Infinity) return null;

  const path = reconstructPath(predecessors, endId);
  const edges = reconstructEdges(graph, path);
  const totalDistance = edges.reduce((sum, e) => sum + e.distance, 0);
  const speedMs = (5 * 1000) / 3600;
  const totalTime = Math.ceil(totalDistance / speedMs);
  const eta = new Date(Date.now() + totalTime * 1000);

  return {
    path,
    edges,
    totalDistance,
    totalTime,
    eta,
  };
}
