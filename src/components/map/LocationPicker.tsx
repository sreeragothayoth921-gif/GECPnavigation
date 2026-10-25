'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Search, X, Locate } from 'lucide-react';
import campusLocations from '@/data/campus-locations.json';

interface LocationItem {
  name: string;
  code: string;
  buildingCode: string;
  floor: string;
  category: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: 'start' | 'end';
  onUseMyLocation?: () => void;
  showGeolocate?: boolean;
}

export default function LocationPicker({
  value,
  onChange,
  placeholder = 'Search location...',
  icon = 'start',
  onUseMyLocation,
  showGeolocate = false,
}: LocationPickerProps) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const locations = campusLocations as LocationItem[];

  const filtered = query.trim().length > 0
    ? locations.filter((loc) => {
        const q = query.toLowerCase();
        return (
          loc.name.toLowerCase().includes(q) ||
          loc.code.toLowerCase().includes(q) ||
          loc.buildingCode.toLowerCase().includes(q) ||
          loc.category.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : locations.slice(0, 6);

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

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
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
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
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
          {showGeolocate && onUseMyLocation && (
            <button
              onClick={onUseMyLocation}
              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors"
              title="Use my location"
            >
              <Locate className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {focused && filtered.length > 0 && (
        <div className="autocomplete-dropdown">
          {filtered.map((loc) => (
            <div
              key={loc.code}
              className="autocomplete-item"
              onClick={() => handleSelect(loc)}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${icon === 'start' ? 'bg-green-400' : 'bg-red-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{loc.name}</div>
                <div className="text-xs text-gray-400">{loc.code} · {loc.buildingCode} · Floor {loc.floor}</div>
              </div>
              <span className="text-[10px] text-gray-300 uppercase flex-shrink-0">{loc.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
