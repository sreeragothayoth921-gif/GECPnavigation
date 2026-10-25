# Dijkstra's Algorithm - CampusNav Implementation

## Overview

CampusNav uses Dijkstra's shortest-path algorithm to calculate the optimal walking route between any two locations on the GEC Palakkad campus.

## Algorithm Explanation

### What is Dijkstra's Algorithm?

Dijkstra's algorithm finds the shortest path between a source node and all other nodes in a weighted graph with non-negative edge weights. It was invented by Edsger W. Dijkstra in 1956.

### How It Works in CampusNav

1. **Graph Construction**: The campus is represented as a weighted graph
   - **Nodes** = Locations (rooms, labs, offices, facilities, intersections)
   - **Edges** = Walkable paths between locations
   - **Weights** = Walking distance in meters

2. **Priority Queue**: Uses a binary min-heap for efficient node selection
   - Always processes the unvisited node with smallest known distance
   - Time complexity: O((V + E) log V)

3. **Edge Filtering**: Before running, edges are filtered based on user preferences
   - Skip blocked paths
   - Skip restricted areas (if preference set)
   - Skip stairs (if wheelchair mode)
   - Apply weight penalties for stairs (1.3x) and construction (1.5x)

4. **Path Reconstruction**: After finding shortest distances, trace back from destination to source using predecessor map

## Implementation Details

### Location: `src/lib/routing/dijkstra.ts`

```typescript
function dijkstra(
  graph: AdjacencyList,
  start: string,
  end: string,
  options: RoutingOptions
): RouteResult | null
```

### Data Structures

**GraphNode**: Represents a campus location
```typescript
interface GraphNode {
  id: string;
  buildingId: string;
  floor: string;
  x: number; y: number;
  lat: number; lng: number;
  type: 'room' | 'intersection' | 'entrance';
}
```

**GraphEdge**: Represents a walkable path
```typescript
interface GraphEdge {
  source: string;
  target: string;
  distance: number; // meters
  floor: string;
  isAccessible: boolean;
  hasStairs: boolean;
  status: 'open' | 'blocked' | 'construction' | 'restricted';
}
```

### Algorithm Steps

```
1. Initialize:
   - distance[source] = 0
   - distance[all other nodes] = Infinity
   - priorityQueue = {source: 0}

2. While priorityQueue is not empty:
   a. Extract node u with minimum distance
   b. If u === destination, break
   c. For each neighbor v of u:
      - weight = edge.distance
      - If avoidStairs and edge.hasStairs, skip
      - If wheelchairAccessible and !edge.isAccessible, skip
      - Apply penalties (stairs: 1.3x, construction: 1.5x)
      - newDist = distance[u] + weight
      - If newDist < distance[v]:
        - distance[v] = newDist
        - predecessor[v] = u
        - Add v to priorityQueue

3. Reconstruct path from destination to source
4. Generate turn-by-turn directions
5. Calculate walking time and ETA
```

### Binary Heap Implementation

The priority queue is implemented as a binary min-heap:

```typescript
class MinHeap {
  private data: Array<{ id: string; dist: number }>;
  
  push(item: { id: string; dist: number }): void;
  pop(): { id: string; dist: number } | undefined;
  decreaseKey(id: string, newDist: number): void;
  contains(id: string): boolean;
  size(): number;
}
```

## Campus Graph Statistics

- **Nodes**: ~120 locations
- **Edges**: ~120 paths (bidirectional)
- **Average degree**: ~2 edges per node
- **Calculation time**: <5ms on modern hardware

## Example Route

**From**: Main Gate
**To**: CS 110 (Hardware Lab)

1. Main Gate → Main Building Entrance (50m)
2. Main Building Entrance → CS Corridor (30m)
3. CS Corridor → CS 110 (20m)

**Total Distance**: 100m
**Walking Time**: ~1.2 minutes (at 5 km/h)
**ETA**: Current time + 1.2 minutes

## Viva Questions & Answers

**Q: Why Dijkstra over BFS?**
A: BFS only works for unweighted graphs. Campus paths have different distances (weights), so we need Dijkstra.

**Q: What's the time complexity?**
A: O((V + E) log V) where V = nodes, E = edges. With binary heap implementation.

**Q: How do you handle blocked paths?**
A: Blocked edges are removed from the graph before running Dijkstra. The algorithm then finds an alternative route.

**Q: How do you handle floor transitions?**
A: Stairs and elevators are modeled as edges between floors with appropriate weights and flags.

**Q: Can it handle real-time updates?**
A: Yes. When an admin blocks a path, the graph is rebuilt and subsequent route calculations avoid that edge.

**Q: Why not use A* algorithm?**
A: Dijkstra is sufficient for a campus-scale graph (~120 nodes). A* would be faster for larger graphs but adds complexity with heuristics.

## Files Involved

| File | Purpose |
|------|---------|
| `src/lib/routing/graph.ts` | Graph types and construction |
| `src/lib/routing/dijkstra.ts` | Core algorithm with MinHeap |
| `src/lib/routing/turnByTurn.ts` | Direction generation |
| `src/lib/routing/campusGraph.ts` | Database → Graph loading |
| `src/app/api/routing/calculate/route.ts` | API endpoint |