import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useHistory } from '../context/HistoryContext';
import { useToast } from '../context/ToastContext';
import {
  User,
  ShieldCheck,
  Heart,
  History,
  Check,
  Edit2,
  Globe,
  Languages,
} from 'lucide-react';
import { COUNTRIES, LANGUAGES } from '../data/demoChannels';

export const ProfilePage: React.FC = () => {
  const { user, userProfile, isAdmin, updateDisplayName, signInAsDemoUser } = useAuth();
  const { favorites } = useFavorites();
  const { history, clearHistory } = useHistory();
  const { showToast } = useToast();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile?.displayName || '');
  const [prefCountry, setPrefCountry] = useState(userProfile?.preferredCountry || 'US');
  const [prefLang, setPrefLang] = useState(userProfile?.preferredLanguage || 'en');

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      await updateDisplayName(nameInput.trim());
      setIsEditingName(false);
      showToast('Profile name updated!', 'success');
    }
  };

  return (
    <div id="profile-page" className="max-w-4xl mx-auto space-y-8">
      {/* Header Profile Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt="Profile"
              className="w-24 h-24 rounded-3xl object-cover border-2 border-indigo-500/40 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl">
              {(userProfile?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-indigo-600 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-white">
                    {userProfile?.displayName || user?.email?.split('@')[0] || 'Live Streamer'}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-slate-400 hover:text-white p-1"
                    title="Edit display name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isAdmin
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {isAdmin && <ShieldCheck className="w-3.5 h-3.5" />}
                {isAdmin ? 'Administrator' : 'Viewer'}
              </span>
            </div>

            <p className="text-sm text-slate-400">{user?.email || 'Guest Session'}</p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400 justify-center sm:justify-start">
              <span>
                Joined: {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString([], { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <Heart className="w-6 h-6 fill-rose-500/30" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{favorites.length}</div>
            <div className="text-xs text-slate-400 font-medium">Favorite Channels</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{history.length}</div>
            <div className="text-xs text-slate-400 font-medium">Broadcasts Watched</div>
          </div>
        </div>
      </div>

      {/* User Preferences Form */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Viewing Preferences</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-400" /> Default Region / Country
            </label>
            <select
              value={prefCountry}
              onChange={(e) => setPrefCountry(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-indigo-400" /> Preferred Audio & Guide Language
            </label>
            <select
              value={prefLang}
              onChange={(e) => setPrefLang(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Demo Switcher */}
      <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Quick Persona Switcher
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Test both standard viewer and administrator roles in development mode.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => signInAsDemoUser(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Viewer Account
          </button>
          <button
            onClick={() => signInAsDemoUser(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition-colors"
          >
            Admin Account
          </button>
        </div>
      </div>
    </div>
  );
};
