"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  LogOut,
  Footprints,
  MapPin,
  Clock,
  Accessibility,
  ArrowUp,
  ChevronRight,
} from "lucide-react";

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

interface UserStats {
  totalNavigations: number;
  locationsVisited: number;
  totalTimeSaved: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo>({
    name: "Student User",
    email: "student@gec.ac.in",
    role: "student",
  });
  const [stats] = useState<UserStats>({
    totalNavigations: 42,
    locationsVisited: 18,
    totalTimeSaved: "2h 15m",
  });
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          setUser({
            name: u.fullName || 'Student User',
            email: u.email,
            role: u.role?.toLowerCase() || 'user',
          });
          if (u.navigationPrefs) {
            const p = typeof u.navigationPrefs === 'string' ? JSON.parse(u.navigationPrefs) : u.navigationPrefs;
            setAvoidStairs(p.avoidStairs ?? false);
            setWheelchair(p.wheelchairAccessible ?? false);
          }
        } else {
          window.location.href = '/login';
        }
      } catch {
        window.location.href = '/login';
      }
      setIsLoaded(true);
    };
    loadUser();
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = "/login";
  }, []);

  const roleBadgeColor =
    user.role === "admin"
      ? "bg-red-50 text-red-600 border-red-200"
      : user.role === "faculty"
        ? "bg-amber-50 text-amber-600 border-amber-200"
        : "bg-blue-50 text-blue-600 border-blue-200";

  if (!isLoaded) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-gray-200 rounded-xl" />
            <div className="h-40 bg-gray-100 rounded-2xl" />
            <div className="h-60 bg-gray-100 rounded-2xl" />
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
            <User className="w-7 h-7 text-blue-500" />
            Profile
          </h1>
        </header>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {user.name}
              </h2>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${roleBadgeColor}`}
            >
              <Shield className="w-3 h-3 inline mr-1" />
              {user.role}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
              <Footprints className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">
                {stats.totalNavigations}
              </p>
              <p className="text-xs text-gray-500">Navigations</p>
            </div>
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-3 text-center">
              <MapPin className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">
                {stats.locationsVisited}
              </p>
              <p className="text-xs text-gray-500">Places Visited</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
              <Clock className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">
                {stats.totalTimeSaved}
              </p>
              <p className="text-xs text-gray-500">Time Saved</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 pb-3">
            <h3 className="text-gray-900 font-semibold">Preferences</h3>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <ArrowUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">Avoid Stairs</span>
              </div>
              <button
                onClick={() => setAvoidStairs(!avoidStairs)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  avoidStairs ? "bg-blue-500" : "bg-gray-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                    avoidStairs ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <Accessibility className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  Wheelchair Accessible
                </span>
              </div>
              <button
                onClick={() => setWheelchair(!wheelchair)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  wheelchair ? "bg-blue-500" : "bg-gray-200"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                    wheelchair ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 pb-3">
            <h3 className="text-gray-900 font-semibold">Account</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <button
              onClick={() => router.push("/saved")}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-700">Saved Places</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-semibold transition-all duration-300 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
