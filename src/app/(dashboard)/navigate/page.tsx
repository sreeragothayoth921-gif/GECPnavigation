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
} from "lucide-react";

const LocationPicker = dynamic(
  () => import("@/components/map/LocationPicker").then((m) => m.default),
  { ssr: false }
);

const MiniMap = dynamic(
  () => import("./MiniMap").then((m) => m.default),
  { ssr: false }
);

interface Direction {
  step: number;
  instruction: string;
  distance: string;
  icon: string;
}

interface RouteResult {
  distance: string;
  walkingTime: string;
  eta: string;
  directions: Direction[];
  routeCoords: Array<{ lat: number; lng: number }>;
  startLocation: string;
  endLocation: string;
}

function NavigateContent() {
  const searchParams = useSearchParams();
  const initialStart = searchParams.get("start") || "";
  const initialEnd = searchParams.get("end") || "";

  const [startLocation, setStartLocation] = useState(initialStart);
  const [destination, setDestination] = useState(initialEnd);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [geoLoading, setGeoLoading] = useState(false);

  const handleFindRoute = useCallback(async () => {
    if (!startLocation.trim() || !destination.trim()) {
      setError("Please enter both start and destination locations.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRouteResult(null);

    try {
      const response = await fetch("/api/routing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: startLocation.trim(),
          end: destination.trim(),
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
    } catch {
      setError("Could not calculate route. Please check your locations and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [startLocation, destination, avoidStairs, wheelchair]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setStartLocation("My Current Location");
        setGeoLoading(false);
        setError(null);
      },
      () => {
        setError("Could not get your location. Please enter it manually.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

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
  }, [startLocation, destination]);

  const getDirectionIcon = (icon: string) => {
    switch (icon) {
      case 'start': return <MapPin className="w-4 h-4 text-green-500" />;
      case 'arrive': return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'stairs': return <ArrowUpFromLine className="w-4 h-4 text-amber-500" />;
      case 'elevator': return <ArrowUpCircle className="w-4 h-4 text-emerald-500" />;
      default: return <FootprintsIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Navigation className="w-7 h-7 text-blue-500" />
            Navigate
          </h1>
          <p className="text-gray-500 mt-1">
            Find your way across campus
          </p>
        </header>

        {/* Route Input Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div className="space-y-3">
            <LocationPicker
              value={startLocation}
              onChange={setStartLocation}
              placeholder="Start location"
              icon="start"
              showGeolocate
              onUseMyLocation={handleUseMyLocation}
            />

            <div className="flex justify-center">
              <button
                onClick={swapLocations}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            <LocationPicker
              value={destination}
              onChange={setDestination}
              placeholder="Where to?"
              icon="end"
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
              disabled={isLoading || geoLoading}
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

        {/* Route Results */}
        {routeResult && !isNavigating && (
          <div className="space-y-4">
            {/* Route Summary */}
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
              </div>

              {/* Start Navigation Button */}
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

            {/* Mini Map */}
            {routeResult.routeCoords && routeResult.routeCoords.length > 1 && (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="h-48">
                  <MiniMap
                    coords={routeResult.routeCoords}
                    startName={routeResult.startLocation}
                    endName={routeResult.endLocation}
                  />
                </div>
              </div>
            )}

            {/* Directions List */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-500" />
                Directions
              </h3>
              <ol className="space-y-0">
                {routeResult.directions.map((dir, i) => (
                  <li key={dir.step} className="flex items-start gap-3 relative">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center z-10">
                        {getDirectionIcon(dir.icon)}
                      </div>
                      {i < routeResult.directions.length - 1 && (
                        <div className="w-0.5 h-8 bg-blue-100" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-4">
                      <p className="text-sm text-gray-800 font-medium">{dir.instruction}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{dir.distance}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Active Navigation Mode */}
        {isNavigating && routeResult && (
          <div className="space-y-4">
            {/* Navigation Header Bar */}
            <div className="rounded-2xl border border-blue-200 bg-blue-500 p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Step {currentStep + 1} of {routeResult.directions.length}</p>
                  <p className="text-lg font-bold mt-1">{routeResult.directions[currentStep]?.instruction}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{routeResult.directions[currentStep]?.distance}</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-blue-400 rounded-full h-1.5">
                <div
                  className="bg-white rounded-full h-1.5 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / routeResult.directions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation Map */}
            {routeResult.routeCoords && routeResult.routeCoords.length > 1 && (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <div className="h-64">
                  <MiniMap
                    coords={routeResult.routeCoords}
                    startName={routeResult.startLocation}
                    endName={routeResult.endLocation}
                    activeStep={currentStep}
                    directions={routeResult.directions}
                  />
                </div>
              </div>
            )}

            {/* Step Navigation Controls */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={handleStopNavigation}
                  className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow-lg shadow-red-500/25"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={currentStep >= routeResult.directions.length - 1}
                  className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Step Details */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-gray-900 font-semibold mb-3">All Steps</h3>
              <ol className="space-y-0">
                {routeResult.directions.map((dir, i) => (
                  <li
                    key={dir.step}
                    className={`flex items-start gap-3 relative rounded-lg px-2 py-2 -mx-2 transition-colors ${
                      i === currentStep ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setCurrentStep(i)}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center z-10 ${
                        i === currentStep
                          ? 'bg-blue-500 border-2 border-blue-300 text-white'
                          : i < currentStep
                            ? 'bg-green-100 border-2 border-green-200'
                            : 'bg-gray-50 border-2 border-gray-200'
                      }`}>
                        {i < currentStep ? (
                          <span className="text-green-500 text-xs">✓</span>
                        ) : getDirectionIcon(dir.icon)}
                      </div>
                      {i < routeResult.directions.length - 1 && (
                        <div className={`w-0.5 h-6 ${i < currentStep ? 'bg-green-200' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${i === currentStep ? 'text-blue-700' : 'text-gray-800'}`}>
                        {dir.instruction}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{dir.distance}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <button
          onClick={handleEmergency}
          className="w-full py-3 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-semibold transition-all flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Emergency — Call 112
        </button>
      </div>
    </div>
  );
}

export default function NavigatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <NavigateContent />
    </Suspense>
  );
}
