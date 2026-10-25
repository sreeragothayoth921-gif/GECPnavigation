'use client';

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Reports</h1>
        <p className="text-gray-400 text-sm mt-1">0 pending reports</p>
      </div>
      <div className="glass rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
        <p className="text-gray-400 text-sm">User-submitted reports will appear here for review.</p>
      </div>
    </div>
  );
}