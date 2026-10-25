'use client';

import { Search } from 'lucide-react';

export default function AdminUsersPage() {
  const users = [
    { id: '1', email: 'admin@gec.ac.in', name: 'Admin', role: 'ADMIN', createdAt: '2024-01-01' },
    { id: '2', email: 'user@gec.ac.in', name: 'Demo User', role: 'USER', createdAt: '2024-01-15' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <p className="text-gray-400 text-sm mt-1">{users.length} registered users</p>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-800/50 hover:bg-white/5">
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3 text-gray-400">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-md text-xs ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{user.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}