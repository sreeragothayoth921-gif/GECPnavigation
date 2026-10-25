'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Navigation, MapPin, Star, Bot, User, Menu, X, Compass, LayoutDashboard, Route, Building2, Users, AlertTriangle, BarChart3, Layers } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/navigate', label: 'Navigate', icon: Navigation },
  { href: '/indoor-navigate', label: 'Indoor Nav', icon: Layers },
  { href: '/locations', label: 'Locations', icon: MapPin },
  { href: '/saved', label: 'Saved', icon: Star },
  { href: '/ai', label: 'AI Assistant', icon: Bot },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminItems = [
  { href: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
  { href: '/admin/locations', label: 'Manage Locations', icon: MapPin },
  { href: '/admin/paths', label: 'Manage Paths', icon: Route },
  { href: '/admin/buildings', label: 'Buildings', icon: Building2 },
  { href: '/admin/map-editor', label: 'Map Editor', icon: Map },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: AlertTriangle },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = pathname.startsWith('/admin');
  const currentNav = isAdmin ? adminItems : navItems;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 flex-col shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-gray-900">CAMPUS</span>
              <span className="font-bold tracking-tight text-blue-600">NAV</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {isAdmin && (
            <div className="pt-2 pb-1 px-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
            </div>
          )}
          {currentNav.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            CampusNav v1.0
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900">CAMPUS<span className="text-blue-600">NAV</span></span>
        </Link>
        <div className="w-6" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 z-50 transition-transform shadow-xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">CAMPUS<span className="text-blue-600">NAV</span></span>
          </Link>
        </div>
        <nav className="p-3 space-y-1">
          {currentNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 w-full z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="pt-16 lg:pt-0 pb-20 lg:pb-0">
          <div className="p-4 lg:p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
