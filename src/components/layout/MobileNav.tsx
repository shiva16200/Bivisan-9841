import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Tv, Calendar, Heart, Search, User } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext';

export const MobileNav: React.FC = () => {
  const { favorites } = useFavorites();

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/live', label: 'Live TV', icon: Tv },
    { to: '/guide', label: 'Guide', icon: Calendar },
    { to: '/search', label: 'Search', icon: Search },
    {
      to: '/favorites',
      label: 'Favorites',
      icon: Heart,
      badge: favorites.length > 0 ? favorites.length : undefined,
    },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      id="streamlive-mobile-nav"
      className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 z-30 flex items-center justify-around px-2"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center w-full py-1 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <div className="relative">
            <item.icon className="w-5 h-5 mb-0.5" />
            {item.badge !== undefined && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                {item.badge}
              </span>
            )}
          </div>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
