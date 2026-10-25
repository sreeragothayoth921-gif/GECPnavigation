export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface LocationData {
  id: string;
  name: string;
  code?: string | null;
  category: string;
  floor: string;
  latitude?: number | null;
  longitude?: number | null;
  mapX: number;
  mapY: number;
  description?: string | null;
  isAccessible: boolean;
  isRestricted: boolean;
  building?: {
    id: string;
    name: string;
    code: string;
  };
}

interface PathData {
  id: string;
  distanceMeters: number;
  walkingTimeSec: number;
  status: string;
  isAccessible: boolean;
  hasStairs: boolean;
  source: {
    id: string;
    name: string;
    latitude?: number | null;
    longitude?: number | null;
    mapX: number;
    mapY: number;
  };
  destination: {
    id: string;
    name: string;
    latitude?: number | null;
    longitude?: number | null;
    mapX: number;
    mapY: number;
  };
}

interface BuildingData {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mapX?: number | null;
  mapY?: number | null;
  polygonGeoJson?: unknown;
  floors?: string[];
  imageUrl?: string | null;
}

export function locationsToGeoJSON(locations: LocationData[]): GeoJSONFeatureCollection {
  return {
    type: "FeatureCollection",
    features: locations.map((loc) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [loc.longitude ?? 0, loc.latitude ?? 0],
      },
      properties: {
        id: loc.id,
        name: loc.name,
        code: loc.code,
        category: loc.category,
        floor: loc.floor,
        description: loc.description,
        buildingName: loc.building?.name ?? null,
        buildingCode: loc.building?.code ?? null,
        isAccessible: loc.isAccessible,
        isRestricted: loc.isRestricted,
        mapX: loc.mapX,
        mapY: loc.mapY,
      },
    })),
  };
}

export function pathsToGeoJSON(
  paths: PathData[],
  _locations?: LocationData[]
): GeoJSONFeatureCollection {
  return {
    type: "FeatureCollection",
    features: paths
      .filter(
        (p) =>
          p.source.latitude != null &&
          p.source.longitude != null &&
          p.destination.latitude != null &&
          p.destination.longitude != null
      )
      .map((path) => ({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [path.source.longitude!, path.source.latitude!],
            [path.destination.longitude!, path.destination.latitude!],
          ],
        },
        properties: {
          id: path.id,
          sourceId: path.source.id,
          destinationId: path.destination.id,
          sourceName: path.source.name,
          destinationName: path.destination.name,
          distanceMeters: Math.round(path.distanceMeters),
          walkingTimeSec: path.walkingTimeSec,
          status: path.status,
          isAccessible: path.isAccessible,
          hasStairs: path.hasStairs,
          isActive: false,
        },
      })),
  };
}

export function buildingsToGeoJSON(buildings: BuildingData[]): GeoJSONFeatureCollection {
  return {
    type: "FeatureCollection",
    features: buildings.map((building) => {
      let geometry: GeoJSONFeature["geometry"];

      if (building.polygonGeoJson) {
        try {
          const parsed =
            typeof building.polygonGeoJson === "string"
              ? JSON.parse(building.polygonGeoJson as string)
              : building.polygonGeoJson;

          if (parsed && typeof parsed === "object" && "type" in parsed && "coordinates" in parsed) {
            geometry = {
              type: parsed.type as string,
              coordinates: parsed.coordinates as number[][] | number[][][],
            };
          } else {
            geometry = createBuildingRectangle(
              building.latitude ?? 0,
              building.longitude ?? 0,
              building.mapX ?? 0,
              building.mapY ?? 0
            );
          }
        } catch {
          geometry = createBuildingRectangle(
            building.latitude ?? 0,
            building.longitude ?? 0,
            building.mapX ?? 0,
            building.mapY ?? 0
          );
        }
      } else {
        geometry = createBuildingRectangle(
          building.latitude ?? 0,
          building.longitude ?? 0,
          building.mapX ?? 0,
          building.mapY ?? 0
        );
      }

      return {
        type: "Feature",
        geometry,
        properties: {
          id: building.id,
          code: building.code,
          name: building.name,
          description: building.description,
          latitude: building.latitude,
          longitude: building.longitude,
          mapX: building.mapX,
          mapY: building.mapY,
          floors: building.floors,
          imageUrl: building.imageUrl,
          fillColor: getBuildingColor(building.code),
          isSelected: false,
          isHovered: false,
        },
      };
    }),
  };
}

function createBuildingRectangle(
  lat: number,
  lng: number,
  _mapX: number,
  _mapY: number
): GeoJSONFeature["geometry"] {
  const latOffset = 0.00015;
  const lngOffset = 0.0002;

  return {
    type: "Polygon",
    coordinates: [
      [
        [lng - lngOffset, lat - latOffset],
        [lng + lngOffset, lat - latOffset],
        [lng + lngOffset, lat + latOffset],
        [lng - lngOffset, lat + latOffset],
        [lng - lngOffset, lat - latOffset],
      ],
    ],
  };
}

function getBuildingColor(code: string): string {
  const colorMap: Record<string, string> = {
    MAIN: "#1e3a5f",
    EEE: "#3b1f5e",
    IT_BLOCK: "#1e3a5f",
    MECH: "#4a1d1d",
    CIVIL: "#1d3a1d",
    CHEM: "#3a1d3a",
    PHYSICS: "#1d2a3a",
    MATH: "#2a1d3a",
    ADMIN: "#3a2a1d",
    LIBRARY: "#064e3b",
    CCF: "#1e2a3a",
    TBI: "#2a3a1d",
    CANTEEN: "#7f1d1d",
    GATE: "#374151",
  };
  return colorMap[code] || "#1e3a5f";
}

export function getBuildingCenter(
  building: BuildingData
): { lat: number; lng: number } {
  if (building.latitude != null && building.longitude != null) {
    return { lat: building.latitude, lng: building.longitude };
  }

  if (building.polygonGeoJson) {
    try {
      const parsed =
        typeof building.polygonGeoJson === "string"
          ? JSON.parse(building.polygonGeoJson as string)
          : building.polygonGeoJson;

      if (parsed?.coordinates) {
        const coords = Array.isArray(parsed.coordinates[0]?.[0])
          ? parsed.coordinates[0]
          : parsed.coordinates;

        if (Array.isArray(coords) && coords.length > 0) {
          const lngs = coords.map((c: number[]) => c[0]);
          const lats = coords.map((c: number[]) => c[1]);
          return {
            lat: (Math.min(...lats) + Math.max(...lats)) / 2,
            lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
          };
        }
      }
    } catch {
      // fallback below
    }
  }

  return { lat: 0, lng: 0 };
}

export function calculateBoundingBox(
  locations: Array<{ latitude?: number | null; longitude?: number | null }>
): [number, number, number, number] {
  const validLocs = locations.filter((l) => l.latitude != null && l.longitude != null);

  if (validLocs.length === 0) {
    return [76.349, 10.849, 76.355, 10.853];
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const loc of validLocs) {
    const lng = loc.longitude!;
    const lat = loc.latitude!;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  const lngPad = (maxLng - minLng) * 0.1 || 0.001;
  const latPad = (maxLat - minLat) * 0.1 || 0.001;

  return [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad];
}
