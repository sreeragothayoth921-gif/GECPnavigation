'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import campusLocations from '@/data/campus-locations.json';

export default function AdminLocationsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);

  const categories = ['ALL', 'LECTURE_HALL', 'LAB', 'OFFICE', 'LIBRARY', 'CANTEEN', 'WASHROOM', 'SEMINAR_HALL', 'ADMIN', 'FACILITY', 'ENTRANCE', 'PARKING', 'MEDICAL'];

  const filtered = campusLocations.filter((loc: any) => {
    const matchSearch = loc.name.toLowerCase().includes(search.toLowerCase()) || (loc.code && loc.code.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'ALL' || loc.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Locations</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} locations</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-lg text-white text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search locations..." className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2.5 bg-[#111827] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50">
          {categories.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Building</th>
                <th className="text-left px-4 py-3 font-medium">Floor</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((loc: any) => (
                <tr key={loc.id} className="border-b border-gray-800/50 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-cyan-400">{loc.code || '-'}</td>
                  <td className="px-4 py-3">{loc.name}</td>
                  <td className="px-4 py-3 text-gray-400">{loc.buildingId}</td>
                  <td className="px-4 py-3 text-gray-400">{loc.floor}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-md bg-gray-800 text-xs">{loc.category?.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-gray-400 hover:text-cyan-400 mr-2"><Pencil className="w-4 h-4 inline" /></button>
                    <button className="text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}