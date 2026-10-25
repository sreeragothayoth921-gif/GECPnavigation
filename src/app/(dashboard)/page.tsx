'use client';

import Link from 'next/link';
import { Navigation, MapPin, Search, Bot, Map, Clock, Star } from 'lucide-react';

const quickActions = [
  { href: '/navigate', label: 'Navigate', desc: 'Find the shortest route', icon: Navigation, color: 'from-cyan-500 to-blue-500' },
  { href: '/locations', label: 'Locations', desc: 'Browse all campus spots', icon: MapPin, color: 'from-indigo-500 to-purple-500' },
  { href: '/map', label: 'View Map', desc: 'Interactive campus map', icon: Map, color: 'from-green-500 to-emerald-500' },
  { href: '/ai', label: 'AI Assistant', desc: 'Ask navigation questions', icon: Bot, color: 'from-pink-500 to-rose-500' },
];

export default function DashboardHome() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="rounded-2xl p-6 relative overflow-hidden bg-white border border-gray-200 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50" />
        <div className="relative">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Welcome to CampusNav!</h1>
          <p className="text-gray-500">Navigate Government Engineering College Sreekrishnapuram with ease.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}
            className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold mb-1 text-gray-900">{action.label}</h3>
            <p className="text-sm text-gray-500">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: '50+', label: 'Locations', icon: MapPin },
          { value: '100+', label: 'Paths', icon: Navigation },
          { value: '<5ms', label: 'Route Calc', icon: Clock },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 text-center border border-gray-200 shadow-sm">
            <stat.icon className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-blue-600">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Popular Destinations */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
          <Star className="w-4 h-4 text-amber-500" />
          Popular Destinations
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {['Central Library', 'CSE Department', 'Canteen', 'EEE Block', 'CCF (G 316)', 'Main Gate'].map((dest) => (
            <Link key={dest} href={`/navigate?end=${encodeURIComponent(dest)}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-700">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-sm">{dest}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}