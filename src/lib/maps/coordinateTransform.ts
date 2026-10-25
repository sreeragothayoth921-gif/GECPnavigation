interface AffineMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

const ANCHOR_POINTS = [
  { gps: { lat: 10.8498, lng: 76.3495 }, campus: { x: 0, y: 0 }, label: "Main Gate" },
  { gps: { lat: 10.8505, lng: 76.3498 }, campus: { x: 400, y: 200 }, label: "Main Building Center" },
  { gps: { lat: 10.8510, lng: 76.3505 }, campus: { x: 600, y: 400 }, label: "EEE Block" },
] as const;

let forwardMatrix: AffineMatrix | null = null;
let inverseMatrix: AffineMatrix | null = null;

function computeForwardAffine(): AffineMatrix {
  if (forwardMatrix) return forwardMatrix;

  const p1 = ANCHOR_POINTS[0];
  const p2 = ANCHOR_POINTS[1];

  const dx = p2.campus.x - p1.campus.x;
  const dy = p2.campus.y - p1.campus.y;
  const dLng = p2.gps.lng - p1.gps.lng;
  const dLat = p2.gps.lat - p1.gps.lat;

  const cosAngle = Math.cos((10.85 * Math.PI) / 180);
  const lngScale = cosAngle;

  const a = dx / (dLng * lngScale);
  const b = dx / dLat;
  const c = dy / (dLng * lngScale);
  const d = dy / dLat;
  const e = p1.campus.x - a * p1.gps.lng * lngScale - b * p1.gps.lat;
  const f = p1.campus.y - c * p1.gps.lng * lngScale - d * p1.gps.lat;

  forwardMatrix = { a, b, c, d, e, f };
  return forwardMatrix;
}

function computeInverseAffine(): AffineMatrix {
  if (inverseMatrix) return inverseMatrix;

  const fwd = computeForwardAffine();
  const det = fwd.a * fwd.d - fwd.b * fwd.c;

  if (Math.abs(det) < 1e-10) {
    inverseMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    return inverseMatrix;
  }

  const invA = fwd.d / det;
  const invB = -fwd.b / det;
  const invC = -fwd.c / det;
  const invD = fwd.a / det;
  const invE = (fwd.b * fwd.f - fwd.d * fwd.e) / det;
  const invF = (fwd.c * fwd.e - fwd.a * fwd.f) / det;

  inverseMatrix = { a: invA, b: invB, c: invC, d: invD, e: invE, f: invF };
  return inverseMatrix;
}

export function transformGPSToCampus(lat: number, lng: number): { x: number; y: number } {
  const fwd = computeForwardAffine();
  const cosAngle = Math.cos((10.85 * Math.PI) / 180);
  const x = fwd.a * lng * cosAngle + fwd.b * lat + fwd.e;
  const y = fwd.c * lng * cosAngle + fwd.d * lat + fwd.f;
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

export function transformCampusToGPS(x: number, y: number): { lat: number; lng: number } {
  const inv = computeInverseAffine();
  const cosAngle = Math.cos((10.85 * Math.PI) / 180);
  const lngRaw = (inv.a * x + inv.b * y + inv.e) / cosAngle;
  const lat = inv.c * x + inv.d * y + inv.f;
  const lng = lngRaw / cosAngle;
  return { lat: Math.round(lat * 1000000) / 1000000, lng: Math.round(lng * 1000000) / 1000000 };
}

export function findNearestCampusNode(
  lat: number,
  lng: number,
  nodes: Array<{ id: string; lat: number; lng: number; name?: string }>
): { id: string; lat: number; lng: number; name?: string; distanceMeters: number } | null {
  if (nodes.length === 0) return null;

  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  let nearest = nodes[0];
  let minDist = haversineDistance(lat, lng, nodes[0].lat, nodes[0].lng);

  for (let i = 1; i < nodes.length; i++) {
    const dist = haversineDistance(lat, lng, nodes[i].lat, nodes[i].lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = nodes[i];
    }
  }

  return { ...nearest, distanceMeters: Math.round(minDist) };
}

export function getAnchorPoints() {
  return ANCHOR_POINTS.map((p) => ({
    gps: p.gps,
    campus: p.campus,
    label: p.label,
  }));
}

export function resetTransformCache(): void {
  forwardMatrix = null;
  inverseMatrix = null;
}
