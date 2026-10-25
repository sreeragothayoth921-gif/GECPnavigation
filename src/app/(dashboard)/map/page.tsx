"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  ZoomIn,
  ZoomOut,
  Layers,
  X,
  Search,
  MapPin,
  Navigation,
  Building2,
  Bookmark,
  Locate,
} from "lucide-react";
import campusLocations from "@/data/campus-locations.json";
import campusBuildings from "@/data/campus-buildings.json";

const CampusMap = dynamic(
  () => import("@/components/map/CampusMap").then((mod) => mod.default),
  { ssr: false }
);

export default function MapPage() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const selectedLocation = selectedCode
    ? campusLocations.find((l: any) => l.code === selectedCode) || null
    : null;

  const handleLocationSelect = useCallback((id: string) => {
    setSelectedCode(id);
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Search filtering
  const allItems = [
    ...campusLocations.map((l: any) => ({
      type: "location" as const,
      code: l.code,
      name: l.name,
      building: l.buildingCode,
      category: l.category,
    })),
    ...campusBuildings.map((b: any) => ({
      type: "building" as const,
      code: b.code,
      name: b.name,
      building: "",
      category: "building",
    })),
  ];

  const searchResults = searchQuery.trim().length > 0
    ? allItems.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.building.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] lg:h-screen bg-gray-100 overflow-hidden -m-4 lg:-m-6">
      {/* Search bar - Google Maps style */}
      <div className="absolute top-4 left-4 right-4 z-20 max-w-lg" ref={searchRef}>
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center px-4 py-3">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search campus locations..."
                className="flex-1 ml-3 text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setSearchFocused(false); }}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Search results dropdown */}
          {searchFocused && searchResults.length > 0 && (
            <div className="mt-1 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-h-80 overflow-y-auto">
              {searchResults.map((item, i) => (
                <div
                  key={`${item.type}-${item.code}-${i}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                  onClick={() => {
                    setSelectedCode(item.code);
                    setSearchQuery(item.name);
                    setSearchFocused(false);
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.type === "building"
                      ? "bg-blue-100"
                      : "bg-indigo-100"
                  }`}>
                    {item.type === "building" ? (
                      <Building2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <MapPin className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.code} {item.building ? `· ${item.building}` : ""}</div>
                  </div>
                  <span className="text-[10px] text-gray-300 uppercase">{item.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location info card */}
      {selectedLocation && (
        <div className="absolute top-20 left-4 right-4 z-20 max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 font-semibold truncate">
                  {selectedLocation.name}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedLocation.code} — {selectedLocation.buildingCode}, Floor{" "}
                  {selectedLocation.floor}
                </p>
                <p className="text-xs text-gray-400 mt-1 capitalize">
                  {selectedLocation.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedCode(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() =>
                  (window.location.href = `/navigate?start=current&end=${selectedLocation.code}`)
                }
                className="flex-1 px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                Navigate Here
              </button>
              <button className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm transition-colors flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map controls - right side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          disabled={geoLoading}
          className="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-md disabled:opacity-50"
          title="My Location"
        >
          <Locate className={`w-5 h-5 ${geoLoading ? "animate-spin" : ""}`} />
        </button>
        <div className="h-px bg-gray-200 my-0.5" />
        <button className="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-md">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button className="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-md">
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Map */}
      <CampusMap
        selectedLocationId={selectedCode}
        onLocationSelect={handleLocationSelect}
        userLocation={userLocation}
      />

      {/* Bottom legend */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-white rounded-xl border border-gray-200 shadow-md px-3 py-2 text-xs text-gray-500 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Building
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Lab
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Facility
          </span>
        </div>
      </div>
    </div>
  );
}
