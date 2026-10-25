import type { GraphEdge, GraphNode } from "./graph";

interface TurnInstruction {
  step: number;
  action:
    | "continue"
    | "turn_left"
    | "turn_right"
    | "turn_around"
    | "enter_building"
    | "take_stairs"
    | "take_elevator"
    | "enter_floor"
    | "arrive";
  description: string;
  distance: number;
  nodeId: string;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = toRadians(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLng);
  let bearing = toDegrees(Math.atan2(y, x));
  return ((bearing % 360) + 360) % 360;
}

function classifyTurn(
  prevBearing: number,
  currBearing: number
): "turn_left" | "turn_right" | "turn_around" | "continue" {
  let diff = currBearing - prevBearing;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  const absDiff = Math.abs(diff);
  if (absDiff <= 30) return "continue";
  if (absDiff >= 150) return "turn_around";
  if (diff < 0) return "turn_left";
  return "turn_right";
}

export function generateTurnByTurn(
  path: string[],
  edges: GraphEdge[],
  nodes: Map<string, GraphNode>
): TurnInstruction[] {
  if (path.length === 0) return [];

  const instructions: TurnInstruction[] = [];
  let stepCounter = 1;
  let previousBearing: number | null = null;
  let accumulatedDistance = 0;
  let segmentStartNodeId = path[0];

  function flushSegment(nodeId: string, action: TurnInstruction["action"], description: string) {
    if (accumulatedDistance > 0) {
      instructions.push({
        step: stepCounter++,
        action,
        description,
        distance: accumulatedDistance,
        nodeId,
      });
      accumulatedDistance = 0;
    } else {
      instructions.push({
        step: stepCounter++,
        action,
        description,
        distance: 0,
        nodeId,
      });
    }
  }

  for (let i = 0; i < path.length; i++) {
    const nodeId = path[i];
    const node = nodes.get(nodeId);
    const edge = edges[i - 1] ?? null;

    if (i === 0) {
      if (node) {
        const buildingNode = findParentBuilding(nodes, node);
        const startName = buildingNode?.metadata.name ?? node.metadata.name;
        instructions.push({
          step: stepCounter++,
          action: "continue",
          description: `Start from ${startName}`,
          distance: 0,
          nodeId,
        });
      }
      segmentStartNodeId = nodeId;
      continue;
    }

    if (edge) {
      accumulatedDistance += edge.distance;
    }

    const prevNode = nodes.get(path[i - 1]);
    const currNode = node;

    if (prevNode && currNode && prevNode.lat !== 0 && currNode.lat !== 0) {
      const bearing = calculateBearing(prevNode.lat, prevNode.lng, currNode.lat, currNode.lng);

      if (previousBearing !== null && accumulatedDistance > 0) {
        const turnAction = classifyTurn(previousBearing, bearing);
        if (turnAction !== "continue") {
          const buildingNode = currNode ? findParentBuilding(nodes, currNode) : null;
          const landmark = buildingNode?.metadata.name ?? currNode?.metadata.name ?? nodeId;
          const turnLabel =
            turnAction === "turn_left"
              ? "Turn left"
              : turnAction === "turn_right"
              ? "Turn right"
              : "Turn around";
          flushSegment(nodeId, turnAction, `${turnLabel} near ${landmark}`);
          segmentStartNodeId = nodeId;
        }
      }

      previousBearing = bearing;
    }

    if (node && edge) {
      if (edge.hasStairs && !edge.hasElevator) {
        flushSegment(nodeId, "take_stairs", "Take the stairs to change floors");
        segmentStartNodeId = nodeId;
        previousBearing = null;
        continue;
      }

      if (edge.hasElevator) {
        flushSegment(nodeId, "take_elevator", "Take the elevator to change floors");
        segmentStartNodeId = nodeId;
        previousBearing = null;
        continue;
      }

      if (edge.floor !== (edges[i]?.floor ?? edge.floor) && i < path.length - 1) {
        const floorLabel = edge.floor === 0 ? "Ground Floor" : `Floor ${edge.floor}`;
        flushSegment(nodeId, "enter_floor", `Go to ${floorLabel}`);
        segmentStartNodeId = nodeId;
        previousBearing = null;
        continue;
      }

      if (node.type === "entrance" && i < path.length - 1) {
        const buildingNode = findParentBuilding(nodes, node);
        const buildingName = buildingNode?.metadata.name ?? node.metadata.name;
        flushSegment(nodeId, "enter_building", `Enter ${buildingName}`);
        segmentStartNodeId = nodeId;
        previousBearing = null;
        continue;
      }
    }
  }

  if (accumulatedDistance > 0) {
    const lastNodeId = path[path.length - 1];
    const lastNode = nodes.get(lastNodeId);
    const destName = lastNode?.metadata.name ?? lastNodeId;
    instructions.push({
      step: stepCounter++,
      action: "continue",
      description: `Walk ${Math.round(accumulatedDistance)} m to ${destName}`,
      distance: accumulatedDistance,
      nodeId: lastNodeId,
    });
  }

  const lastNodeId = path[path.length - 1];
  const lastNode = nodes.get(lastNodeId);
  const destName = lastNode?.metadata.name ?? lastNodeId;
  instructions.push({
    step: stepCounter++,
    action: "arrive",
    description: `Arrive at ${destName}`,
    distance: 0,
    nodeId: lastNodeId,
  });

  return instructions;
}

function findParentBuilding(
  nodes: Map<string, GraphNode>,
  node: GraphNode
): GraphNode | null {
  for (const n of nodes.values()) {
    if (n.id === node.buildingId && n.type !== "room") {
      return n;
    }
  }
  for (const n of nodes.values()) {
    if (n.buildingId === node.buildingId && n.id !== node.id && n.type !== "room") {
      return n;
    }
  }
  return null;
}
