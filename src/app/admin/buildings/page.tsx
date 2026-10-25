'use client';

import { Plus, Pencil, Trash2 } from 'lucide-react';
import campusBuildings from '@/data/campus-buildings.json';

export default function AdminBuildingsPage() {
  const buildings = campusBuildings as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Buildings</h1>
          <p className="text-gray-400 text-sm mt-1">{buildings.length} buildings</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-lg text-white text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Building
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((b: any) => (
          <div key={b.id} className="glass rounded-xl p-5 hover:border-cyan-500/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{b.name}</h3>
                <p className="text-sm text-cyan-400 font-mono">{b.code}</p>
              </div>
              <div className="flex gap-2">
                <button className="text-gray-400 hover:text-cyan-400"><Pencil className="w-4 h-4" /></button>
                <button className="text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-3">{b.description || 'No description'}</p>
            <div className="flex flex-wrap gap-2">
              {(b.floors || []).map((f: string) => (
                <span key={f} className="px-2 py-0.5 rounded-md bg-gray-800 text-xs text-gray-300">{f}</span>
              ))}
            </div>
            {b.latitude && b.longitude && (
              <p className="text-xs text-gray-600 mt-3">GPS: {b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}