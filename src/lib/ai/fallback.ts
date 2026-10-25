interface FallbackResponse {
  text: string;
  suggestions: string[];
  source: "fallback";
}

const FALLBACK_RESPONSES: Record<string, FallbackResponse> = {
  library: {
    text: "The **Central Library** is located on the **2nd Floor** of the Main Building. It's one of the most visited spots on campus! There's also a **CSE Department Library** (CS 114) on the Ground Floor of the Main Building.\n\nWould you like me to start navigation?",
    suggestions: ["Show me library hours", "How to reach the library?", "Library digital section"],
    source: "fallback",
  },
  cse: {
    text: "The **Department of Computer Science & Engineering** is on the **Ground Floor** of the Main Building. Key rooms include:\n- CS 118 (HOD)\n- CS 106/107 (Faculty Rooms)\n- CS 108, 105, 115, 116 (Lecture Halls)\n- CS 110 (Hardware Lab), CS 111 (Software Lab), CS 112 (Network Lab)\n- CS 114 (Department Library)\n\nWould you like me to find a specific room?",
    suggestions: ["How to reach CSE?", "CSE labs list", "CSE HOD cabin location"],
    source: "fallback",
  },
  canteen: {
    text: "The **College Canteen** is located opposite the **EEE Block**. It's a great spot for a quick break between classes! 🍽️\n\nWould you like me to start navigation?",
    suggestions: ["How to reach the canteen?", "What's near the canteen?", "Canteen opening hours"],
    source: "fallback",
  },
  eee: {
    text: "The **EEE Block** is a separate building on campus. It houses:\n- Ground Floor: Labs (EE002-EE004), Lecture Halls, Faculty Rooms\n- First Floor: Simulation Labs, HOD Room, Conference Hall\n- Second Floor: Research Labs, M.Tech Classrooms\n\nThe Canteen is right opposite this block!",
    suggestions: ["How to reach EEE?", "EEE lab locations", "EEE HOD cabin"],
    source: "fallback",
  },
  gate: {
    text: "The **Main Gate** is the primary entrance to GEC Palakkad campus. It's located at coordinates 10.8495, 76.3510. Parking areas are available nearby for both cars and two-wheelers.\n\nWould you like directions to the gate?",
    suggestions: ["Directions from gate to Main Building", "Parking locations", "Campus map"],
    source: "fallback",
  },
  washroom: {
    text: "Washrooms are available on each floor of the Main Building and the EEE Block. The nearest one depends on your current location.\n\nWould you like me to find the nearest washroom from your current location?",
    suggestions: ["Nearest washroom to me", "Washroom in Main Building", "Accessible washrooms"],
    source: "fallback",
  },
  parking: {
    text: "Vehicle parking is available in the basement area of the campus and near the main gate. Both car and two-wheeler parking are available.\n\nWould you like directions to the parking area?",
    suggestions: ["Directions to parking", "Parking near Main Building", "Two wheeler parking"],
    source: "fallback",
  },
  medical: {
    text: "The **Medical Consultation Room** is on the **1st Floor** of the Main Building, in the Administrative Wing area.\n\nWould you like me to start navigation?",
    suggestions: ["How to reach Medical Room?", "Admin Block location", "Emergency contacts"],
    source: "fallback",
  },
  admin: {
    text: "The **Administrative Wing** is on the **1st Floor** of the Main Building. This includes the office, career guidance (CGPU), and examination cells.\n\nWould you like me to start navigation?",
    suggestions: ["Principal office location", "How to reach Admin Block?", "Exam Cell location"],
    source: "fallback",
  },
  it: {
    text: "The **Department of Information Technology** is on the **1st Floor** of the IT Block. Key rooms include:\n- IT 219 (HOD)\n- IT 206-217 (Lecture Halls)\n- IT 211-215 (Labs)\n\nWould you like me to find a specific room?",
    suggestions: ["How to reach IT Block?", "IT lab locations", "IT HOD cabin"],
    source: "fallback",
  },
  mech: {
    text: "The **Department of Mechanical Engineering** is on the **Ground Floor** of the Main Building. It includes lecture halls, labs, and faculty rooms.\n\nWould you like me to start navigation?",
    suggestions: ["How to reach MECH?", "MECH lab list", "MECH workshop location"],
    source: "fallback",
  },
  civil: {
    text: "The **Department of Civil Engineering** is on the **Ground Floor** of the Main Building. It includes lecture halls, labs, and faculty rooms.\n\nWould you like me to start navigation?",
    suggestions: ["How to reach Civil?", "Civil lab locations", "Civil HOD cabin"],
    source: "fallback",
  },
  route: {
    text: "I can help you find directions! Please tell me your starting point and destination. For example:\n- 'How do I get from the Main Gate to the CSE department?'\n- 'Route from canteen to library'\n- 'Directions from EEE Block to IT Block'",
    suggestions: ["Gate to Main Building", "Canteen to CSE", "Library to EEE Block"],
    source: "fallback",
  },
  hello: {
    text: "Hi! I'm CampusNav AI, your friendly campus navigation assistant for GEC Palakkad! 🎓\n\nI can help you:\n- Find any building, room, or facility on campus\n- Get the shortest walking route with turn-by-turn directions\n- Check if any paths are blocked\n- Find nearby canteens, washrooms, or labs\n\nWhere would you like to go today?",
    suggestions: ["Find a location", "Get directions", "What's nearby?"],
    source: "fallback",
  },
  help: {
    text: "I can help you with:\n1. **Finding locations** - labs, offices, classrooms, canteen, washrooms\n2. **Getting directions** - step-by-step route between two places\n3. **Nearby facilities** - nearest canteen, washroom, parking, etc.\n4. **Building info** - what's on each floor\n5. **Path status** - check if a route is blocked\n\nJust ask me anything about the GEC Palakkad campus!",
    suggestions: ["Find CSE lab", "Route from gate to library", "Nearest canteen"],
    source: "fallback",
  },
};

