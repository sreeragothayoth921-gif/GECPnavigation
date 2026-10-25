"use client";

import { useState, useCallback, Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Navigation,
  Clock,
  Ruler,
  AlertTriangle,
  ChevronRight,
  Footprints,
  Accessibility,
  ArrowUp,
  Loader2,
  ArrowUpDown,
  MapPin,
  Play,
  Square,
  RotateCcw,
  ArrowUpCircle,
  FootprintsIcon,
  ArrowUpFromLine,
  Building,
  Layers,
  Home,
  Map,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";

const IndoorMap = dynamic(
  () => import("@/components/map/IndoorMap").then((m) => m.default),
  { ssr: false }
);

const IndoorLocationPicker = dynamic(
  () => import("@/components/map/IndoorLocationPicker").then((m) => m.default),
  { ssr: false }
);

interface Direction {
  step: number;
  instruction: string;
  distance: string;
  icon: string;
  floor: string;
  action: string;
}

interface RouteResult {
  distance: string;
  walkingTime: string;
  eta: string;
  directions: Direction[];
  routeCoords: Array<{ lat: number; lng: number }>;
  startLocation: string;
  endLocation: string;
  floors: string[];
  totalDistance: number;
  totalTime: number;
}

function IndoorNavigateContent() {
  const searchParams = useSearchParams();
  const initialStart = searchParams.get("start") || "";
  const initialEnd = searchParams.get("end") || "";
  const initialBuilding = searchParams.get("building") || "IT_BLOCK";
  const initialStartFloor = searchParams.get("startFloor") || "";
  const initialEndFloor = searchParams.get("endFloor") || "";

  const [startLocation, setStartLocation] = useState(initialStart);
  const [destination, setDestination] = useState(initialEnd);
  const [selectedBuilding, setSelectedBuilding] = useState(initialBuilding);
  const [startFloor, setStartFloor] = useState(initialStartFloor);
  const [endFloor, setEndFloor] = useState(initialEndFloor);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeFloor, setActiveFloor] = useState<'GROUND' | 'FIRST'>('GROUND');

  const handleFindRoute = useCallback(async () => {
    if (!startLocation.trim() || !destination.trim()) {
      setError("Please enter both start and destination locations.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRouteResult(null);

    try {
      const response = await fetch("/api/indoor/routing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: startLocation.trim(),
          end: destination.trim(),
          building: selectedBuilding,
          startFloor: startFloor || undefined,
          endFloor: endFloor || undefined,
          avoidStairs,
          wheelchair,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not calculate route.");
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      setRouteResult(data);
      setCurrentStep(0);
      setActiveFloor(data.floors[0] as 'GROUND' | 'FIRST' || 'GROUND');
    } catch {
      setError("Could not calculate route. Please check your locations and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [startLocation, destination, selectedBuilding, startFloor, endFloor, avoidStairs, wheelchair]);

  const handleStartNavigation = useCallback(() => {
    setIsNavigating(true);
    setCurrentStep(0);
  }, []);

  const handleStopNavigation = useCallback(() => {
    setIsNavigating(false);
    setCurrentStep(0);
  }, []);

  const handleNextStep = useCallback(() => {
    if (routeResult && currentStep < routeResult.directions.length - 1) {
      setCurrentStep(s => s + 1);
    }
  }, [routeResult, currentStep]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setRouteResult(null);
    setCurrentStep(0);
    setIsNavigating(false);
    setError(null);
  }, []);

  const handleEmergency = useCallback(() => {
    window.location.href = "tel:112";
  }, []);

  const swapLocations = useCallback(() => {
    setStartLocation(destination);
    setDestination(startLocation);
    const tempFloor = startFloor;
    setStartFloor(endFloor);
    setEndFloor(tempFloor);
  }, [startLocation, destination, startFloor, endFloor]);

  const getDirectionIcon = (icon: string, action: string) => {
    switch (action) {
      case 'take_stairs': return <ArrowUpFromLine className="w-4 h-4 text-amber-500" />;
      case 'take_elevator': return <ArrowUpCircle className="w-4 h-4 text-emerald-500" />;
      case 'enter_room': return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'exit_room': return <MapPin className="w-4 h-4 text-gray-500" />;
      case 'arrive': return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'start': return <MapPin className="w-4 h-4 text-green-500" />;
      default: return <FootprintsIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'take_stairs': return 'Stairs';
      case 'take_elevator': return 'Elevator';
      case 'enter_room': return 'Enter';
      case 'exit_room': return 'Exit';
      case 'arrive': return 'Arrive';
      case 'start': return 'Start';
      default: return 'Walk';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.location.href = '/navigate'} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="w-6 h-6 text-blue-500" />
              Indoor Navigation
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
              {selectedBuilding}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-4 space-y-4">
            {/* Route Input Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-900">Building</span>
              </div>
              <select
                value={selectedBuilding}
                onChange={e => setSelectedBuilding(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="IT_BLOCK">IT Block</option>
              </select>

              <div className="space-y-3">
                <IndoorLocationPicker
                  value={startLocation}
                  onChange={setStartLocation}
                  placeholder="Start room (e.g., IT206, IT211)"
                  icon="start"
                  mode="indoor"
                  buildingFilter={selectedBuilding}
                  floorFilter={startFloor}
                  onBuildingChange={setSelectedBuilding}
                  onFloorChange={setStartFloor}
                />

                <div className="flex justify-center">
                  <button
                    onClick={swapLocations}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>

                <IndoorLocationPicker
                  value={destination}
                  onChange={setDestination}
                  placeholder="Destination room (e.g., IT218, IT219)"
                  icon="end"
                  mode="indoor"
                  buildingFilter={selectedBuilding}
                  floorFilter={endFloor}
                  onBuildingChange={setSelectedBuilding}
                  onFloorChange={setEndFloor}
                />
              </div>

              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={avoidStairs}
                      onChange={(e) => setAvoidStairs(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${avoidStairs ? "bg-blue-500" : "bg-gray-200"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${avoidStairs ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    <ArrowUp className="w-3.5 h-3.5" />
                    Avoid Stairs
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={wheelchair}
                      onChange={(e) => setWheelchair(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${wheelchair ? "bg-blue-500" : "bg-gray-200"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${wheelchair ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Accessibility className="w-3.5 h-3.5" />
                    Wheelchair
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleFindRoute}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Find Route
                    </>
                  )}
                </button>
                {routeResult && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Floor Selector for Navigation */}
            {routeResult && routeResult.floors.length > 1 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  Floor Navigation
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {routeResult.floors.map((floor, i) => (
                    <button
                      key={floor}
                      onClick={() => setActiveFloor(floor as 'GROUND' | 'FIRST')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        activeFloor === floor
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {floor === 'GROUND' ? 'Ground' : `${floor}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Route Summary */}
            {routeResult && !isNavigating && (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-green-500" />
                    <span>{routeResult.startLocation}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{routeResult.endLocation}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <Ruler className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900">{routeResult.distance}</p>
                      <p className="text-xs text-gray-500">Distance</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <Footprints className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900">{routeResult.walkingTime}</p>
                      <p className="text-xs text-gray-500">Walk Time</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900">{routeResult.eta}</p>
                      <p className="text-xs text-gray-500">ETA</p>
                    </div>
                  </div>

                  {routeResult.floors.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Floors</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        {routeResult.floors.map((floor, i) => (
                          <span key={floor} className={`px-2 py-1 rounded-full text-xs ${
                            i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {floor} {i < routeResult.floors.length - 1 && <ChevronDown className="w-3 h-3 inline ml-1" />}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={handleStartNavigation}
                    className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                  >
                    <Play className="w-4 h-4" />
                    Start Navigation
                  </button>
                </div>
              </div>
            )}

            {/* Active Navigation Controls */}
            {isNavigating && routeResult && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-blue-700 text-sm">Step {currentStep + 1} of {routeResult.directions.length}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{routeResult.directions[currentStep]?.instruction}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{routeResult.directions[currentStep]?.distance}</p>
                  </div>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-1.5 mb-3">
                  <div
                    className="bg-blue-500 rounded-full h-1.5 transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / routeResult.directions.length) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handlePrevStep}
                    disabled={currentStep === 0}
                    className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleStopNavigation}
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow-lg shadow-red-500/25"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={currentStep >= routeResult.directions.length - 1}
                    className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleEmergency}
            className="w-full py-3 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-semibold transition-all flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Emergency — Call 112
          </button>
        </div>

        {/* Right Panel - Map */}
        <div className="lg:col-span-8 space-y-4">
          {/* Map Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {routeResult ? 'Route Map' : 'Indoor Map'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Current Floor:</span>
              <select
                value={activeFloor}
                onChange={e => setActiveFloor(e.target.value as 'GROUND' | 'FIRST')}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="GROUND">Ground Floor</option>
                <option value="FIRST">First Floor</option>
              </select>
            </div>
          </div>

          {/* Indoor Map */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <IndoorMap
              floorPlan={activeFloor === 'GROUND' ? (typeof window !== 'undefined' ? require('@/data/indoor/it-block-ground.json').default : null) : (typeof window !== 'undefined' ? require('@/data/indoor/it-block-first.json').default : null)}
              selectedRoomId={isNavigating ? null : (routeResult ? destination : null)}
              onRoomSelect={setDestination}
              route={routeResult}
              startRoomId={routeResult ? startLocation : null}
              endRoomId={routeResult ? destination : null}
              showRoute={!!routeResult}
              className="h-[600px]"
            />
          </div>

          {/* Turn-by-turn Directions */}
          {routeResult && routeResult.directions.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-500" />
                  Turn-by-Turn Directions
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {routeResult.directions.map((dir, i) => (
                  <div
                    key={dir.step}
                    className={`flex items-start gap-3 p-4 transition-colors ${
                      isNavigating && i === currentStep ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        isNavigating && i === currentStep
                          ? 'bg-blue-500 border-2 border-blue-300 text-white'
                          : i < currentStep
                            ? 'bg-green-100 border-2 border-green-200'
                            : 'bg-gray-50 border-2 border-gray-200'
                      }`}>
                        {i < currentStep ? (
                          <span className="text-green-500 text-xs">✓</span>
                        ) : getDirectionIcon(dir.icon, dir.action)}
                      </div>
                      {i < routeResult.directions.length - 1 && (
                        <div className={`w-0.5 h-8 ${i < currentStep ? 'bg-green-200' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          dir.action === 'take_stairs' ? 'bg-amber-100 text-amber-700' :
                          dir.action === 'take_elevator' ? 'bg-emerald-100 text-emerald-700' :
                          dir.action === 'enter_room' ? 'bg-blue-100 text-blue-700' :
                          dir.action === 'exit_room' ? 'bg-gray-100 text-gray-700' :
                          dir.action === 'arrive' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {getActionLabel(dir.action)}
                        </span>
                        {dir.floor && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">
                            {dir.floor}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-medium ${isNavigating && i === currentStep ? 'text-blue-700' : 'text-gray-800'}`}>
                        {dir.instruction}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{dir.distance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IndoorNavigatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <IndoorNavigateContent />
    </Suspense>
  );
}