"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Building2,
  Layers,
  Tag,
  Navigation,
  FlaskConical,
  GraduationCap,
  Utensils,
  Briefcase,
  Library,
  Monitor,
} from "lucide-react";
import campusLocations from "@/data/campus-locations.json";

const categoryConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  all: { label: "All", icon: MapPin, color: "from-gray-500 to-gray-600" },
  lab: {
    label: "Labs",
    icon: FlaskConical,
    color: "from-purple-500 to-pink-500",
  },
  lecture_hall: {
    label: "Lecture Halls",
    icon: GraduationCap,
    color: "from-blue-500 to-cyan-500",
  },
  office: {
    label: "Offices",
    icon: Briefcase,
    color: "from-amber-500 to-orange-500",
  },
  library: {
    label: "Library",
    icon: Library,
    color: "from-emerald-500 to-teal-500",
  },
  canteen: {
    label: "Canteen",
    icon: Utensils,
    color: "from-red-500 to-rose-500",
  },
  computer_lab: {
    label: "Computer Labs",
    icon: Monitor,
    color: "from-indigo-500 to-violet-500",
  },
  other: {
    label: "Other",
    icon: Tag,
    color: "from-gray-500 to-slate-500",
  },
};

const categories = Object.keys(categoryConfig);

interface Location {
  buildingCode: string;
  floor: string;
  code: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  isAccessible: boolean;
}

export default function LocationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredLocations = useMemo(() => {
    const locations = campusLocations as Location[];
    return locations.filter((loc) => {
      const matchesSearch =
        searchQuery === "" ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.buildingCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "all" || loc.category.toLowerCase() === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MapPin className="w-7 h-7 text-blue-500" />
            Locations
          </h1>
          <p className="text-gray-500 mt-1">
            Browse all {campusLocations.length} campus locations
          </p>
        </header>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, code, or building..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => {
            const config = categoryConfig[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                    : "border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <config.icon className="w-4 h-4" />
                {config.label}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-gray-400">
          Showing {filteredLocations.length} location
          {filteredLocations.length !== 1 ? "s" : ""}
        </p>

        {filteredLocations.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No locations found</p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map((location) => {
              const catKey = location.category.toLowerCase();
              const config =
                categoryConfig[catKey] || categoryConfig.other;
              return (
                <Link
                  key={location.code}
                  href={`/navigate?end=${location.code}`}
                >
                  <div className="group rounded-2xl border border-gray-200 bg-white p-5 hover:border-blue-200 hover:shadow-md transition-all duration-300 cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${config.color} shadow-lg`}
                      >
                        <config.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {location.code}
                      </span>
                    </div>
                    <h3 className="text-gray-900 font-semibold group-hover:text-blue-600 truncate transition-colors">
                      {location.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{location.buildingCode}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Floor {location.floor}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate here</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
