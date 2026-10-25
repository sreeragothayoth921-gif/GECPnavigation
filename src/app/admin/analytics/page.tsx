'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const popularLocations = [
  { name: 'Central Library', visits: 85 }, { name: 'CSE Dept', visits: 72 },
  { name: 'Canteen', visits: 68 }, { name: 'CCF', visits: 55 },
  { name: 'EEE Block', visits: 48 }, { name: 'IT Dept', visits: 42 },
  { name: 'Main Gate', visits: 38 }, { name: 'Physics Lab', visits: 30 },
];

const categoryPie = [
  { name: 'Labs', value: 35, color: '#8B5CF6' }, { name: 'Lecture Halls', value: 25, color: '#3B82F6' },
  { name: 'Offices', value: 15, color: '#10B981' }, { name: 'Libraries', value: 5, color: '#F59E0B' },
  { name: 'Facilities', value: 20, color: '#6366F1' },
];

const sessionsData = [
  { hour: '8am', sessions: 5 }, { hour: '9am', sessions: 12 }, { hour: '10am', sessions: 18 },
  { hour: '11am', sessions: 22 }, { hour: '12pm', sessions: 15 }, { hour: '1pm', sessions: 20 },
  { hour: '2pm', sessions: 25 }, { hour: '3pm', sessions: 18 }, { hour: '4pm', sessions: 14 },
  { hour: '5pm', sessions: 8 },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Campus navigation insights</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">Popular Locations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularLocations} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis type="number" stroke="#94A3B8" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={12} width={120} />
              <Tooltip contentStyle={{ background: '#172033', border: '1px solid #1e3a5f', borderRadius: '8px' }} />
              <Bar dataKey="visits" fill="#00D4FF" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold mb-4">Location Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {categoryPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#172033', border: '1px solid #1e3a5f', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Navigation Sessions by Hour</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={sessionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="hour" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#172033', border: '1px solid #1e3a5f', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="sessions" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}