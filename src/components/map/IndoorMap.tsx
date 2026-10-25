'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, ZoomIn, ZoomOut, RotateCcw, Home, MapPin, Navigation, Layers, ArrowUp, ChevronDown } from 'lucide-react';
import itBlockGround from '@/data/indoor/it-block-ground.json';
import itBlockFirst from '@/data/indoor/it-block-first.json';

import type { FloorPlan, Room, NavigationNode, NavigationEdge, IndoorRouteResult, IndoorTurnInstruction } from '@/lib/types/indoor';

interface RouteResult {
  distance: string;
  walkingTime: string;
  eta: string;
  directions: Array<{ step: number; instruction: string; distance: string; icon: string; floor?: string; action?: string }>;
  routeCoords: Array<{ lat: number; lng: number }>;
  startLocation: string;
  endLocation: string;
  floors?: string[];
  totalDistance?: number;
  totalTime?: number;
}

interface IndoorMapProps {
  floorPlan?: FloorPlan | null;
  selectedRoomId?: string | null;
  onRoomSelect?: (roomId: string) => void;
  route?: IndoorRouteResult | RouteResult | null;
  startRoomId?: string | null;
  endRoomId?: string | null;
  showRoute?: boolean;
  className?: string;
  height?: string;
}

const floorPlans: Record<string, FloorPlan> = {
  'IT_BLOCK-GROUND': itBlockGround as unknown as FloorPlan,
  'IT_BLOCK-FIRST': itBlockFirst as unknown as FloorPlan,
};

const ROOM_CATEGORY_COLORS: Record<string, string> = {
  LECTURE_HALL: '#3B82F6',
  LAB: '#8B5CF6',
  OFFICE: '#F59E0B',
  LIBRARY: '#10B981',
  CANTEEN: '#EF4444',
  WASHROOM: '#6B7280',
  FACILITY: '#6366F1',
  STORE: '#9CA3AF',
  ADMIN: '#EC4899',
  SEMINAR_HALL: '#06B6D4',
  ENTRANCE: '#22C55E',
  PARKING: '#78716C',
  MEDICAL: '#EF4444',
  CORRIDOR: '#94A3B8',
  STAIRS: '#F97316',
  ELEVATOR: '#8B5CF6',
  OTHER: '#64748B',
};

