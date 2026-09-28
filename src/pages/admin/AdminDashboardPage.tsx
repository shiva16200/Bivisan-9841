import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Tv,
  Grid,
  Plus,
  Calendar,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { Channel } from '../../types';
import { fetchChannels, resetToDefaultChannels } from '../../services/channelService';
import { isFirebaseConfigured } from '../../services/firebase';
import { useToast } from '../../context/ToastContext';

export const AdminDashboardPage: React.FC = () => {
  const { showToast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels().then((data) => {
      setChannels(data);
      setLoading(false);
    });
  }, []);

  const totalChannels = channels.length;
  const activeChannels = channels.filter((c) => c.active).length;
  const featuredChannels = channels.filter((c) => c.featured).length;
  const totalCategories = new Set(channels.map((c) => c.category)).size;
  const totalViewers = channels.reduce((acc, c) => acc + (c.viewerCount || 0), 0);

  const handleResetCatalog = () => {
    if (window.confirm('Reset all channels to default verified authorized catalog? Custom additions will be reset.')) {
      resetToDefaultChannels();
      fetchChannels().then(setChannels);
      showToast('Channel catalog restored to default verified list', 'success');
    }
  };

  return (
    <div id="admin-dashboard-page" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Broadcast Administration
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Manage channel catalogs, live stream HLS endpoints, electronic program guides, and broadcast compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/channels/new"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Channel
          </Link>
          <button
            onClick={handleResetCatalog}
            className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Reset to default legal channels"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Catalog</span>
          </button>
        </div>
      </div>

      {/* Backend & Compliance Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isFirebaseConfigured ? 'bg-emerald-500 shadow-lg shadow-emerald-900 animate-pulse' : 'bg-amber-400'}`} />
            <div>
              <div className="text-xs font-bold text-white">
                Persistence Backend: {isFirebaseConfigured ? 'Cloud Firestore Active' : 'Local Storage Engine'}
              </div>
              <div className="text-[11px] text-slate-400">
                {isFirebaseConfigured ? 'Production remote sync connected' : 'Local mock sandbox with instant client persistence'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 bg-slate-800 rounded text-slate-300">
            {isFirebaseConfigured ? 'ONLINE' : 'STANDALONE'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">
                100% Authorized Broadcast Compliance
              </div>
              <div className="text-[11px] text-slate-400">
                No unauthorized redistributions, scrapes, or DRM bypasses
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded">
            VERIFIED
          </span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Total Channels</div>
          <div className="text-2xl font-black text-white">{totalChannels}</div>
          <div className="text-[11px] text-emerald-400">Catalog size</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Active Streams</div>
          <div className="text-2xl font-black text-indigo-400">{activeChannels}</div>
          <div className="text-[11px] text-indigo-300">{Math.round((activeChannels / (totalChannels || 1)) * 100)}% online</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Featured Channels</div>
          <div className="text-2xl font-black text-amber-400">{featuredChannels}</div>
          <div className="text-[11px] text-amber-300">Spotlight slots</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Categories</div>
          <div className="text-2xl font-black text-rose-400">{totalCategories}</div>
          <div className="text-[11px] text-rose-300">Genres covered</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-400 font-medium">Estimated Viewers</div>
          <div className="text-2xl font-black text-white">{totalViewers.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400">Simulated live reach</div>
        </div>
      </div>

      {/* Quick Access Menu */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/channels"
          className="p-6 rounded-3xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-lg"
        >
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
              Channels Catalog
            </h3>
            <p className="text-xs text-slate-400">
              Add, edit, or configure authorized live HLS stream URLs
            </p>
          </div>
          <Tv className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0 ml-4" />
        </Link>

        <Link
          to="/categories"
          className="p-6 rounded-3xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-lg"
        >
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
              Categories & Genres
            </h3>
            <p className="text-xs text-slate-400">
              Browse by sports, news, entertainment, and devotional channels
            </p>
          </div>
          <Grid className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0 ml-4" />
        </Link>

        <Link
          to="/admin/guide"
          className="p-6 rounded-3xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-lg"
        >
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
              EPG Manager
            </h3>
            <p className="text-xs text-slate-400">
              Publish show listings and schedule broadcast times
            </p>
          </div>
          <Calendar className="w-7 h-7 text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0 ml-4" />
        </Link>
      </div>

      {/* Recent Channels Table Preview */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Channels Overview</h3>
          <Link
            to="/admin/channels"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            View All ({channels.length})
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Channel</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {channels.slice(0, 6).map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <img
                      src={c.logo}
                      alt={c.name}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-950 border border-slate-800"
                    />
                    <div>
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                        {c.streamUrl}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium">{c.category}</td>
                  <td className="px-4 py-3.5">
                    {c.country} ({c.countryCode})
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {c.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {c.featured ? (
                      <span className="text-amber-400 font-semibold">★ Yes</span>
                    ) : (
                      <span className="text-slate-500">No</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/admin/channels/${c.id}/edit`}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
