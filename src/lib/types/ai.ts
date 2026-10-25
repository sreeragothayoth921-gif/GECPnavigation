export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolCalls?: AIToolCall[];
  metadata?: Record<string, unknown>;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: AIToolResult;
}

export interface AIResponse {
  message: string;
  toolCalls: AIToolCall[];
  suggestions: string[];
  confidence: number;
  processingTimeMs: number;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface AIToolResult {
  toolCallId: string;
  success: boolean;
  data: unknown;
  error?: string;
  executionTimeMs: number;
}

export enum AIToolName {
  GET_BUILDING_INFO = "get_building_info",
  FIND_LOCATION = "find_location",
  GET_ROUTE = "get_route",
  GET_DISTANCE = "get_distance",
  SEARCH_AMENITIES = "search_amenities",
  GET_BUILDING_HOURS = "get_building_hours",
  REPORT_ISSUE = "report_issue",
  GET_NEARBY = "get_nearby",
}

export interface AIIntent {
  type: "navigation" | "information" | "search" | "report" | "general";
  confidence: number;
  entities: AIEntity[];
  rawQuery: string;
}

export interface AIEntity {
  type: "location" | "building" | "amenity" | "direction" | "time" | "floor";
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}