export default function IndoorMap({
  floorPlan: initialFloorPlan,
  selectedRoomId,
  onRoomSelect,
  route,
  startRoomId,
  endRoomId,
  showRoute = true,
  className = '',
  height = '600px',
}: IndoorMapProps) {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(initialFloorPlan ?? null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFloor, setActiveFloor] = useState<'GROUND' | 'FIRST'>('GROUND');
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (initialFloorPlan) {
      setFloorPlan(initialFloorPlan);
      setActiveFloor(initialFloorPlan.floor as 'GROUND' | 'FIRST');
    } else if (!floorPlan) {
      const key = `IT_BLOCK-${activeFloor}`;
      setFloorPlan(floorPlans[key] || null);
    }
  }, [initialFloorPlan, activeFloor, floorPlan]);

  const handleFloorChange = useCallback((newFloor: 'GROUND' | 'FIRST') => {
    setActiveFloor(newFloor);
    const key = `IT_BLOCK-${newFloor}`;
    setFloorPlan(floorPlans[key] || null);
    setViewport({ x: 0, y: 0, scale: 1 });
  }, []);

  const getRoomColor = (room: Room, isSelected: boolean, isStart: boolean, isEnd: boolean) => {
    if (isSelected) return '#F59E0B';
    if (isStart) return '#22C55E';
    if (isEnd) return '#EF4444';
    return ROOM_CATEGORY_COLORS[room.category] || '#64748B';
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(viewport.scale * zoomFactor, 0.3), 5);

    const newX = mouseX - (mouseX - viewport.x) * (newScale / viewport.scale);
    const newY = mouseY - (mouseY - viewport.y) * (newScale / viewport.scale);

    setViewport({ x: newX, y: newY, scale: newScale });
  }, [viewport]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      e.preventDefault();
    }
  }, [viewport]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    setHoveredRoom(null);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX - viewport.x, y: e.touches[0].clientY - viewport.y });
    }
  }, [viewport]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      setViewport(prev => ({
        ...prev,
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y,
      }));
    }
  }, [isPanning, panStart]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const zoomIn = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 5),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.3),
    }));
  }, []);

  const resetView = useCallback(() => {
    setViewport({ x: 0, y: 0, scale: 1 });
  }, []);

  const fitToScreen = useCallback(() => {
    if (!floorPlan || !containerRef.current) return;
    const container = containerRef.current;
    const scaleX = container.clientWidth / floorPlan.width;
    const scaleY = container.clientHeight / floorPlan.height;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    setViewport({ x: 0, y: 0, scale });
  }, [floorPlan]);

  const handleRoomClick = useCallback((room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRoomSelect) {
      onRoomSelect(room.id);
    }
  }, [onRoomSelect]);

  const handleRoomMouseEnter = useCallback((room: Room) => {
    setHoveredRoom(room);
  }, []);

  const handleRoomMouseLeave = useCallback(() => {
    setHoveredRoom(null);
  }, []);

  const filteredRooms = useMemo(() => {
    if (!floorPlan) return [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) return floorPlan.rooms;
    return floorPlan.rooms.filter(room =>
      room.name.toLowerCase().includes(query) ||
      room.code.toLowerCase().includes(query) ||
      room.category.toLowerCase().includes(query)
    );
  }, [floorPlan, searchQuery]);

  if (!floorPlan) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-xl ${className}`} style={{ height }}>
        <div className="text-center text-gray-500">
          <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No floor plan available</p>
          <p className="text-sm">Select a building and floor to view the indoor map</p>
        </div>
      </div>
    );
  }

  const transform = `translate(${viewport.x}, ${viewport.y}) scale(${viewport.scale})`;

  return (
    <div
      ref={containerRef}
      className={`relative bg-white rounded-xl overflow-hidden border border-gray-200 ${className}`}
      style={{ height }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 px-3 py-2 shadow-lg">
          <span className="text-sm font-medium text-gray-700">{floorPlan.buildingCode}</span>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => handleFloorChange('GROUND')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeFloor === 'GROUND'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ground
            </button>
            <button
              onClick={() => handleFloorChange('FIRST')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeFloor === 'FIRST'
                  ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              1st Floor
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search rooms..."
                className="pl-10 pr-4 py-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-64"
              />
            </div>
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showSearch && filteredRooms.length > 0 && (
        <div className="absolute top-20 left-3 right-3 z-10 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
          {filteredRooms.slice(0, 10).map(room => (
            <button
              key={room.id}
              onClick={() => {
                if (onRoomSelect) onRoomSelect(room.id);
                setSearchQuery('');
                setShowSearch(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: ROOM_CATEGORY_COLORS[room.category] + '20' }}
                >
                  <MapPin className="w-4 h-4" style={{ color: ROOM_CATEGORY_COLORS[room.category] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{room.name}</p>
                  <p className="text-xs text-gray-500">{room.code} · {ROOM_CATEGORY_COLORS[room.category]}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map Viewport */}
      <div className="absolute inset-0">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${floorPlan.width} ${floorPlan.height}`}
          style={{ transform, transformOrigin: '0 0' }}
        >
          {/* Background Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={floorPlan.width} height={floorPlan.height} fill="url(#grid)" />

          {/* Corridors */}
          {floorPlan.corridors.map(corridor => (
            <path
              key={corridor.id}
              d={(corridor.polygon as unknown as number[][]).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ') + ' Z'}
              fill="#F1F5F9"
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          ))}

          {/* Route Path */}
          {showRoute && route && (
            (() => {
              const pathNodes = 'path' in route && route.path ? route.path : 
                'routeCoords' in route && route.routeCoords ? route.routeCoords.map(c => ({ position: [c.lat, c.lng] })) : null;
              if (!pathNodes || pathNodes.length < 2) return null;
              return (
                <g filter="url(#route-glow)">
                  <path
                    d={pathNodes.map((node, i) => {
                      const pos = Array.isArray(node.position) ? node.position : [node.position.x, node.position.y];
                      return `${i === 0 ? 'M' : 'L'}${pos[0]} ${pos[1]}`;
                    }).join(' ')}
                    stroke="#3B82F6"
                    strokeWidth={6 / viewport.scale}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity={0.3}
                  />
                  <path
                    d={pathNodes.map((node, i) => {
                      const pos = Array.isArray(node.position) ? node.position : [node.position.x, node.position.y];
                      return `${i === 0 ? 'M' : 'L'}${pos[0]} ${pos[1]}`;
                    }).join(' ')}
                    stroke="#2563EB"
                    strokeWidth={3 / viewport.scale}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    strokeDasharray={5 / viewport.scale}
                  />
                </g>
              );
            })()
          )}

          {/* Rooms */}
          {floorPlan.rooms.map(room => {
            const isSelected = selectedRoomId === room.id;
            const isStart = startRoomId === room.id;
            const isEnd = endRoomId === room.id;
            const isHovered = hoveredRoom?.id === room.id;
            const color = getRoomColor(room, isSelected, isStart, isEnd);

            return (
              <g
                key={room.id}
                onClick={e => handleRoomClick(room, e)}
                onMouseEnter={() => handleRoomMouseEnter(room)}
                onMouseLeave={handleRoomMouseLeave}
                style={{ cursor: onRoomSelect ? 'pointer' : 'default' }}
              >
                <path
                  d={(room.polygon as unknown as number[][]).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ') + ' Z'}
                  fill={color + (isHovered || isSelected ? 'CC' : '40')}
                  stroke={color}
                  strokeWidth={(isSelected || isHovered ? 3 : 1.5) / viewport.scale}
                  strokeDasharray={isHovered ? `${4 / viewport.scale} ${4 / viewport.scale}` : 'none'}
                  filter={isSelected ? 'drop-shadow(0 0 8px currentColor)' : 'none'}
                />
                {(room.entrances as unknown as number[][]).length > 0 && (room.entrances as unknown as number[][]).map((entrance, i) => (
                  <circle
                    key={i}
                    cx={entrance[0]}
                    cy={entrance[1]}
                    r={5 / viewport.scale}
                    fill={color}
                    stroke="white"
                    strokeWidth={2 / viewport.scale}
                  />
                ))}
                {isSelected && (
                  <text
                    x={(room.centroid as unknown as number[])[0]}
                    y={(room.centroid as unknown as number[])[1] - 15}
                    textAnchor="middle"
                    fontSize={12 / viewport.scale}
                    fontWeight="bold"
                    fill="#1E293B"
                    stroke="white"
                    strokeWidth={3 / viewport.scale}
                    paintOrder="stroke"
                  >
                    {room.code}
                  </text>
                )}
              </g>
            );
          })}

          {/* Start/End Markers */}
          {startRoomId && (
            <g>
              {(floorPlan.rooms.find(r => r.id === startRoomId)?.entrances as unknown as number[][]).map((entrance, i) => (
                <g key={`start-${i}`} transform={`translate(${entrance[0]}, ${entrance[1]})`}>
                  <circle r={12 / viewport.scale} fill="#22C55E" opacity={0.2} />
                  <circle r={8 / viewport.scale} fill="#22C55E" />
                  <text x={0} y={4 / viewport.scale} textAnchor="middle" fill="white" fontSize={10 / viewport.scale} fontWeight="bold">S</text>
                </g>
              ))}
            </g>
          )}
          {endRoomId && (
            <g>
              {(floorPlan.rooms.find(r => r.id === endRoomId)?.entrances as unknown as number[][]).map((entrance, i) => (
                <g key={`end-${i}`} transform={`translate(${entrance[0]}, ${entrance[1]})`}>
                  <circle r={12 / viewport.scale} fill="#EF4444" opacity={0.2} />
                  <circle r={8 / viewport.scale} fill="#EF4444" />
                  <text x={0} y={4 / viewport.scale} textAnchor="middle" fill="white" fontSize={10 / viewport.scale} fontWeight="bold">E</text>
                </g>
              ))}
            </g>
          )}

          {/* Stairs/Elevator markers */}
          {floorPlan.rooms
            .filter(r => r.category === 'STAIRS' || r.category === 'ELEVATOR')
            .map(room => (
              <g key={room.id} transform={`translate(${(room.centroid as unknown as number[])[0]}, ${(room.centroid as unknown as number[])[1]})`}>
                <circle r={15 / viewport.scale} fill={room.category === 'STAIRS' ? '#F97316' : '#8B5CF6'} opacity={0.2} />
                <circle r={10 / viewport.scale} fill={room.category === 'STAIRS' ? '#F97316' : '#8B5CF6'} />
                {room.category === 'STAIRS' ? (
                  <path d="M-5 -3 L0 3 L5 -3" stroke="white" strokeWidth={2 / viewport.scale} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <rect x={-6 / viewport.scale} y={-8 / viewport.scale} width={12 / viewport.scale} height={16 / viewport.scale} fill="white" rx={1 / viewport.scale} />
                )}
              </g>
            ))}
        </svg>
      </div>

      {/* Route Glow Filter */}
      <defs>
        <filter id="route-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Bottom Controls */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 px-3 py-2 shadow-lg">
          <button onClick={zoomIn} className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors" title="Zoom In"><ZoomIn className="w-5 h-5" /></button>
          <button onClick={zoomOut} className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors" title="Zoom Out"><ZoomOut className="w-5 h-5" /></button>
          <button onClick={resetView} className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors" title="Reset View"><RotateCcw className="w-5 h-5" /></button>
          <button onClick={fitToScreen} className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors" title="Fit to Screen"><Home className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 px-3 py-2 shadow-lg text-sm text-gray-600">
          <span>Zoom: {Math.round(viewport.scale * 100)}%</span>
          <span className="w-px h-4 bg-gray-200 mx-2" />
          <span>{floorPlan.rooms.length} rooms</span>
        </div>
      </div>

      {/* Room Info Panel */}
      {hoveredRoom && (
        <div className="absolute top-20 right-3 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[200px] max-w-[280px] animate-slide-in">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: ROOM_CATEGORY_COLORS[hoveredRoom.category] + '20' }}
            >
              <MapPin className="w-4 h-4" style={{ color: ROOM_CATEGORY_COLORS[hoveredRoom.category] }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate">{hoveredRoom.name}</p>
              <p className="text-xs text-gray-500">{hoveredRoom.code}</p>
            </div>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <p><span className="font-medium">Category:</span> {ROOM_CATEGORY_COLORS[hoveredRoom.category]}</p>
            <p><span className="font-medium">Floor:</span> {hoveredRoom.floor}</p>
            {hoveredRoom.metadata?.capacity && <p><span className="font-medium">Capacity:</span> {hoveredRoom.metadata.capacity}</p>}
            {hoveredRoom.metadata?.occupants && <p><span className="font-medium">Occupants:</span> {hoveredRoom.metadata.occupants}</p>}
            {hoveredRoom.metadata?.restricted && <p className="text-red-600"><span className="font-medium">Restricted Access</span></p>}
          </div>
          {onRoomSelect && (
            <button
              onClick={() => onRoomSelect(hoveredRoom.id)}
              className="w-full mt-3 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Select as Destination
            </button>
          )}
        </div>
      )}

      {/* Route Info Panel */}
      {route && showRoute && (
        <div className="absolute bottom-20 left-3 right-3 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-3 animate-slide-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-500" />
              Route Details
            </h3>
            <span className="text-sm text-gray-500">{route.totalDistance}m · {route.totalTime ? Math.ceil(route.totalTime / 60) : '?'} min</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            {route.floors?.map((f, i) => (
              <span key={f} className={`px-2 py-1 rounded-full text-xs ${
                i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {f} {i < (route.floors?.length ?? 1) - 1 && <ChevronDown className="w-3 h-3 inline ml-1" />}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Turn Instructions */}
      {route && (() => {
        const instr = 'instructions' in route ? route.instructions : route.directions;
        return instr && instr.length > 0 && (
          <div className="absolute bottom-20 left-3 right-3 z-10 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto animate-slide-in">
            <div className="p-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900">Turn-by-Turn</h4>
            </div>
            <div className="p-2 space-y-1">
              {instr.slice(0, 5).map((inst, i) => (
                <div key={inst.step} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  <span className="flex-1">{('description' in inst ? inst.description : inst.instruction)}</span>
                  <span className="text-gray-400">{typeof inst.distance === 'number' ? Math.round(inst.distance) : inst.distance}</span>
                </div>
              ))}
              {instr.length > 5 && (
                <div className="text-center text-xs text-gray-400 py-1">
                  +{instr.length - 5} more steps
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}