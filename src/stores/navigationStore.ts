'use client';

import { create } from 'zustand';

interface TurnInstruction {
  step: number;
  action: 'continue' | 'turn_left' | 'turn_right' | 'turn_around' | 'enter_building' | 'take_stairs' | 'take_elevator' | 'arrive';
  description: string;
  distance: number;
  nodeId: string;
}

interface NavigationState {
  startLocationId: string | null;
  endLocationId: string | null;
  isActive: boolean;
  isNavigating: boolean;
  route: {
    path: string[];
    totalDistance: number;
    totalTime: number;
    eta: Date;
    turnByTurn: TurnInstruction[];
  } | null;
  avoidedStairs: boolean;
  wheelchairMode: boolean;
  setStartLocation: (id: string | null) => void;
  setEndLocation: (id: string | null) => void;
  setRoute: (route: NavigationState['route']) => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  setAvoidedStairs: (avoid: boolean) => void;
  setWheelchairMode: (mode: boolean) => void;
  clearRoute: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  startLocationId: null,
  endLocationId: null,
  isActive: false,
  isNavigating: false,
  route: null,
  avoidedStairs: false,
  wheelchairMode: false,
  setStartLocation: (id) => set({ startLocationId: id }),
  setEndLocation: (id) => set({ endLocationId: id }),
  setRoute: (route) => set({ route }),
  startNavigation: () => set({ isActive: true, isNavigating: true }),
  stopNavigation: () => set({ isNavigating: false }),
  setAvoidedStairs: (avoid) => set({ avoidedStairs: avoid }),
  setWheelchairMode: (mode) => set({ wheelchairMode: mode }),
  clearRoute: () => set({
    startLocationId: null,
    endLocationId: null,
    isActive: false,
    isNavigating: false,
    route: null,
  }),
}));