"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bookmark,
  Navigation,
  Trash2,
  Building2,
  Layers,
  FolderOpen,
} from "lucide-react";

interface SavedPlace {
  id: string;
  name: string;
  code: string;
  building: string;
  floor: number;
  category: string;
  savedAt: number;
}

const STORAGE_KEY = "campusnav-saved-places";

function getSavedPlaces(): SavedPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePlaces(places: SavedPlace[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

export default function SavedPage() {
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSavedPlaces(getSavedPlaces());
    setIsLoaded(true);
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      const updated = savedPlaces.filter((p) => p.id !== id);
      setSavedPlaces(updated);
      savePlaces(updated);
    },
    [savedPlaces]
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded-xl" />
            <div className="h-4 w-32 bg-gray-100 rounded-lg" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bookmark className="w-7 h-7 text-amber-500" />
            Saved Places
          </h1>
          <p className="text-gray-500 mt-1">
            {savedPlaces.length} saved location
            {savedPlaces.length !== 1 ? "s" : ""}
          </p>
        </header>

        {savedPlaces.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No saved places
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Save locations from the map or locations page for quick access.
            </p>
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium transition-all duration-300 shadow-lg"
            >
              <Bookmark className="w-4 h-4" />
              Browse Locations
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savedPlaces.map((place) => (
              <div
                key={place.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-blue-200 hover:shadow-md transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-gray-900 font-semibold truncate">
                        {place.name}
                      </h3>
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600">
                        {place.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {place.building}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        Floor {place.floor}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/navigate?end=${place.id}`}
                      className="p-2.5 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleRemove(place.id)}
                      className="p-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
