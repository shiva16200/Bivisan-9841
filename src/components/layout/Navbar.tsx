import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Tv,
  Radio,
  Calendar,
  User as UserIcon,
  LogOut,
  Settings,
  ShieldCheck,
  Heart,
  History,
  Menu,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenAiCompanion?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenAiCompanion }) => {
  const navigate = useNavigate();
  const { user, userProfile, isAdmin, signOutUser, signInAsDemoUser } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <header
      id="streamlive-navbar"
      className="sticky top-0 z-30 w-full h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between gap-4"
    >
      {/* Left: Sidebar Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-950/40">
            <Radio className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">Stream</span>
              <span className="font-extrabold text-lg text-indigo-400 tracking-tight">Live</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide -mt-1 hidden sm:inline">
              Authorized Live TV
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-lg hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="global-navbar-search"
            type="text"
            placeholder="Search channels, shows, categories, countries..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </form>
      </div>

      {/* Right: Quick Actions & Auth */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <Link
          to="/search"
          aria-label="Open search"
          className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60"
        >
          <Search className="w-5 h-5" />
        </Link>

        {/* Live TV link */}
        <Link
          to="/live"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <Tv className="w-3.5 h-3.5 text-indigo-400" />
          <span>Live TV</span>
        </Link>

        {/* TV Guide EPG link */}
        <Link
          to="/guide"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>TV Guide</span>
        </Link>

        {/* User Account / Profile */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
              aria-label="User account menu"
            >
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName || 'User'}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
                  {(userProfile?.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-white truncate max-w-[120px]">
                  {userProfile?.displayName || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  {isAdmin ? 'Admin' : 'Viewer'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in"
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                  <div className="font-bold text-white truncate">
                    {userProfile?.displayName || 'User'}
                  </div>
                  <div className="text-slate-400 text-[11px] truncate">{user.email}</div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/favorites"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-colors"
                >
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>My Favorites</span>
                </Link>

                <Link
                  to="/history"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-colors"
                >
                  <History className="w-4 h-4 text-blue-400" />
                  <span>Watch History</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-950/40 font-semibold transition-colors border-t border-slate-800/80 mt-1 pt-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                <Link
                  to="/settings"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={() => {
                    signOutUser();
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 font-semibold transition-colors border-t border-slate-800/80 mt-1 pt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Quick Demo Switcher for fast review */}
            <button
              onClick={() => signInAsDemoUser(true)}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] font-semibold hover:bg-amber-900/40 transition-colors"
              title="Sign in instantly as Admin to test management features"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Preview</span>
            </button>

            <Link
              to="/login"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-950/50"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
