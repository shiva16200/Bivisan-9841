import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Tv,
  Calendar,
  Heart,
  History,
  Grid,
  Globe,
  Languages,
  Settings,
  ShieldCheck,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';

interface SidebarProps {
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const { isAdmin } = useAuth();
  const { favorites } = useFavorites();

  const mainLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/live', label: 'Live TV', icon: Tv, badge: 'LIVE' },
    { to: '/guide', label: 'TV Guide (EPG)', icon: Calendar },
    {
      to: '/favorites',
      label: 'Favorites',
      icon: Heart,
      count: favorites.length > 0 ? favorites.length : undefined,
    },
    { to: '/history', label: 'Recently Watched', icon: History },
  ];

  const exploreLinks = [
    { to: '/categories', label: 'Categories', icon: Grid },
    { to: '/countries', label: 'Countries', icon: Globe },
    { to: '/languages', label: 'Languages', icon: Languages },
  ];

  return (
    <aside
      id="streamlive-sidebar"
      className={`h-[calc(100vh-4rem)] sticky top-16 bg-slate-950/70 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 z-20 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      <div className="p-3 space-y-6 overflow-y-auto no-scrollbar flex-1">
        {/* Main Navigation Section */}
        <div>
          {!collapsed && (
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Browse
            </div>
          )}
          <nav className="space-y-1">
            {mainLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? link.label : undefined}
              >
                <link.icon className={`w-5 h-5 flex-shrink-0 ${link.label === 'Favorites' ? 'text-rose-400' : ''}`} />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                        {link.badge}
                      </span>
                    )}
                    {link.count !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                        {link.count}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Explore Directory Section */}
        <div>
          {!collapsed && (
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Explore
            </div>
          )}
          <nav className="space-y-1">
            {exploreLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? link.label : undefined}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Administration Section */}
        {isAdmin && (
          <div>
            {!collapsed && (
              <div className="px-3 text-[11px] font-bold text-amber-400/90 uppercase tracking-wider mb-2">
                Management
              </div>
            )}
            <nav className="space-y-1">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-amber-200 hover:bg-amber-950/30'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? 'Admin Dashboard' : undefined}
              >
                <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
                {!collapsed && <span>Admin Dashboard</span>}
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Footer Settings & Legal Stream notice */}
      <div className="p-3 border-t border-slate-800/80 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isActive ? 'text-indigo-400 bg-slate-900' : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            } ${collapsed ? 'justify-center' : ''}`
          }
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {!collapsed && (
          <div className="px-3 pt-2 text-[10px] text-slate-500 leading-tight">
            100% Legal & Authorized Streams Only
          </div>
        )}
      </div>
    </aside>
  );
};
