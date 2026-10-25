'use client';

import { useState } from 'react';
import { Search, MapPin, Compass, ArrowLeftRight, Navigation2, Locate, Shield, ChevronDown } from 'lucide-react';
import { formatDistance, formatWalkingTime, formatETA } from '@/lib/utils/formatters';

interface NavigationPanelProps {
  startLocation?: string;
  endLocation?: string;
  onStartChange?: (id: string) => void;
  onEndChange?: (id: string) => void;
  onCalculateRoute?: () => void;
  onStartNavigation?: () => void;
  route?: {
    totalDistance: number;
    totalTime: number;
    eta: string;
    directions: Array<{ step: number; action: string; description: string; distance: number }>;
  } | null;
  loading?: boolean;
}

export default function NavigationPanel({
  startLocation,
  endLocation,
  onStartChange,
  onEndChange,
  onCalculateRoute,
  onStartNavigation,
  route,
  loading,
}: NavigationPanelProps) {
  const [showDirections, setShowDirections] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Location Inputs */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <div className="w-0.5 h-8 bg-gray-700" />
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                value={startLocation || ''}
                onChange={(e) => onStartChange?.(e.target.value)}
                placeholder="Your location (or Use My Location)"
                className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="relative">
              <Navigation2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
              <input
                value={endLocation || ''}
                onChange={(e) => onEndChange?.(e.target.value)}
                placeholder="Where are you going?"
                className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </div>

        <button
          onClick={onCalculateRoute}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Find Route'}
        </button>
      </div>

      {/* Route Summary */}
      {route && (
        <div className="glass rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{formatDistance(route.totalDistance)}</div>
              <div className="text-xs text-gray-400">Distance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400">{formatWalkingTime(route.totalTime)}</div>
              <div className="text-xs text-gray-400">Walking Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{formatETA(new Date(route.eta))}</div>
              <div className="text-xs text-gray-400">ETA</div>
            </div>
          </div>

          <button
            onClick={onStartNavigation}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Navigation2 className="w-5 h-5" />
            Start Navigation
          </button>
        </div>
      )}

      {/* Turn by Turn Directions */}
      {route && route.directions.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <button
            onClick={() => setShowDirections(!showDirections)}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="font-semibold text-sm">Directions</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showDirections ? 'rotate-180' : ''}`} />
          </button>

          {showDirections && (
            <div className="space-y-3">
              {route.directions.map((dir, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    dir.action === 'arrive' ? 'bg-green-500/20 text-green-400' :
                    dir.action === 'start' ? 'bg-cyan-500/20 text-cyan-400' :
                    dir.action === 'take_stairs' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {dir.action === 'arrive' ? '📍' : dir.action === 'start' ? '🚀' : dir.action === 'take_stairs' ? '🪜' : i}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{dir.description}</p>
                    {dir.distance > 0 && (
                      <p className="text-xs text-gray-500">{dir.distance}m</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}