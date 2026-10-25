'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MapPin, Navigation, Search, X, Building, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import campusLocations from '@/data/campus-locations.json';
import campusBuildings from '@/data/campus-buildings.json';
import itBlockGround from '@/data/indoor/it-block-ground.json';
import itBlockFirst from '@/data/indoor/it-block-first.json';

interface LocationItem {
  id: string;
  name: string;
  code: string;
  buildingCode: string;
  floor: string;
  category: string;
  latitude?: number;
  longitude?: number;
  isIndoor: boolean;
}

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: 'start' | 'end';
  showGeolocate?: boolean;
  onUseMyLocation?: () => void;
  mode?: 'outdoor' | 'indoor' | 'both';
  buildingFilter?: string;
  floorFilter?: string;
  onBuildingChange?: (building: string) => void;
  onFloorChange?: (floor: string) => void;
}

const indoorRooms = [
  ...(itBlockGround as any).rooms.map((r: any) => ({ ...r, buildingCode: 'IT_BLOCK', floor: 'GROUND', isIndoor: true })),
  ...(itBlockFirst as any).rooms.map((r: any) => ({ ...r, buildingCode: 'IT_BLOCK', floor: 'FIRST', isIndoor: true })),
];

const outdoorLocations = campusLocations as any[];

const allLocations = [
  ...outdoorLocations.map(l => ({ ...l, isIndoor: false })),
  ...indoorRooms,
];

const buildings = campusBuildings as any[];

export default function LocationPicker({
  value,
  onChange,
  placeholder = 'Search location...',
  icon = 'start',
  showGeolocate = false,
  onUseMyLocation,
  mode = 'both',
  buildingFilter,
  floorFilter,
  onBuildingChange,
  onFloorChange,
}: LocationPickerProps) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value);
  const [selectedBuilding, setSelectedBuilding] = useState(buildingFilter || 'all');
  const [selectedFloor, setSelectedFloor] = useState(floorFilter || 'all');
  const [showBuildingDropdown, setShowBuildingDropdown] = useState(false);
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
        setShowBuildingDropdown(false);
        setShowFloorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    let locations = allLocations;

    if (mode === 'indoor') {
      locations = locations.filter(l => l.isIndoor);
    } else if (mode === 'outdoor') {
      locations = locations.filter(l => !l.isIndoor);
    }

    if (selectedBuilding !== 'all') {
      locations = locations.filter(l => l.buildingCode === selectedBuilding);
    }

    if (selectedFloor !== 'all') {
      locations = locations.filter(l => l.floor === selectedFloor);
    }

    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      locations = locations.filter(loc =>
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.buildingCode.toLowerCase().includes(q) ||
        loc.category.toLowerCase().includes(q)
      );
    }

    return locations.slice(0, 10);
  }, [query, mode, selectedBuilding, selectedFloor]);

  const handleSelect = useCallback((loc: LocationItem) => {
    onChange(loc.name);
    setQuery(loc.name);
    setFocused(false);
    inputRef.current?.blur();
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  }, [onChange]);

  const iconColor = icon === 'start' ? 'text-green-500' : 'text-red-500';
  const Icon = icon === 'start' ? MapPin : Navigation;

  const availableBuildings = mode === 'indoor'
    ? buildings.filter(b => b.code === 'IT_BLOCK')
    : buildings;

  const availableFloors = ['GROUND', 'FIRST', 'SECOND', 'THIRD'];

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length === 0) {
                onChange('');
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => { setFocused(false); setShowBuildingDropdown(false); setShowFloorDropdown(false); }, 200)}
            placeholder={placeholder}
            className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                onClick={handleClear}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {showGeolocate && onUseMyLocation && mode !== 'indoor' && (
              <button
                onClick={onUseMyLocation}
                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors"
                title="Use my location"
              >
                <MapPin className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Building Filter */}
        {mode !== 'outdoor' && (
          <div className="relative">
            <button
              onClick={() => { setShowBuildingDropdown(!showBuildingDropdown); setShowFloorDropdown(false); }}
              className="px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 min-w-[120px]"
            >
              <Building className="w-4 h-4" />
              <span>{selectedBuilding === 'all' ? 'All Buildings' : selectedBuilding}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showBuildingDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[180px] z-20 py-1">
                <button
                  onClick={() => { setSelectedBuilding('all'); if (onBuildingChange) onBuildingChange('all'); setShowBuildingDropdown(false); }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedBuilding === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  All Buildings
                </button>
                {availableBuildings.map(b => (
                  <button
                    key={b.code}
                    onClick={() => { setSelectedBuilding(b.code); if (onBuildingChange) onBuildingChange(b.code); setShowBuildingDropdown(false); }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedBuilding === b.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {b.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Floor Filter */}
        {mode === 'indoor' && (
          <div className="relative">
            <button
              onClick={() => { setShowFloorDropdown(!showFloorDropdown); setShowBuildingDropdown(false); }}
              className="px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 min-w-[100px]"
            >
              <Layers className="w-4 h-4" />
              <span>{selectedFloor === 'all' ? 'All Floors' : selectedFloor}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showFloorDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[120px] z-20 py-1">
                <button
                  onClick={() => { setSelectedFloor('all'); if (onFloorChange) onFloorChange('all'); setShowFloorDropdown(false); }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedFloor === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  All Floors
                </button>
                {availableFloors.map(f => (
                  <button
                    key={f}
                    onClick={() => { setSelectedFloor(f); if (onFloorChange) onFloorChange(f); setShowFloorDropdown(false); }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${selectedFloor === f ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {f === 'GROUND' ? 'Ground' : `${f} Floor`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {focused && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto z-50">
          {filtered.map(loc => (
            <button
              key={`${loc.buildingCode}-${loc.floor}-${loc.code}`}
              onClick={() => handleSelect(loc)}
              className="w-full px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${loc.isIndoor ? 'bg-blue-50' : 'bg-green-50'}`}>
                <MapPin className={`w-4 h-4 ${loc.isIndoor ? 'text-blue-600' : 'text-green-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{loc.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{loc.isIndoor ? 'Indoor' : 'Outdoor'}</span>
                </div>
                <p className="text-xs text-gray-400">{loc.code} · {loc.buildingCode} · {loc.floor}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}