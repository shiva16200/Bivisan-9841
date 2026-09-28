import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Trash2,
  Tv,
  Volume2,
  Sliders,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useHistory } from '../context/HistoryContext';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { clearFavorites } = useFavorites();
  const { clearHistory } = useHistory();
  const { showToast } = useToast();

  const [autoPlay, setAutoPlay] = useState(true);
  const [miniPlayerEnabled, setMiniPlayerEnabled] = useState(true);
  const [defaultQuality, setDefaultQuality] = useState('auto');
  const [closedCaptions, setClosedCaptions] = useState(false);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('streamlive_app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.autoPlay !== undefined) setAutoPlay(parsed.autoPlay);
        if (parsed.miniPlayerEnabled !== undefined) setMiniPlayerEnabled(parsed.miniPlayerEnabled);
        if (parsed.defaultQuality) setDefaultQuality(parsed.defaultQuality);
        if (parsed.closedCaptions !== undefined) setClosedCaptions(parsed.closedCaptions);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveSettings = (newSettings: Record<string, unknown>) => {
    try {
      const current = {
        autoPlay,
        miniPlayerEnabled,
        defaultQuality,
        closedCaptions,
        ...newSettings,
      };
      localStorage.setItem('streamlive_app_settings', JSON.stringify(current));
      showToast('Settings saved successfully', 'success');
    } catch {
      // ignore
    }
  };

  const handleClearSearches = () => {
    localStorage.removeItem('streamlive_recent_search_queries');
    showToast('Search queries cleared', 'info');
  };

  return (
    <div id="settings-page" className="max-w-3xl mx-auto space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Application Settings
          </h1>
        </div>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Customize video player behavior, playback quality, privacy, and account data.
        </p>
      </div>

      {/* Playback Preferences */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Tv className="w-4 h-4 text-indigo-400" />
          <span>Playback & Video Player</span>
        </h3>

        <div className="space-y-4 divide-y divide-slate-800/80">
          <div className="flex items-center justify-between pt-3 first:pt-0">
            <div>
              <div className="text-sm font-semibold text-white">Autoplay Live Streams</div>
              <div className="text-xs text-slate-400">
                Automatically start live playback upon selecting a channel
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={(e) => {
                setAutoPlay(e.target.value === 'on');
                saveSettings({ autoPlay: e.target.checked });
              }}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-sm font-semibold text-white">Floating Mini Player</div>
              <div className="text-xs text-slate-400">
                Continue watching in picture-in-picture mode while navigating other pages
              </div>
            </div>
            <input
              type="checkbox"
              checked={miniPlayerEnabled}
              onChange={(e) => {
                setMiniPlayerEnabled(e.target.checked);
                saveSettings({ miniPlayerEnabled: e.target.checked });
              }}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-sm font-semibold text-white">Default Stream Quality</div>
              <div className="text-xs text-slate-400">
                Adaptive bitrate selects optimal resolution according to bandwidth
              </div>
            </div>
            <select
              value={defaultQuality}
              onChange={(e) => {
                setDefaultQuality(e.target.value);
                saveSettings({ defaultQuality: e.target.value });
              }}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="auto">Auto (Adaptive)</option>
              <option value="1080">1080p Full HD</option>
              <option value="720">720p HD</option>
              <option value="480">480p SD</option>
            </select>
          </div>
        </div>
      </section>

      {/* Privacy & Storage */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Data & Local Privacy</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={clearHistory}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/60 text-left transition-all group"
          >
            <div className="text-xs font-bold text-white group-hover:text-rose-300 mb-1">
              Clear Watch History
            </div>
            <div className="text-[11px] text-slate-400">Reset your viewing log</div>
          </button>

          <button
            onClick={clearFavorites}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/60 text-left transition-all group"
          >
            <div className="text-xs font-bold text-white group-hover:text-rose-300 mb-1">
              Clear All Favorites
            </div>
            <div className="text-[11px] text-slate-400">Remove all pinned channels</div>
          </button>

          <button
            onClick={handleClearSearches}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/60 text-left transition-all group"
          >
            <div className="text-xs font-bold text-white group-hover:text-rose-300 mb-1">
              Clear Recent Searches
            </div>
            <div className="text-[11px] text-slate-400">Wipe search query history</div>
          </button>
        </div>
      </section>

      {/* Legal & Compliance Notice */}
      <section className="bg-emerald-950/20 border border-emerald-900/40 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <CheckCircle className="w-5 h-5" />
          <span>100% Authorized & Legal Streaming Compliance</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          StreamLive only links and delivers authorized, publicly free-to-air, and officially licensed live HLS/DASH streams. We strictly prohibit scraping, DRM circumvention, or unauthorized distribution of intellectual property.
        </p>
      </section>
    </div>
  );
};
