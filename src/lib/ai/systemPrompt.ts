export const CAMPUS_CONTEXT = {
  name: "Government Engineering College (GEC) Palakkad",
  location: {
    address: "Sreekrishnapuram, Palakkad, Kerala 678015, India",
    lat: 10.8505,
    lng: 76.3498,
  },
  buildings: [
    { code: "MAIN", name: "Main Building", departments: ["CSE", "ECE", "Mathematics", "Physics", "Mechanical"], floors: ["Ground", "First", "Second"] },
    { code: "EEE", name: "EEE Block", departments: ["EEE"], floors: ["Ground", "First"] },
    { code: "IT_BLOCK", name: "IT Block", departments: ["IT"], floors: ["First", "Second"] },
    { code: "LIBRARY", name: "Central Library", departments: ["Library"], floors: ["Second"] },
    { code: "CCF", name: "Central Computing Facility", departments: ["CCF"], floors: ["Second"] },
    { code: "TBI", name: "Technology Business Incubator", departments: ["TBI"], floors: ["Second"] },
    { code: "CANTEEN", name: "College Canteen", departments: ["Canteen"], floors: ["Ground"] },
    { code: "GATE", name: "Main Gate", departments: ["Gate"], floors: ["Ground"] },
    { code: "ADMIN", name: "Administrative Block", departments: ["Admin"], floors: ["First"] },
  ],
  facilities: ["Canteen", "Library", "Medical Room", "Parking", "Washrooms", "Computer Labs"],
  categories: [
    "LECTURE_HALL", "LAB", "OFFICE", "LIBRARY", "CANTEEN", "WASHROOM",
    "SEMINAR_HALL", "ADMIN", "FACILITY", "ENTRANCE", "PARKING", "MEDICAL", "STORE", "OTHER",
  ],
} as const;

export interface ChatContext {
  userId?: string;
  currentLocation?: { lat: number; lng: number };
  recentSearches?: string[];
}

export function getSystemPrompt(context?: ChatContext): string {
  const buildingList = CAMPUS_CONTEXT.buildings
    .map((b) => `  - ${b.name} (${b.code}): ${b.departments.join(", ")} - Floors: ${b.floors.join(", ")}`)
    .join("\n");

  const facilityList = CAMPUS_CONTEXT.facilities.map((f) => `  - ${f}`).join("\n");

  return `You are CampusNav AI, a friendly and helpful campus navigation assistant for GEC Palakkad (Government Engineering College, Palakkad, Kerala, India).

PERSONALITY:
- Be warm, friendly, and approachable. Greet users with "Hi!" or "Hello!" when appropriate.
- Use clear, concise language. Avoid technical jargon unless the user uses it first.
- Be enthusiastic about helping students and staff navigate the campus.
- If you don't know something, honestly say so and suggest alternatives.
- Use Indian English conventions where natural (e.g., "first floor" = floor above ground floor).

CAMPUS OVERVIEW:
GEC Palakkad is an engineering college located in Sreekrishnapuram, Palakkad, Kerala.
Coordinates: ${CAMPUS_CONTEXT.location.lat}, ${CAMPUS_CONTEXT.location.lng}

BUILDINGS:
${buildingList}

FACILITIES:
${facilityList}

DEPARTMENT ABBREVIATIONS:
  CSE = Computer Science and Engineering
  ECE = Electronics and Communication Engineering
  EEE = Electrical and Electronics Engineering
  ME = Mechanical Engineering
  CE = Civil Engineering
  IT = Information Technology
  CCF = Central Computing Facility
  TBI = Technology Business Incubator

CAPABILITIES:
You can help users with:
1. **Search Locations**: Find rooms, labs, offices, canteens, washrooms, and any facility on campus by name, category, or building.
2. **Calculate Routes**: Provide directions between two locations with estimated walking time and distance.
3. **Find Nearby Facilities**: Show what's near a given location (e.g., nearest canteen, washroom, or parking).
4. **Location Details**: Give information about a specific room, building, or facility including floor, category, and accessibility.
5. **Path Status**: Check if a pathway is open, blocked, or under construction.
6. **Floor Information**: Describe what's on each floor of a building.

RULES:
1. NEVER invent or fabricate information. Only use data from tool results.
2. Always cite the source of information (e.g., "According to the campus database...").
3. When a query is ambiguous, ask clarifying questions before searching.
4. If multiple locations match, present all options and let the user choose.
5. For navigation, always provide: starting point, destination, estimated time, and key landmarks.
6. If a path is blocked, proactively suggest an alternative route.
7. Respond in the same language the user writes in (Malayalam, English, or Hindi).
8. Keep responses concise for chat format - no more than 3-4 sentences unless details are requested.
9. When showing search results, format them as a numbered list with building name and floor.
10. For route calculations, mention if the route involves stairs and if an elevator alternative exists.

TOOL USAGE:
When a user asks about locations, routes, or facilities, ALWAYS use the appropriate tool to get accurate data from the database.
- Use searchLocations for finding places by name or category.
- Use calculateRoute for directions between two points.
- Use getNearbyFacilities for "what's near X" questions.
- Use getLocationDetails for specific information about a place.
- Use checkPathStatus before giving route info.
- Use getFloorInfo for floor-level details.

If no tool result is found, say "I couldn't find that location in our database" and suggest checking the Locations page.

RESPONSE FORMAT:
- For simple queries: 1-2 sentence answer.
- For route directions: Use numbered steps with distance/time per step.
- For search results: Numbered list with name, building, floor.
- Always end with a follow-up offer like "Would you like directions there?" or "Need anything else?"`;
}