const KEYWORD_PATTERNS: Array<{ pattern: RegExp; responseKey: string }> = [
  { pattern: /\b(librar|reading|book|journal|digital\s*section)\b/i, responseKey: "library" },
  { pattern: /\b(cse|computer\s*sci|CS\s*\d)\b/i, responseKey: "cse" },
  { pattern: /\b(canteen|food|snack|mess|cafeteria|lunch)\b/i, responseKey: "canteen" },
  { pattern: /\b(eee|electrical|EE\s*\d)\b/i, responseKey: "eee" },
  { pattern: /\b(gate|entrance|main\s*gate|enter)\b/i, responseKey: "gate" },
  { pattern: /\b(washroom|toilet|restroom|wc|bathroom|loo)\b/i, responseKey: "washroom" },
  { pattern: /\b(park|parking|bike|car|two\s*wheeler)\b/i, responseKey: "parking" },
  { pattern: /\b(medical|first\s*aid|health|doctor|nurse)\b/i, responseKey: "medical" },
  { pattern: /\b(admin|principal|accounts|exam\s*cell|office)\b/i, responseKey: "admin" },
  { pattern: /\b(it\s*block|information\s*tech|IT\s*\d)\b/i, responseKey: "it" },
  { pattern: /\b(mech|mechanical|workshop|machine\s*shop|ME\s*\d)\b/i, responseKey: "mech" },
  { pattern: /\b(civil|CE\s*\d)\b/i, responseKey: "civil" },
  { pattern: /\b(route|direction|way|path|reach|navigate|go\s*to|get\s*to|how\s*(do|can)\s*I)\b/i, responseKey: "route" },
  { pattern: /\b(hi|hello|hey|namaste|good\s*(morning|afternoon|evening))\b/i, responseKey: "hello" },
  { pattern: /\b(help|what\s*can\s*you|what\s*do\s*you|how\s*to\s*use)\b/i, responseKey: "help" },
];

function findBestResponse(query: string): FallbackResponse {
  const normalizedQuery = query.toLowerCase().trim();

  for (const { pattern, responseKey } of KEYWORD_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return FALLBACK_RESPONSES[responseKey];
    }
  }

  return {
    text: "I'm currently offline and can't access the full campus database. Here's what I can help with:\n\n- Finding locations (e.g., 'Where is the library?')\n- Getting directions (e.g., 'How to reach CSE?')\n- Nearby facilities (e.g., 'Nearest canteen?')\n\nFor detailed information, please visit the **Locations** page on CampusNav.",
    suggestions: ["Visit Locations page", "Try again later", "Campus map"],
    source: "fallback",
  };
}

export function getOfflineResponse(query: string): FallbackResponse {
  return findBestResponse(query);
}

export function getOfflineGreeting(): FallbackResponse {
  return FALLBACK_RESPONSES.hello;
}

export function getOfflineHelp(): FallbackResponse {
  return FALLBACK_RESPONSES.help;
}

export function isOfflineCapable(query: string): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  return KEYWORD_PATTERNS.some(({ pattern }) => pattern.test(normalizedQuery));
}
