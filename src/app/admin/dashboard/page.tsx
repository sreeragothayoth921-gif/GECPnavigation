'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MapPin, Route, Users, AlertTriangle, TrendingUp, Navigation } from 'lucide-react';

const statsCards = [
  { label: 'Total Locations', value: '120+', icon: MapPin, color: 'from-cyan-500 to-blue-500' },
  { label: 'Total Paths', value: '100+', icon: Route, color: 'from-indigo-500 to-purple-500' },
  { label: 'Active Users', value: '0', icon: Users, color: 'from-green-500 to-emerald-500' },
  { label: 'Blocked Paths', value: '0', icon: AlertTriangle, color: 'from-yellow-500 to-orange-500' },
  { label: 'Navigation Sessions', value: '0', icon: Navigation, color: 'from-pink-500 to-rose-500' },
  { label: 'Reports', value: '0', icon: TrendingUp, color: 'from-purple-500 to-violet-500' },
];

const navData = [
  { day: 'Mon', sessions: 12 }, { day: 'Tue', sessions: 18 },
  { day: 'Wed', sessions: 15 }, { day: 'Thu', sessions: 22 },
  { day: 'Fri', sessions: 20 }, { day: 'Sat', sessions: 8 },
  { day: 'Sun', sessions: 5 },
];

const categoryData = [
  { name: 'Labs', value: 35, color: '#8B5CF6' },
  { name: 'Lecture Halls', value: 25, color: '#3B82F6' },
  { name: 'Offices', value: 15, color: '#10B981' },
  { name: 'Libraries', value: 5, color: '#F59E0B' },
  { name: 'Facilities', value: 20, color: '#6366F1' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of CampusNav campus data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((card) => (
          <div key={card.label} className="glass rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-gray-400 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">Navigation Sessions (This Week)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={navData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#172033', border: '1px solid #1e3a5f', borderRadius: '8px' }} />
              <Bar dataKey="sessions" fill="#00D4FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">Location Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#172033', border: '1px solid #1e3a5f', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}