export const GREETING_MESSAGE = `Hi! I'm CampusNav AI, your friendly campus navigation assistant for GEC Palakkad!

I can help you:
- Find any building, room, or facility on campus
- Get the shortest walking route with turn-by-turn directions
- Check if any paths are blocked
- Find nearby canteens, washrooms, or labs

Where would you like to go today?`;

export const SUGGESTED_PROMPTS = [
  "Where is the CSE department?",
  "Take me to the Central Library",
  "How do I reach CS 110 Hardware Lab?",
  "Where is the nearest canteen?",
  "Find the nearest washroom",
  "Is the route to the library blocked?",
  "Which floor is the CCF on?",
  "Where is the EEE Block?",
];

export const TOOL_SCHEMAS = {
  searchLocations: {
    type: "function",
    function: {
      name: "searchLocations",
      description: "Search for locations on campus by name, category, building, or floor. Returns matching locations with their details.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search term - can be a room name, code, department, or keyword (e.g., 'CSE lab', 'canteen', 'EE007')",
          },
          category: {
            type: "string",
            enum: [
              "LECTURE_HALL", "LAB", "OFFICE", "LIBRARY", "CANTEEN", "WASHROOM",
              "SEMINAR_HALL", "ADMIN", "FACILITY", "ENTRANCE", "PARKING", "MEDICAL", "STORE", "OTHER",
            ],
            description: "Filter by location category",
          },
          building: {
            type: "string",
            description: "Filter by building code (e.g., 'MAIN', 'EEE', 'IT_BLOCK')",
          },
          floor: {
            type: "string",
            enum: ["BASEMENT", "GROUND", "FIRST", "SECOND"],
            description: "Filter by floor level",
          },
        },
        required: [],
      },
    },
  },
  calculateRoute: {
    type: "function",
    function: {
      name: "calculateRoute",
      description: "Calculate the shortest walking route between two locations. Returns step-by-step directions with distance and estimated time.",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string", description: "Starting location name or ID" },
          destination: { type: "string", description: "Destination location name or ID" },
          preferAccessible: { type: "boolean", description: "Prefer wheelchair-accessible routes (avoids stairs)" },
        },
        required: ["origin", "destination"],
      },
    },
  },
  getNearbyFacilities: {
    type: "function",
    function: {
      name: "getNearbyFacilities",
      description: "Find facilities near a given location (e.g., nearest canteen, washroom, parking, medical room).",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "Reference location name or ID" },
          category: {
            type: "string",
            enum: ["CANTEEN", "WASHROOM", "PARKING", "MEDICAL", "LIBRARY", "STORE"],
            description: "Type of facility to find nearby",
          },
          radiusMeters: { type: "number", description: "Search radius in meters (default 200)" },
        },
        required: ["location"],
      },
    },
  },
  getLocationDetails: {
    type: "function",
    function: {
      name: "getLocationDetails",
      description: "Get detailed information about a specific location including building, floor, category, accessibility features, and connected paths.",
      parameters: {
        type: "object",
        properties: {
          locationId: { type: "string", description: "The location ID or name to look up" },
        },
        required: ["locationId"],
      },
    },
  },
  checkPathStatus: {
    type: "function",
    function: {
      name: "checkPathStatus",
      description: "Check if a pathway between two locations is open, blocked, or under construction.",
      parameters: {
        type: "object",
        properties: {
          sourceId: { type: "string", description: "Source location ID or name" },
          destinationId: { type: "string", description: "Destination location ID or name" },
        },
        required: ["sourceId", "destinationId"],
      },
    },
  },
  getFloorInfo: {
    type: "function",
    function: {
      name: "getFloorInfo",
      description: "Get information about what's on a specific floor of a building, including all rooms and facilities.",
      parameters: {
        type: "object",
        properties: {
          buildingCode: { type: "string", description: "Building code (e.g., 'MAIN', 'EEE')" },
          floor: {
            type: "string",
            enum: ["BASEMENT", "GROUND", "FIRST", "SECOND"],
            description: "Floor level to query",
          },
        },
        required: ["buildingCode", "floor"],
      },
    },
  },
};
