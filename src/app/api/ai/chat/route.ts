import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';

const SYSTEM_PROMPT = `You are CampusNav AI, a friendly campus navigation assistant for GEC Palakkad (Government Engineering College Sreekrishnapuram). 
Be helpful, concise, and friendly. Help users find locations, give directions, and answer campus questions.
You can search locations, calculate routes, find nearby facilities, and check path status.
Always greet users warmly. Use emojis sparingly. Be encouraging.`;

function findLocationMatch(query: string, locations: any[]): any[] {
  const q = query.toLowerCase();
  return locations.filter(l =>
    l.name.toLowerCase().includes(q) ||
    (l.code && l.code.toLowerCase().includes(q)) ||
    (l.description && l.description.toLowerCase().includes(q))
  ).slice(0, 5);
}

function getKeywordResponse(query: string, locations: any[]): string {
  const q = query.toLowerCase();

  // Greeting
  if (q.match(/^(hi|hello|hey|good morning|good evening)/)) {
    return "Hello! Welcome to CampusNav AI! 🎓 I'm here to help you navigate GEC Palakkad. Where would you like to go?";
  }

  // Thanks
  if (q.match(/(thank|thanks|thx)/)) {
    return "You're welcome! Happy to help you navigate. Let me know if you need anything else! 😊";
  }

  // Help
  if (q.includes('help') || q.includes('what can you do')) {
    return "I can help you:\n📍 Find any building, room, or facility\n🗺️ Calculate shortest walking routes\n🔍 Search for specific locations\n📋 Get floor information\n🚧 Check if paths are blocked\n\nJust ask me anything about GEC Palakkad!";
  }

  // Location search
  const matches = findLocationMatch(q, locations);
  if (matches.length > 0) {
    const loc = matches[0];
    return `Found **${loc.name}**${loc.code ? ` (${loc.code})` : ''} in ${loc.building?.name || 'campus'}, ${loc.floor} Floor.\n\nWould you like me to help you navigate there?`;
  }

  // Category searches
  if (q.includes('canteen') || q.includes('food') || q.includes('eat')) {
    return "The College Canteen is located opposite the EEE Block. It's a popular spot between classes! 🍽️\n\nWould you like directions to the canteen?";
  }
  if (q.includes('library')) {
    const lib = locations.find(l => l.name.includes('Central Library'));
    return lib ? `The **Central Library** is on the 2nd Floor of the Main Building. There's also a CSE Department Library (CS 114) on the Ground Floor.\n\nWould you like directions?` : "The Central Library is on the 2nd Floor. There's also a CSE Department Library on the Ground Floor.";
  }
  if (q.includes('washroom') || q.includes('toilet') || q.includes('restroom')) {
    return "Washrooms are available on every floor of the Main Building and the EEE Block. Let me know your location and I'll find the nearest one!";
  }
  if (q.includes('parking')) {
    return "Vehicle parking is available in the basement area and near the Main Gate. Would you like directions?";
  }
  if (q.includes('medical') || q.includes('health')) {
    return "The Medical Consultation Room is on the 1st Floor of the Main Building in the Administrative Wing area.";
  }
  if (q.includes('hod')) {
    return "HOD rooms across departments:\n- CS 118 (CSE - Ground Floor)\n- EE109 (EEE - 1st Floor)\n- IT 219 (IT - 1st Floor)\n\nWhich department's HOD are you looking for?";
  }

  // Default
  return "I'm not sure about that specific location yet. Could you try:\n- Searching for a building name (e.g., 'CSE', 'EEE', 'Library')\n- Asking about a specific room code (e.g., 'CS 110')\n- Describing what you're looking for (e.g., 'hardware lab')\n\nI'm still learning about the campus! 📍";
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch locations for context
    const locations = await prisma.location.findMany({
      include: { building: true },
      where: { status: 'active' },
    });

    // Simple keyword matching AI (no external API needed)
    const response = getKeywordResponse(message, locations);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json({ response: "I'm having some trouble right now. Please try again in a moment." });
  }
}