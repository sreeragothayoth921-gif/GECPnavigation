'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera } from '@react-three/drei';
import { useState, useMemo } from 'react';
import campusBuildings from '@/data/campus-buildings.json';

const BUILDING_HEIGHTS: Record<string, number> = {
  MAIN: 3, EEE: 2, IT_BLOCK: 3, LIBRARY: 2, CCF: 1, TBI: 1,
  MECH: 1, CIVIL: 1, CHEM: 1, PHYSICS: 1, MATH: 1, CANTEEN: 1, GATE: 1.5, ADMIN: 2,
};

const BUILDING_COLORS: Record<string, string> = {
  MAIN: '#3B82F6', EEE: '#8B5CF6', IT_BLOCK: '#10B981', LIBRARY: '#F59E0B',
  CCF: '#EC4899', TBI: '#14B8A6', MECH: '#6366F1', CIVIL: '#78716C',
  CHEM: '#F97316', PHYSICS: '#06B6D4', MATH: '#A855F7', CANTEEN: '#EF4444',
  GATE: '#22C55E', ADMIN: '#64748B',
};

interface Building3DProps {
  building: any;
  position: [number, number, number];
  height: number;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

function Building3D({ building, position, height, color, isSelected, onClick }: Building3DProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
        position={[0, height / 2, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[3, height, 2.5]} />
        <meshStandardMaterial
          color={isSelected ? '#00D4FF' : hovered ? '#6366F1' : color}
          transparent
          opacity={isSelected ? 0.9 : hovered ? 0.85 : 0.7}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      {/* Label */}
      <Text
        position={[0, height + 0.5, 0]}
        fontSize={0.4}
        color={isSelected ? '#00D4FF' : '#F8FAFC'}
        anchorX="center"
        anchorY="bottom"
        font="/fonts/inter-bold.woff"
      >
        {building.name}
      </Text>
      {/* Glow effect when selected */}
      {isSelected && (
        <mesh position={[0, height / 2, 0]}>
          <boxGeometry args={[3.2, height + 0.2, 2.7]} />
          <meshStandardMaterial color="#00D4FF" transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}

interface Campus3DProps {
  selectedBuildingId?: string | null;
  onBuildingSelect?: (id: string) => void;
}

export default function Campus3D({ selectedBuildingId, onBuildingSelect }: Campus3DProps) {
  const buildings = useMemo(() => {
    const blds = campusBuildings as any[];
    return blds.filter(b => b.latitude && b.longitude).map((b, i) => {
      // Simple lat/lng to 3D coordinate mapping
      const x = (b.longitude - 76.3498) * 10000;
      const z = (b.latitude - 10.8505) * 10000;
      return { ...b, x, z };
    });
  }, []);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden bg-[#0B1020]">
      <Canvas>
        <PerspectiveCamera makeDefault position={[15, 20, 15]} fov={50} />
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          maxPolarAngle={Math.PI / 2.5}
          minDistance={5}
          maxDistance={50}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1} />
        <pointLight position={[-10, 10, -10]} intensity={0.3} color="#6366F1" />

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#111827" />
        </mesh>

        {/* Grid */}
        <gridHelper args={[50, 50, '#1e3a5f', '#1e3a5f']} position={[0, 0, 0]} />

        {/* Buildings */}
        {buildings.map((building) => {
          const height = BUILDING_HEIGHTS[building.code] || 2;
          const color = BUILDING_COLORS[building.code] || '#64748B';
          return (
            <Building3D
              key={building.id}
              building={building}
              position={[building.x, 0, building.z]}
              height={height}
              color={color}
              isSelected={selectedBuildingId === building.id}
              onClick={() => onBuildingSelect?.(building.id)}
            />
          );
        })}

        {/* Fog */}
        <fog attach="fog" args={['#0B1020', 20, 50]} />
      </Canvas>

      {/* Overlay info */}
      <div className="absolute bottom-4 left-4 glass rounded-xl px-4 py-2 text-sm">
        <span className="text-gray-400">3D Campus View</span>
        <span className="text-cyan-400 ml-2">{buildings.length} buildings</span>
      </div>
    </div>
  );
}