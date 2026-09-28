import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MiniPlayer } from '../player/MiniPlayer';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white overflow-x-hidden w-full max-w-[100vw]">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Container */}
      <div className="flex-1 flex w-full min-w-0 overflow-x-hidden">
        {/* Left Sidebar (hidden on mobile, responsive toggle on desktop) */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar collapsed={sidebarCollapsed} />
        </div>

        {/* Content View Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-4 sm:py-6 pb-24 md:pb-12 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Floating Mini Player */}
      <MiniPlayer />

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
