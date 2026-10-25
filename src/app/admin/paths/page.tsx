'use client';

import { useState } from 'react';
import { Plus, Search, ArrowUpDown, CheckCircle, XCircle, AlertTriangle, Construction } from 'lucide-react';
import campusPaths from '@/data/campus-paths.json';

const statusColors: Record<string, string> = {
  OPEN: 'bg-green-500/10 text-green-400 border-green-500/20',
  BLOCKED: 'bg-red-500/10 text-red-400 border-red-500/20',
  CONSTRUCTION: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  RESTRICTED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export default function AdminPathsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const paths = campusPaths as any[];

  const filtered = paths.filter((p: any) => {
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Paths</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} paths</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-lg text-white text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Path
        </button>
      </div>

      <div className="flex gap-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-[#111827] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50">
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="BLOCKED">Blocked</option>
          <option value="CONSTRUCTION">Under Construction</option>
          <option value="RESTRICTED">Restricted</option>
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Destination</th>
                <th className="text-left px-4 py-3 font-medium">Distance</th>
                <th className="text-left px-4 py-3 font-medium">Floor</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Accessible</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((path: any) => (
                <tr key={path.id} className="border-b border-gray-800/50 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-cyan-400">{path.sourceId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-400">{path.destinationId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3">{path.distanceMeters}m</td>
                  <td className="px-4 py-3 text-gray-400">{path.floor}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs border ${statusColors[path.status] || statusColors.OPEN}`}>
                      {path.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{path.isAccessible ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-gray-600" />}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="px-3 py-1 rounded-md bg-gray-800 text-xs hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors">Edit Status</button>
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