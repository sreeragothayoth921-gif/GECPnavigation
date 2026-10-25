import { PrismaClient, UserRole, LocationCategory, PathStatus, Floor } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

function walkingTime(distanceMeters: number, speedKmh: number = 5): number {
  const speedMs = (speedKmh * 1000) / 3600;
  return Math.ceil(distanceMeters / speedMs);
}

function d(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const buildingsData = [
  { code: "MAIN", name: "Main Building", description: "Main academic block of GEC Palakkad housing CSE department", latitude: 10.8512, longitude: 76.3520, floors: [Floor.GROUND, Floor.FIRST, Floor.SECOND] },
  { code: "EEE", name: "EEE Block", description: "Electrical and Electronics Engineering department", latitude: 10.8508, longitude: 76.3530, floors: [Floor.GROUND, Floor.FIRST, Floor.SECOND] },
  { code: "IT_BLOCK", name: "IT Block", description: "Information Technology department block", latitude: 10.8518, longitude: 76.3525, floors: [Floor.GROUND, Floor.FIRST, Floor.SECOND] },
  { code: "MECH", name: "Mechanical Engineering Block", description: "Mechanical Engineering department", latitude: 10.8505, longitude: 76.3540, floors: [Floor.GROUND, Floor.FIRST] },
  { code: "CIVIL", name: "Civil Engineering Block", description: "Civil Engineering department", latitude: 10.8500, longitude: 76.3535, floors: [Floor.GROUND, Floor.FIRST] },
  { code: "CHEM", name: "Chemistry Block", description: "Chemistry department and labs", latitude: 10.8515, longitude: 76.3545, floors: [Floor.GROUND, Floor.FIRST] },
  { code: "PHYSICS", name: "Physics Block", description: "Physics department and labs", latitude: 10.8520, longitude: 76.3540, floors: [Floor.GROUND, Floor.FIRST] },
  { code: "MATH", name: "Mathematics Block", description: "Mathematics department", latitude: 10.8522, longitude: 76.3535, floors: [Floor.GROUND] },
  { code: "ADMIN", name: "Administrative Block", description: "Administrative office and accounts", latitude: 10.8510, longitude: 76.3510, floors: [Floor.GROUND] },
  { code: "LIBRARY", name: "Central Library", description: "Central library with reading rooms and digital section", latitude: 10.8507, longitude: 76.3515, floors: [Floor.GROUND, Floor.FIRST] },
  { code: "CCF", name: "Central Computing Facility", description: "Central computing facility with labs", latitude: 10.8516, longitude: 76.3518, floors: [Floor.GROUND, Floor.FIRST] },
  { code: "TBI", name: "Technology Business Incubator", description: "TBI for startups and innovation", latitude: 10.8525, longitude: 76.3520, floors: [Floor.GROUND] },
  { code: "CANTEEN", name: "College Canteen", description: "Main college canteen and food court", latitude: 10.8503, longitude: 76.3525, floors: [Floor.GROUND] },
  { code: "GATE", name: "Main Gate", description: "Main entrance gate of the campus", latitude: 10.8495, longitude: 76.3510, floors: [Floor.GROUND] },
];

const categoryMap: Record<string, LocationCategory> = {
  LECTURE_HALL: LocationCategory.LECTURE_HALL,
  LAB: LocationCategory.LAB,
  OFFICE: LocationCategory.OFFICE,
  LIBRARY: LocationCategory.LIBRARY,
  CANTEEN: LocationCategory.CANTEEN,
  WASHROOM: LocationCategory.WASHROOM,
  SEMINAR_HALL: LocationCategory.SEMINAR_HALL,
  ADMIN: LocationCategory.ADMIN,
  FACILITY: LocationCategory.FACILITY,
  ENTRANCE: LocationCategory.ENTRANCE,
  PARKING: LocationCategory.PARKING,
  MEDICAL: LocationCategory.MEDICAL,
  STORE: LocationCategory.STORE,
  OTHER: LocationCategory.OTHER,
};

const fMap: Record<string, Floor> = {
  BASEMENT: Floor.BASEMENT,
  GROUND: Floor.GROUND,
  FIRST: Floor.FIRST,
  SECOND: Floor.SECOND,
};

let locationsData: any[] = [];
let pathCounter = 0;

function loc(
  buildingCode: string,
  floor: string,
  code: string,
  name: string,
  category: string,
  mapX: number,
  mapY: number,
  lat: number,
  lng: number,
  opts: {
    shortName?: string;
    description?: string;
    isAccessible?: boolean;
    hasStairs?: boolean;
    hasElevator?: boolean;
    isEntrance?: boolean;
    isRestricted?: boolean;
  } = {}
) {
  locationsData.push({
    buildingCode,
    floor,
    code,
    name,
    shortName: opts.shortName || null,
    category,
    description: opts.description || null,
    mapX,
    mapY,
    latitude: lat,
    longitude: lng,
    isAccessible: opts.isAccessible !== undefined ? opts.isAccessible : true,
    hasStairs: opts.hasStairs || false,
    hasElevator: opts.hasElevator || false,
    isEntrance: opts.isEntrance || false,
    isRestricted: opts.isRestricted || false,
    status: "active",
    metadata: "{}",
  });
}

function seedCSE(buildingCode: string) {
  const baseLat = 10.8512;
  const baseLng = 76.3520;

  // Ground floor rooms
  loc(buildingCode, "GROUND", "CS 106", "Faculty Room 1", "OFFICE", 100, 120, baseLat + 0.000080, baseLng + 0.000030, { description: "CSE Faculty Room 1" });
  loc(buildingCode, "GROUND", "CS 107", "Faculty Room 2", "OFFICE", 100, 150, baseLat + 0.000080, baseLng + 0.000040, { description: "CSE Faculty Room 2" });
  loc(buildingCode, "GROUND", "CS 108", "Lecture Hall 1", "LECTURE_HALL", 130, 120, baseLat + 0.000090, baseLng + 0.000050, { description: "CSE Lecture Hall 1", hasStairs: true });
  loc(buildingCode, "GROUND", "CS 105", "Lecture Hall 2", "LECTURE_HALL", 130, 150, baseLat + 0.000090, baseLng + 0.000060, { description: "CSE Lecture Hall 2", hasStairs: true });
  loc(buildingCode, "GROUND", "CS 109", "Ladies Toilet", "WASHROOM", 160, 180, baseLat + 0.000050, baseLng + 0.000070, { description: "Ladies washroom ground floor" });
  loc(buildingCode, "GROUND", "CS 110", "Hardware Lab", "LAB", 160, 100, baseLat + 0.000100, baseLng + 0.000070, { description: "CSE Hardware Lab" });
  loc(buildingCode, "GROUND", "CS 111", "Software Lab", "LAB", 160, 130, baseLat + 0.000100, baseLng + 0.000080, { description: "CSE Software Lab" });
  loc(buildingCode, "GROUND", "CS 112", "Network Lab", "LAB", 160, 160, baseLat + 0.000100, baseLng + 0.000090, { description: "CSE Network Lab" });
  loc(buildingCode, "GROUND", "CS 113", "UPS Room", "FACILITY", 80, 200, baseLat + 0.000040, baseLng + 0.000100, { description: "UPS Room ground floor", isRestricted: true });
  loc(buildingCode, "GROUND", "CS 114", "Department Library", "LIBRARY", 130, 180, baseLat + 0.000060, baseLng + 0.000100, { description: "CSE Department Library" });
  loc(buildingCode, "GROUND", "CS 115", "Lecture Hall 3", "LECTURE_HALL", 100, 180, baseLat + 0.000070, baseLng + 0.000110, { description: "CSE Lecture Hall 3", hasStairs: true });
  loc(buildingCode, "GROUND", "CS 116", "Lecture Hall 4", "LECTURE_HALL", 100, 200, baseLat + 0.000075, baseLng + 0.000115, { description: "CSE Lecture Hall 4", hasStairs: true });
  loc(buildingCode, "GROUND", "CS 117", "Associate Professor Cabin", "OFFICE", 80, 100, baseLat + 0.000060, baseLng + 0.000020, { description: "HOD Associate Professor Cabin" });
  loc(buildingCode, "GROUND", "CS 118", "HOD Cabin", "OFFICE", 80, 80, baseLat + 0.000065, baseLng + 0.000015, { description: "Head of Department Cabin" });

  // First floor rooms
  loc(buildingCode, "FIRST", "CS 204A", "Computational Linguistics Lab", "LAB", 100, 120, baseLat + 0.000200, baseLng + 0.000030, { description: "CSE Computational Linguistics Lab", hasStairs: true, hasElevator: true });
  loc(buildingCode, "FIRST", "CS 204B", "Lecture Hall 5", "LECTURE_HALL", 130, 120, baseLat + 0.000200, baseLng + 0.000050, { description: "CSE Lecture Hall 5", hasStairs: true, hasElevator: true });
  loc(buildingCode, "FIRST", "CS 204C", "Research Lab", "LAB", 160, 120, baseLat + 0.000200, baseLng + 0.000070, { description: "CSE Research Lab", isRestricted: true, hasStairs: true, hasElevator: true });
  loc(buildingCode, "FIRST", "CS 205", "Seminar Hall", "SEMINAR_HALL", 160, 160, baseLat + 0.000200, baseLng + 0.000090, { description: "CSE Seminar Hall", hasStairs: true, hasElevator: true });

  // CCF / Common locations in MAIN building
  loc(buildingCode, "FIRST", "CS 131", "Drawing Hall", "OTHER", 130, 150, baseLat + 0.000150, baseLng + 0.000060, { description: "CSE Drawing Hall" });
  loc(buildingCode, "FIRST", "CS 132", "Project Lab", "LAB", 160, 180, baseLat + 0.000150, baseLng + 0.000080, { description: "CSE Project Lab" });
  loc(buildingCode, "FIRST", "CS 133", "UPS Room", "FACILITY", 80, 200, baseLat + 0.000150, baseLng + 0.000100, { description: "UPS Room first floor", isRestricted: true });

  // CCF building locations
  loc("CCF", "GROUND", "G 316", "CCF Server Room", "FACILITY", 100, 100, 10.85165, 76.35182, { description: "Central Computing Facility Server Room", isRestricted: true });
  loc("CCF", "GROUND", "G 315", "CCF UPS Room", "FACILITY", 80, 120, 10.85163, 76.35180, { description: "CCF UPS Room", isRestricted: true });
  loc("CCF", "GROUND", "G 306", "Store Room", "STORE", 60, 100, 10.85161, 76.35178, { description: "CCF Store Room", isRestricted: true });
}

function seedEEE() {
  const b = "EEE";
  const baseLat = 10.8508;
  const baseLng = 76.3530;

  // Ground floor EE001-EE011
  const eeeGround = [
    ["EE001", "EE Lab 1", "LAB"],
    ["EE002", "EE Lab 2", "LAB"],
    ["EE003", "EE Lecture Hall 1", "LECTURE_HALL"],
    ["EE004", "EE Lecture Hall 2", "LECTURE_HALL"],
    ["EE005", "EE Faculty Room 1", "OFFICE"],
    ["EE006", "EE Faculty Room 2", "OFFICE"],
    ["EE007", "EE HOD Cabin", "OFFICE"],
    ["EE008", "EE Workshop", "LAB"],
    ["EE009", "EE Seminar Hall", "SEMINAR_HALL"],
    ["EE010", "EE Store Room", "STORE"],
    ["EE011", "EE Washroom", "WASHROOM"],
  ];
  eeeGround.forEach(([code, name, cat], i) => {
    loc(b, "GROUND", code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30, baseLat + 0.000050 * (i % 4), baseLng + 0.000050 * Math.floor(i / 4), { hasStairs: true });
  });

  // First floor EE102-EE111
  const eeeFirst = [
    ["EE102", "EE Power Systems Lab", "LAB"],
    ["EE103", "EE Control Systems Lab", "LAB"],
    ["EE104", "EE Lecture Hall 3", "LECTURE_HALL"],
    ["EE105", "EE Lecture Hall 4", "LECTURE_HALL"],
    ["EE106", "EE Faculty Room 3", "OFFICE"],
    ["EE107", "EE Faculty Room 4", "OFFICE"],
    ["EE108", "EE Digital Lab", "LAB"],
    ["EE109", "EE Machines Lab", "LAB"],
    ["EE110", "EE Department Library", "LIBRARY"],
    ["EE111", "EE Ladies Washroom", "WASHROOM"],
  ];
  eeeFirst.forEach(([code, name, cat], i) => {
    loc(b, "FIRST", code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30, baseLat + 0.000200 + 0.000050 * (i % 4), baseLng + 0.000050 * Math.floor(i / 4), { hasStairs: true, hasElevator: true });
  });

  // Second floor EE201-EE212
  const eeeSecond = [
    ["EE201", "EE Research Lab", "LAB"],
    ["EE202", "EE Project Lab", "LAB"],
    ["EE203", "EE Lecture Hall 5", "LECTURE_HALL"],
    ["EE204", "EE High Voltage Lab", "LAB"],
    ["EE205", "EE Faculty Room 5", "OFFICE"],
    ["EE206", "EE Faculty Room 6", "OFFICE"],
    ["EE207", "EE Electronics Lab", "LAB"],
    ["EE208", "EE Communication Lab", "LAB"],
    ["EE209", "EE Seminar Room", "SEMINAR_HALL"],
    ["EE210", "EE Computer Lab", "LAB"],
    ["EE211", "EE Store Room", "STORE"],
    ["EE212", "EE Washroom", "WASHROOM"],
  ];
  eeeSecond.forEach(([code, name, cat], i) => {
    loc(b, "SECOND", code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30, baseLat + 0.000400 + 0.000050 * (i % 4), baseLng + 0.000050 * Math.floor(i / 4), { hasStairs: true, hasElevator: true });
  });
}

function seedIT() {
  const b = "IT_BLOCK";
  const baseLat = 10.8518;
  const baseLng = 76.3525;

  const itRooms = [
    ["IT206", "Lecture Hall 1", "LECTURE_HALL", "GROUND"],
    ["IT207", "Faculty Room 1", "OFFICE", "GROUND"],
    ["IT208", "Faculty Room 2", "OFFICE", "GROUND"],
    ["IT209", "Faculty Room 3", "OFFICE", "GROUND"],
    ["IT210", "Faculty Room 4", "OFFICE", "GROUND"],
    ["IT211", "Software Lab 1", "LAB", "GROUND"],
    ["IT212", "Software Lab 2", "LAB", "GROUND"],
    ["IT213", "Network Lab", "LAB", "GROUND"],
    ["IT214", "Database Lab", "LAB", "FIRST"],
    ["IT215", "Project Lab", "LAB", "FIRST"],
    ["IT216", "Lecture Hall 2", "LECTURE_HALL", "FIRST"],
    ["IT217", "Lecture Hall 3", "LECTURE_HALL", "FIRST"],
    ["IT218", "Department Library", "LIBRARY", "FIRST"],
    ["IT219", "HOD Cabin", "OFFICE", "FIRST"],
  ];
  itRooms.forEach(([code, name, cat, floor], i) => {
    const isGround = floor === "GROUND";
    loc(b, floor, code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30,
      baseLat + (isGround ? 0 : 0.000200) + 0.000050 * (i % 4),
      baseLng + 0.000050 * Math.floor(i / 4),
      { hasStairs: true, hasElevator: isGround ? false : true }
    );
  });
}

function seedECE() {
  const b = "MAIN";
  const baseLat = 10.8512;
  const baseLng = 76.3520;

  const eceRooms = [
    ["EC002", "ECE Lecture Hall 1", "LECTURE_HALL", "GROUND"],
    ["EC003", "ECE Lecture Hall 2", "LECTURE_HALL", "GROUND"],
    ["EC004", "ECE Faculty Room 1", "OFFICE", "GROUND"],
    ["EC005", "ECE Faculty Room 2", "OFFICE", "GROUND"],
    ["EC006", "ECE HOD Cabin", "OFFICE", "GROUND"],
    ["EC007", "ECE Digital Lab", "LAB", "GROUND"],
    ["EC008", "ECE Analog Lab", "LAB", "GROUND"],
    ["EC009", "ECE Communication Lab", "LAB", "GROUND"],
    ["EC010", "ECE Department Library", "LIBRARY", "GROUND"],
    ["EC011", "ECE Store Room", "STORE", "GROUND"],
    ["EC012", "ECE Washroom", "WASHROOM", "GROUND"],
    ["EC013", "ECE Seminar Hall", "SEMINAR_HALL", "GROUND"],
    ["EC014", "ECE Workshop", "LAB", "GROUND"],
    ["ECE101", "ECE Microprocessor Lab", "LAB", "FIRST"],
    ["ECE102", "ECE VLSI Lab", "LAB", "FIRST"],
    ["ECE103", "ECE Lecture Hall 3", "LECTURE_HALL", "FIRST"],
    ["ECE104", "ECE Project Lab", "LAB", "FIRST"],
  ];
  eceRooms.forEach(([code, name, cat, floor], i) => {
    const isGround = floor === "GROUND";
    loc(b, floor, code, name, cat, 180 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30,
      baseLat + (isGround ? -0.000100 : 0.000100) + 0.000050 * (i % 4),
      baseLng + 0.000050 * Math.floor(i / 4),
      { hasStairs: true, hasElevator: isGround ? false : true }
    );
  });
}

function seedMECH() {
  const b = "MECH";
  const baseLat = 10.8505;
  const baseLng = 76.3540;

  const mechRooms = [
    ["ME001", "ME Lecture Hall 1", "LECTURE_HALL"],
    ["ME002", "ME Lecture Hall 2", "LECTURE_HALL"],
    ["ME003", "ME Faculty Room 1", "OFFICE"],
    ["ME004", "ME Faculty Room 2", "OFFICE"],
    ["ME005", "ME HOD Cabin", "OFFICE"],
    ["ME006", "ME Workshop", "LAB"],
    ["ME007", "ME Machine Shop", "LAB"],
    ["ME008", "ME Thermal Lab", "LAB"],
    ["ME009", "ME Fluid Mechanics Lab", "LAB"],
    ["ME010", "ME Department Library", "LIBRARY"],
    ["ME011", "ME Store Room", "STORE"],
    ["ME012", "ME Washroom", "WASHROOM"],
  ];
  mechRooms.forEach(([code, name, cat], i) => {
    loc(b, "GROUND", code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30, baseLat + 0.000050 * (i % 4), baseLng + 0.000050 * Math.floor(i / 4), { hasStairs: true });
  });

  const mechFirst = [
    ["ME101", "ME CAD Lab", "LAB"],
    ["ME102", "ME CAM Lab", "LAB"],
    ["ME103", "ME Lecture Hall 3", "LECTURE_HALL"],
    ["ME104", "ME Faculty Room 3", "OFFICE"],
    ["ME105", "ME Project Lab", "LAB"],
  ];
  mechFirst.forEach(([code, name, cat], i) => {
    loc(b, "FIRST", code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30, baseLat + 0.000200 + 0.000050 * (i % 4), baseLng + 0.000050 * Math.floor(i / 4), { hasStairs: true, hasElevator: true });
  });
}

function seedCIVIL() {
  const b = "CIVIL";
  const baseLat = 10.8500;
  const baseLng = 76.3535;

  const civilRooms = [
    ["CV001", "CE Lecture Hall 1", "LECTURE_HALL"],
    ["CV002", "CE Lecture Hall 2", "LECTURE_HALL"],
    ["CV003", "CE Faculty Room 1", "OFFICE"],
    ["CV004", "CE Faculty Room 2", "OFFICE"],
    ["CV005", "CE HOD Cabin", "OFFICE"],
    ["CV006", "CE Survey Lab", "LAB"],
    ["CV007", "CE Strength of Materials Lab", "LAB"],
    ["CV008", "CE Geotech Lab", "LAB"],
    ["CV009", "CE Department Library", "LIBRARY"],
    ["CV010", "CE Store Room", "STORE"],
    ["CV011", "CE Washroom", "WASHROOM"],
  ];
  civilRooms.forEach(([code, name, cat], i) => {
    loc(b, "GROUND", code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30, baseLat + 0.000050 * (i % 4), baseLng + 0.000050 * Math.floor(i / 4), { hasStairs: true });
  });

  const civilFirst = [
    ["CV101", "CE Computer Lab", "LAB"],
    ["CV102", "CE Environmental Lab", "LAB"],
    ["CV103", "CE Lecture Hall 3", "LECTURE_HALL"],
  ];
  civilFirst.forEach(([code, name, cat], i) => {
    loc(b, "FIRST", code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30, baseLat + 0.000200 + 0.000050 * (i % 4), baseLng + 0.000050 * Math.floor(i / 4), { hasStairs: true, hasElevator: true });
  });
}

function seedCHEM() {
  const b = "CHEM";
  const baseLat = 10.8515;
  const baseLng = 76.3545;

  const chemRooms = [
    ["CH001", "Chemistry Lecture Hall 1", "LECTURE_HALL"],
    ["CH002", "Chemistry Lecture Hall 2", "LECTURE_HALL"],
    ["CH003", "Chemistry Faculty Room 1", "OFFICE"],
    ["CH004", "Chemistry Faculty Room 2", "OFFICE"],
    ["CH005", "Chemistry HOD Cabin", "OFFICE"],
    ["CH006", "Chemistry Inorganic Lab", "LAB"],
    ["CH007", "Chemistry Organic Lab", "LAB"],
    ["CH008", "Chemistry Physical Lab", "LAB"],
    ["CH009", "Chemistry Department Library", "LIBRARY"],
    ["CH010", "Chemistry Store Room", "STORE"],
    ["CH011", "Chemistry Washroom", "WASHROOM"],
  ];
  chemRooms.forEach(([code, name, cat], i) => {
    loc(b, "GROUND", code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30, baseLat + 0.000050 * (i % 4), baseLng + 0.000050 * Math.floor(i / 4), { hasStairs: true });
  });

  loc(b, "FIRST", "CH101", "Chemistry Research Lab", "LAB", 80, 80, baseLat + 0.000200, baseLng, { hasStairs: true, hasElevator: true });
  loc(b, "FIRST", "CH102", "Chemistry Instrumentation Lab", "LAB", 110, 80, baseLat + 0.000200, baseLng + 0.000030, { hasStairs: true, hasElevator: true });
}

function seedPHYSICS() {
  const b = "PHYSICS";
  const baseLat = 10.8520;
  const baseLng = 76.3540;

  const phyRooms = [
    ["PH001", "Physics Lecture Hall 1", "LECTURE_HALL"],
    ["PH002", "Physics Lecture Hall 2", "LECTURE_HALL"],
    ["PH003", "Physics Faculty Room 1", "OFFICE"],
    ["PH004", "Physics Faculty Room 2", "OFFICE"],
    ["PH005", "Physics HOD Cabin", "OFFICE"],
    ["PH006", "Physics Optics Lab", "LAB"],
    ["PH007", "Physics Electronics Lab", "LAB"],
    ["PH008", "Physics Mechanics Lab", "LAB"],
    ["PH009", "Physics Department Library", "LIBRARY"],
    ["PH010", "Physics Store Room", "STORE"],
    ["PH011", "Physics Washroom", "WASHROOM"],
  ];
  phyRooms.forEach(([code, name, cat], i) => {
    loc(b, "GROUND", code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30, baseLat + 0.000050 * (i % 4), baseLng + 0.000050 * Math.floor(i / 4), { hasStairs: true });
  });

  loc(b, "FIRST", "PH101", "Physics Research Lab", "LAB", 80, 80, baseLat + 0.000200, baseLng, { hasStairs: true, hasElevator: true });
  loc(b, "FIRST", "PH102", "Physics Computational Lab", "LAB", 110, 80, baseLat + 0.000200, baseLng + 0.000030, { hasStairs: true, hasElevator: true });
}

function seedMATH() {
  const b = "MATH";
  const baseLat = 10.8522;
  const baseLng = 76.3535;

  const mathRooms = [
    ["MA001", "Mathematics Lecture Hall 1", "LECTURE_HALL"],
    ["MA002", "Mathematics Lecture Hall 2", "LECTURE_HALL"],
    ["MA003", "Mathematics Faculty Room 1", "OFFICE"],
    ["MA004", "Mathematics Faculty Room 2", "OFFICE"],
    ["MA005", "Mathematics HOD Cabin", "OFFICE"],
    ["MA006", "Mathematics Department Library", "LIBRARY"],
    ["MA007", "Mathematics Computer Lab", "LAB"],
    ["MA008", "Mathematics Store Room", "STORE"],
    ["MA009", "Mathematics Washroom", "WASHROOM"],
  ];
  mathRooms.forEach(([code, name, cat], i) => {
    loc(b, "GROUND", code, name, cat, 80 + (i % 4) * 30, 80 + Math.floor(i / 4) * 30, baseLat + 0.000050 * (i % 4), baseLng + 0.000050 * Math.floor(i / 4), { hasStairs: true });
  });
}

function seedFacilities() {
  // Admin block
  loc("ADMIN", "GROUND", "ADM001", "Principal Office", "ADMIN", 80, 80, 10.8510, 76.3510, { description: "Office of the Principal" });
  loc("ADMIN", "GROUND", "ADM002", "Accounts Office", "ADMIN", 110, 80, 10.85102, 76.35103, { description: "College accounts and fees" });
  loc("ADMIN", "GROUND", "ADM003", "Exam Cell", "ADMIN", 140, 80, 10.85104, 76.35106, { description: "Examination cell" });
  loc("ADMIN", "GROUND", "ADM004", "Office Room 1", "ADMIN", 80, 110, 10.85101, 76.35101, { description: "General administration office" });
  loc("ADMIN", "GROUND", "ADM005", "Office Room 2", "ADMIN", 110, 110, 10.85103, 76.35104, { description: "General administration office 2" });
  loc("ADMIN", "GROUND", "ADM006", "Conference Room", "ADMIN", 140, 110, 10.85105, 76.35107, { description: "Administrative conference room" });
  loc("ADMIN", "GROUND", "ADM007", "Reception", "ADMIN", 80, 140, 10.85099, 76.35099, { description: "Admin reception area" });

  // Library
  loc("LIBRARY", "GROUND", "LIB001", "Main Reading Hall", "LIBRARY", 80, 80, 10.8507, 76.3515, { description: "Main reading hall" });
  loc("LIBRARY", "GROUND", "LIB002", "Reference Section", "LIBRARY", 110, 80, 10.85072, 76.35153, { description: "Reference books section" });
  loc("LIBRARY", "GROUND", "LIB003", "Digital Library", "LIBRARY", 140, 80, 10.85074, 76.35156, { description: "Digital library with computers" });
  loc("LIBRARY", "GROUND", "LIB004", "Circulation Desk", "LIBRARY", 80, 110, 10.85069, 76.35149, { description: "Book issue and return counter" });
  loc("LIBRARY", "FIRST", "LIB005", "Journal Section", "LIBRARY", 80, 80, 10.85071, 76.35151, { description: "Journal and periodicals section", hasStairs: true, hasElevator: true });
  loc("LIBRARY", "FIRST", "LIB006", "Digital Section", "LIBRARY", 110, 80, 10.85073, 76.35154, { description: "Digital section with workstations", hasStairs: true, hasElevator: true });

  // Canteen
  loc("CANTEEN", "GROUND", "CAN001", "Main Canteen Hall", "CANTEEN", 80, 80, 10.8503, 76.3525, { description: "Main dining area" });
  loc("CANTEEN", "GROUND", "CAN002", "Food Counter", "CANTEEN", 110, 80, 10.85032, 76.35253, { description: "Food ordering counter" });
  loc("CANTEEN", "GROUND", "CAN003", "Snack Corner", "CANTEEN", 140, 80, 10.85034, 76.35256, { description: "Snacks and beverages" });

  // Main Gate
  loc("GATE", "GROUND", "GATE01", "Main Entrance", "ENTRANCE", 80, 80, 10.8495, 76.3510, { description: "Main entrance gate", isEntrance: true });
  loc("GATE", "GROUND", "GATE02", "Security Checkpoint", "FACILITY", 110, 80, 10.84952, 76.35103, { description: "Security checkpoint" });

  // Parking
  loc("GATE", "GROUND", "PKG01", "Main Parking Area", "PARKING", 80, 120, 10.8496, 76.3512, { description: "Main parking area near gate" });
  loc("GATE", "GROUND", "PKG02", "Two Wheeler Parking", "PARKING", 110, 120, 10.84962, 76.35123, { description: "Two wheeler parking" });

  // Medical
  loc("ADMIN", "GROUND", "MED01", "Medical Room", "MEDICAL", 170, 110, 10.85108, 76.35108, { description: "First aid and medical room" });

  // Common facilities
  loc("MAIN", "GROUND", "WC01", "Main Block Washroom G", "WASHROOM", 50, 50, 10.85118, 76.35198, { description: "Ground floor washroom" });
  loc("MAIN", "FIRST", "WC02", "Main Block Washroom 1F", "WASHROOM", 50, 50, 10.85138, 76.35218, { description: "First floor washroom", hasStairs: true });
  loc("EEE", "GROUND", "WC03", "EEE Block Washroom G", "WASHROOM", 50, 50, 10.85078, 76.35298, { description: "EEE ground floor washroom" });
  loc("IT_BLOCK", "GROUND", "WC04", "IT Block Washroom G", "WASHROOM", 50, 50, 10.85178, 76.35248, { description: "IT ground floor washroom" });
}

function seedPaths() {
  const allLocs = locationsData.map((l, idx) => ({ ...l, idx }));

  const pathsData: any[] = [];

  function addPath(
    srcIdx: number,
    dstIdx: number,
    distanceMeters: number,
    opts: {
      direction?: string;
      floor?: string;
      isBidirectional?: boolean;
      isAccessible?: boolean;
      hasStairs?: boolean;
      hasElevator?: boolean;
      status?: string;
    } = {}
  ) {
    if (srcIdx === dstIdx || srcIdx >= allLocs.length || dstIdx >= allLocs.length) return;
    const src = allLocs[srcIdx];
    const dst = allLocs[dstIdx];
    pathsData.push({
      sourceCode: src.code,
      destinationCode: dst.code,
      distanceMeters,
      walkingTimeSec: walkingTime(distanceMeters),
      direction: opts.direction || null,
      floor: opts.floor || src.floor,
      isBidirectional: opts.isBidirectional !== undefined ? opts.isBidirectional : true,
      isAccessible: opts.isAccessible !== undefined ? opts.isAccessible : true,
      hasStairs: opts.hasStairs || false,
      hasElevator: opts.hasElevator || false,
      status: opts.status || "OPEN",
      metadata: "{}",
    });
  }

  // Build a map from code to index
  const codeToIdx: Record<string, number> = {};
  allLocs.forEach((l, i) => { codeToIdx[l.code] = i; });

  // CSE internal connections (ground floor)
  const cseGround = ["CS 118", "CS 117", "CS 106", "CS 107", "CS 108", "CS 105", "CS 109", "CS 110", "CS 111", "CS 112", "CS 113", "CS 114", "CS 115", "CS 116"];
  for (let i = 0; i < cseGround.length - 1; i++) {
    if (codeToIdx[cseGround[i]] !== undefined && codeToIdx[cseGround[i + 1]] !== undefined) {
      addPath(codeToIdx[cseGround[i]], codeToIdx[cseGround[i + 1]], 12 + Math.random() * 8);
    }
  }

  // CSE first floor connections
  const cseFirst = ["CS 204A", "CS 204B", "CS 204C", "CS 205", "CS 131", "CS 132", "CS 133"];
  for (let i = 0; i < cseFirst.length - 1; i++) {
    if (codeToIdx[cseFirst[i]] !== undefined && codeToIdx[cseFirst[i + 1]] !== undefined) {
      addPath(codeToIdx[cseFirst[i]], codeToIdx[cseFirst[i + 1]], 12 + Math.random() * 8);
    }
  }

  // Stairs between CSE ground and first
  if (codeToIdx["CS 108"] !== undefined && codeToIdx["CS 204B"] !== undefined) {
    addPath(codeToIdx["CS 108"], codeToIdx["CS 204B"], 15, { hasStairs: true, hasElevator: true, isAccessible: true });
  }

  // CCF connections
  if (codeToIdx["G 316"] !== undefined && codeToIdx["G 315"] !== undefined) {
    addPath(codeToIdx["G 316"], codeToIdx["G 315"], 10, { floor: "GROUND" });
  }
  if (codeToIdx["G 315"] !== undefined && codeToIdx["G 306"] !== undefined) {
    addPath(codeToIdx["G 315"], codeToIdx["G 306"], 10, { floor: "GROUND" });
  }

  // EEE internal connections
  const eeeCodes = ["EE001", "EE002", "EE003", "EE004", "EE005", "EE006", "EE007", "EE008", "EE009", "EE010", "EE011"];
  for (let i = 0; i < eeeCodes.length - 1; i++) {
    if (codeToIdx[eeeCodes[i]] !== undefined && codeToIdx[eeeCodes[i + 1]] !== undefined) {
      addPath(codeToIdx[eeeCodes[i]], codeToIdx[eeeCodes[i + 1]], 10 + Math.random() * 6);
    }
  }

  const eeeFirst = ["EE102", "EE103", "EE104", "EE105", "EE106", "EE107", "EE108", "EE109", "EE110", "EE111"];
  for (let i = 0; i < eeeFirst.length - 1; i++) {
    if (codeToIdx[eeeFirst[i]] !== undefined && codeToIdx[eeeFirst[i + 1]] !== undefined) {
      addPath(codeToIdx[eeeFirst[i]], codeToIdx[eeeFirst[i + 1]], 10 + Math.random() * 6);
    }
  }

  const eeeSecond = ["EE201", "EE202", "EE203", "EE204", "EE205", "EE206", "EE207", "EE208", "EE209", "EE210", "EE211", "EE212"];
  for (let i = 0; i < eeeSecond.length - 1; i++) {
    if (codeToIdx[eeeSecond[i]] !== undefined && codeToIdx[eeeSecond[i + 1]] !== undefined) {
      addPath(codeToIdx[eeeSecond[i]], codeToIdx[eeeSecond[i + 1]], 10 + Math.random() * 6);
    }
  }

  // EEE stairs
  if (codeToIdx["EE007"] !== undefined && codeToIdx["EE102"] !== undefined) {
    addPath(codeToIdx["EE007"], codeToIdx["EE102"], 15, { hasStairs: true, hasElevator: true });
  }
  if (codeToIdx["EE102"] !== undefined && codeToIdx["EE201"] !== undefined) {
    addPath(codeToIdx["EE102"], codeToIdx["EE201"], 15, { hasStairs: true, hasElevator: true });
  }

  // IT internal connections
  const itCodes = ["IT206", "IT207", "IT208", "IT209", "IT210", "IT211", "IT212", "IT213", "IT214", "IT215", "IT216", "IT217", "IT218", "IT219"];
  for (let i = 0; i < itCodes.length - 1; i++) {
    if (codeToIdx[itCodes[i]] !== undefined && codeToIdx[itCodes[i + 1]] !== undefined) {
      addPath(codeToIdx[itCodes[i]], codeToIdx[itCodes[i + 1]], 10 + Math.random() * 6);
    }
  }

  // ECE internal connections
  const eceCodes = ["EC002", "EC003", "EC004", "EC005", "EC006", "EC007", "EC008", "EC009", "EC010", "EC011", "EC012", "EC013", "EC014"];
  for (let i = 0; i < eceCodes.length - 1; i++) {
    if (codeToIdx[eceCodes[i]] !== undefined && codeToIdx[eceCodes[i + 1]] !== undefined) {
      addPath(codeToIdx[eceCodes[i]], codeToIdx[eceCodes[i + 1]], 10 + Math.random() * 6);
    }
  }
  if (codeToIdx["EC014"] !== undefined && codeToIdx["ECE101"] !== undefined) {
    addPath(codeToIdx["EC014"], codeToIdx["ECE101"], 15, { hasStairs: true, hasElevator: true });
  }

  // MECH internal connections
  const mechCodes = ["ME001", "ME002", "ME003", "ME004", "ME005", "ME006", "ME007", "ME008", "ME009", "ME010", "ME011", "ME012"];
  for (let i = 0; i < mechCodes.length - 1; i++) {
    if (codeToIdx[mechCodes[i]] !== undefined && codeToIdx[mechCodes[i + 1]] !== undefined) {
      addPath(codeToIdx[mechCodes[i]], codeToIdx[mechCodes[i + 1]], 10 + Math.random() * 6);
    }
  }

  // CIVIL internal connections
  const civilCodes = ["CV001", "CV002", "CV003", "CV004", "CV005", "CV006", "CV007", "CV008", "CV009", "CV010", "CV011"];
  for (let i = 0; i < civilCodes.length - 1; i++) {
    if (codeToIdx[civilCodes[i]] !== undefined && codeToIdx[civilCodes[i + 1]] !== undefined) {
      addPath(codeToIdx[civilCodes[i]], codeToIdx[civilCodes[i + 1]], 10 + Math.random() * 6);
    }
  }

  // CHEM internal connections
  const chemCodes = ["CH001", "CH002", "CH003", "CH004", "CH005", "CH006", "CH007", "CH008", "CH009", "CH010", "CH011"];
  for (let i = 0; i < chemCodes.length - 1; i++) {
    if (codeToIdx[chemCodes[i]] !== undefined && codeToIdx[chemCodes[i + 1]] !== undefined) {
      addPath(codeToIdx[chemCodes[i]], codeToIdx[chemCodes[i + 1]], 10 + Math.random() * 6);
    }
  }

  // PHYSICS internal connections
  const phyCodes = ["PH001", "PH002", "PH003", "PH004", "PH005", "PH006", "PH007", "PH008", "PH009", "PH010", "PH011"];
  for (let i = 0; i < phyCodes.length - 1; i++) {
    if (codeToIdx[phyCodes[i]] !== undefined && codeToIdx[phyCodes[i + 1]] !== undefined) {
      addPath(codeToIdx[phyCodes[i]], codeToIdx[phyCodes[i + 1]], 10 + Math.random() * 6);
    }
  }

  // MATH internal connections
  const mathCodes = ["MA001", "MA002", "MA003", "MA004", "MA005", "MA006", "MA007", "MA008", "MA009"];
  for (let i = 0; i < mathCodes.length - 1; i++) {
    if (codeToIdx[mathCodes[i]] !== undefined && codeToIdx[mathCodes[i + 1]] !== undefined) {
      addPath(codeToIdx[mathCodes[i]], codeToIdx[mathCodes[i + 1]], 10 + Math.random() * 6);
    }
  }

  // Inter-building connections (realistic distances)
  // Gate -> Parking -> Admin
  if (codeToIdx["GATE01"] !== undefined && codeToIdx["PKG01"] !== undefined) {
    addPath(codeToIdx["GATE01"], codeToIdx["PKG01"], 45);
  }
  if (codeToIdx["PKG01"] !== undefined && codeToIdx["PKG02"] !== undefined) {
    addPath(codeToIdx["PKG01"], codeToIdx["PKG02"], 15);
  }
  if (codeToIdx["GATE01"] !== undefined && codeToIdx["ADM001"] !== undefined) {
    addPath(codeToIdx["GATE01"], codeToIdx["ADM001"], 80);
  }
  if (codeToIdx["GATE01"] !== undefined && codeToIdx["ADM007"] !== undefined) {
    addPath(codeToIdx["GATE01"], codeToIdx["ADM007"], 75);
  }

  // Gate -> Canteen
  if (codeToIdx["GATE01"] !== undefined && codeToIdx["CAN001"] !== undefined) {
    addPath(codeToIdx["GATE01"], codeToIdx["CAN001"], 100);
  }

  // Admin -> Library
  if (codeToIdx["ADM001"] !== undefined && codeToIdx["LIB001"] !== undefined) {
    addPath(codeToIdx["ADM001"], codeToIdx["LIB001"], 30);
  }

  // Admin -> Main Block
  if (codeToIdx["ADM001"] !== undefined && codeToIdx["CS 118"] !== undefined) {
    addPath(codeToIdx["ADM001"], codeToIdx["CS 118"], 55);
  }

  // Canteen -> Main Block
  if (codeToIdx["CAN001"] !== undefined && codeToIdx["CS 118"] !== undefined) {
    addPath(codeToIdx["CAN001"], codeToIdx["CS 118"], 65);
  }

  // Canteen -> EEE
  if (codeToIdx["CAN001"] !== undefined && codeToIdx["EE001"] !== undefined) {
    addPath(codeToIdx["CAN001"], codeToIdx["EE001"], 85);
  }

  // Main Block <-> EEE
  if (codeToIdx["CS 118"] !== undefined && codeToIdx["EE001"] !== undefined) {
    addPath(codeToIdx["CS 118"], codeToIdx["EE001"], 40);
  }
  if (codeToIdx["CS 116"] !== undefined && codeToIdx["EE011"] !== undefined) {
    addPath(codeToIdx["CS 116"], codeToIdx["EE011"], 35);
  }

  // Main Block <-> IT Block
  if (codeToIdx["CS 108"] !== undefined && codeToIdx["IT206"] !== undefined) {
    addPath(codeToIdx["CS 108"], codeToIdx["IT206"], 50);
  }
  if (codeToIdx["CS 204B"] !== undefined && codeToIdx["IT219"] !== undefined) {
    addPath(codeToIdx["CS 204B"], codeToIdx["IT219"], 55);
  }

  // EEE <-> MECH
  if (codeToIdx["EE001"] !== undefined && codeToIdx["ME001"] !== undefined) {
    addPath(codeToIdx["EE001"], codeToIdx["ME001"], 70);
  }

  // MECH <-> CIVIL
  if (codeToIdx["ME001"] !== undefined && codeToIdx["CV001"] !== undefined) {
    addPath(codeToIdx["ME001"], codeToIdx["CV001"], 60);
  }

  // Main Block <-> CCF
  if (codeToIdx["CS 108"] !== undefined && codeToIdx["G 316"] !== undefined) {
    addPath(codeToIdx["CS 108"], codeToIdx["G 316"], 35);
  }

  // Main Block <-> TBI
  if (codeToIdx["CS 205"] !== undefined && codeToIdx["G 316"] !== undefined) {
    addPath(codeToIdx["CS 205"], codeToIdx["G 316"], 25);
  }

  // ECE <-> Main Block
  if (codeToIdx["EC002"] !== undefined && codeToIdx["CS 118"] !== undefined) {
    addPath(codeToIdx["EC002"], codeToIdx["CS 118"], 45);
  }

  // CCF <-> Library
  if (codeToIdx["G 316"] !== undefined && codeToIdx["LIB001"] !== undefined) {
    addPath(codeToIdx["G 316"], codeToIdx["LIB001"], 40);
  }

  // Physics <-> Math
  if (codeToIdx["PH001"] !== undefined && codeToIdx["MA001"] !== undefined) {
    addPath(codeToIdx["PH001"], codeToIdx["MA001"], 40);
  }

  // Physics <-> Chem
  if (codeToIdx["PH001"] !== undefined && codeToIdx["CH001"] !== undefined) {
    addPath(codeToIdx["PH001"], codeToIdx["CH001"], 35);
  }

  // CSE washroom connections
  if (codeToIdx["WC01"] !== undefined && codeToIdx["CS 118"] !== undefined) {
    addPath(codeToIdx["WC01"], codeToIdx["CS 118"], 25);
  }
  if (codeToIdx["WC02"] !== undefined && codeToIdx["CS 204B"] !== undefined) {
    addPath(codeToIdx["WC02"], codeToIdx["CS 204B"], 25);
  }

  // Gate washroom / medical
  if (codeToIdx["GATE01"] !== undefined && codeToIdx["WC01"] !== undefined) {
    addPath(codeToIdx["GATE01"], codeToIdx["WC01"], 130);
  }

  // Canteen connections to nearby
  if (codeToIdx["CAN001"] !== undefined && codeToIdx["CAN002"] !== undefined) {
    addPath(codeToIdx["CAN001"], codeToIdx["CAN002"], 8);
  }
  if (codeToIdx["CAN002"] !== undefined && codeToIdx["CAN003"] !== undefined) {
    addPath(codeToIdx["CAN002"], codeToIdx["CAN003"], 8);
  }

  // Library internal
  if (codeToIdx["LIB001"] !== undefined && codeToIdx["LIB002"] !== undefined) {
    addPath(codeToIdx["LIB001"], codeToIdx["LIB002"], 12);
  }
  if (codeToIdx["LIB002"] !== undefined && codeToIdx["LIB003"] !== undefined) {
    addPath(codeToIdx["LIB002"], codeToIdx["LIB003"], 12);
  }
  if (codeToIdx["LIB001"] !== undefined && codeToIdx["LIB004"] !== undefined) {
    addPath(codeToIdx["LIB001"], codeToIdx["LIB004"], 10);
  }
  if (codeToIdx["LIB001"] !== undefined && codeToIdx["LIB005"] !== undefined) {
    addPath(codeToIdx["LIB001"], codeToIdx["LIB005"], 15, { hasStairs: true, hasElevator: true });
  }
  if (codeToIdx["LIB005"] !== undefined && codeToIdx["LIB006"] !== undefined) {
    addPath(codeToIdx["LIB005"], codeToIdx["LIB006"], 12);
  }

  // Admin internal
  if (codeToIdx["ADM001"] !== undefined && codeToIdx["ADM002"] !== undefined) {
    addPath(codeToIdx["ADM001"], codeToIdx["ADM002"], 10);
  }
  if (codeToIdx["ADM002"] !== undefined && codeToIdx["ADM003"] !== undefined) {
    addPath(codeToIdx["ADM002"], codeToIdx["ADM003"], 10);
  }
  if (codeToIdx["ADM001"] !== undefined && codeToIdx["ADM004"] !== undefined) {
    addPath(codeToIdx["ADM001"], codeToIdx["ADM004"], 10);
  }
  if (codeToIdx["ADM004"] !== undefined && codeToIdx["ADM005"] !== undefined) {
    addPath(codeToIdx["ADM004"], codeToIdx["ADM005"], 10);
  }
  if (codeToIdx["ADM005"] !== undefined && codeToIdx["ADM006"] !== undefined) {
    addPath(codeToIdx["ADM005"], codeToIdx["ADM006"], 10);
  }
  if (codeToIdx["ADM001"] !== undefined && codeToIdx["MED01"] !== undefined) {
    addPath(codeToIdx["ADM001"], codeToIdx["MED01"], 15);
  }

  return pathsData;
}

async function main() {
  console.log("Seeding GEC Palakkad campus data...");

  // Clear existing data
  await prisma.navigationSession.deleteMany();
  await prisma.userReport.deleteMany();
  await prisma.savedPlace.deleteMany();
  await prisma.blockedPath.deleteMany();
  await prisma.path.deleteMany();
  await prisma.location.deleteMany();
  await prisma.building.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.campusSettings.deleteMany();

  // Create buildings
  console.log("Creating buildings...");
  const buildingRecords: Record<string, string> = {};
  for (const b of buildingsData) {
    const record = await prisma.building.create({
      data: {
        code: b.code,
        name: b.name,
        description: b.description,
        latitude: b.latitude,
        longitude: b.longitude,
        floors: b.floors,
      },
    });
    buildingRecords[b.code] = record.id;
  }

  // Seed all locations
  seedCSE("MAIN");
  seedEEE();
  seedIT();
  seedECE();
  seedMECH();
  seedCIVIL();
  seedCHEM();
  seedPHYSICS();
  seedMATH();
  seedFacilities();

  // Create locations in batches
  console.log(`Creating ${locationsData.length} locations...`);

  // Batch insert locations
  for (let i = 0; i < locationsData.length; i += 50) {
    const batch = locationsData.slice(i, i + 50);
    await prisma.location.createMany({
      data: batch.map((l) => ({
        buildingId: buildingRecords[l.buildingCode],
        floor: fMap[l.floor],
        code: l.code,
        name: l.name,
        shortName: l.shortName,
        category: categoryMap[l.category],
        description: l.description,
        mapX: l.mapX,
        mapY: l.mapY,
        latitude: l.latitude,
        longitude: l.longitude,
        isAccessible: l.isAccessible,
        hasStairs: l.hasStairs,
        hasElevator: l.hasElevator,
        isEntrance: l.isEntrance,
        isRestricted: l.isRestricted,
        status: l.status,
        metadata: l.metadata,
      })),
    });
  }

  // Build code→id map by querying all locations
  const allLocs = await prisma.location.findMany({ select: { id: true, code: true } });
  const locationRecords: Record<string, string> = {};
  for (const l of allLocs) {
    if (l.code) locationRecords[l.code] = l.id;
  }
  console.log(`  Mapped ${Object.keys(locationRecords).length} location codes to IDs`);

  // Create paths in batches
  const pathsData = seedPaths();
  console.log(`Creating ${pathsData.length} paths...`);

  // Resolve source/destination IDs and batch insert
  const pathBatch: any[] = [];
  for (const p of pathsData) {
    const srcId = locationRecords[p.sourceCode];
    const dstId = locationRecords[p.destinationCode];
    if (!srcId || !dstId) continue;
    pathBatch.push({
      sourceId: srcId,
      destinationId: dstId,
      distanceMeters: p.distanceMeters,
      walkingTimeSec: p.walkingTimeSec,
      direction: p.direction,
      floor: fMap[p.floor],
      isBidirectional: p.isBidirectional,
      isAccessible: p.isAccessible,
      hasStairs: p.hasStairs,
      hasElevator: p.hasElevator,
      status: p.status as PathStatus,
      metadata: p.metadata,
    });
  }

  // Insert in batches of 50
  for (let i = 0; i < pathBatch.length; i += 50) {
    const batch = pathBatch.slice(i, i + 50);
    await prisma.path.createMany({ data: batch });
  }
  console.log(`  Created ${pathBatch.length} paths in batches`);

  // Create users
  console.log("Creating users...");
  await prisma.user.create({
    data: {
      email: "admin@gec.ac.in",
      passwordHash: hashPassword("Admin@GEC2024!"),
      fullName: "GEC Admin",
      role: UserRole.ADMIN,
      navigationPrefs: JSON.stringify({
        avoidStairs: false,
        wheelchairAccessible: false,
        avoidRestricted: true,
        walkingSpeedKmh: 5,
      }),
    },
  });

  await prisma.user.create({
    data: {
      email: "user@gec.ac.in",
      passwordHash: hashPassword("User@GEC2024!"),
      fullName: "Sample User",
      role: UserRole.USER,
      navigationPrefs: JSON.stringify({
        avoidStairs: false,
        wheelchairAccessible: false,
        avoidRestricted: true,
        walkingSpeedKmh: 5,
      }),
    },
  });

  // Campus settings
  await prisma.campusSettings.create({
    data: {
      id: "singleton",
      defaultWalkingSpeedKmh: 5,
      mapCenterLat: 10.8510,
      mapCenterLng: 76.3520,
      mapZoom: 18,
    },
  });

  console.log("Seed completed successfully!");
  console.log(`  Buildings: ${buildingsData.length}`);
  console.log(`  Locations: ${locationsData.length}`);
  console.log(`  Paths: ${pathsData.length}`);
  console.log("  Users: 2 (admin@gec.ac.in, user@gec.ac.in)");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
