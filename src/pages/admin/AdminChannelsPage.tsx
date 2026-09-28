import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tv,
  Star,
  CheckCircle,
  XCircle,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Channel } from '../../types';
import {
  fetchChannels,
  updateChannel,
  deleteChannel,
  resetToDefaultChannels,
} from '../../services/channelService';
import { useToast } from '../../context/ToastContext';

export const AdminChannelsPage: React.FC = () => {
  const { showToast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetchChannels().then((data) => {
      setChannels(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (channel: Channel) => {
    try {
      await updateChannel(channel.id, { active: !channel.active });
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? { ...c, active: !c.active } : c))
      );
      showToast(`${channel.name} is now ${!channel.active ? 'Active' : 'Disabled'}`, 'info');
    } catch {
      showToast('Failed to update channel status', 'error');
    }
  };

  const handleToggleFeatured = async (channel: Channel) => {
    try {
      await updateChannel(channel.id, { featured: !channel.featured });
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? { ...c, featured: !c.featured } : c))
      );
      showToast(
        `${channel.name} ${!channel.featured ? 'marked as Featured' : 'unfeatured'}`,
        'success'
      );
    } catch {
      showToast('Failed to update channel featured flag', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      try {
        await deleteChannel(id);
        setChannels((prev) => prev.filter((c) => c.id !== id));
        showToast(`Channel "${name}" removed`, 'info');
      } catch {
        showToast('Failed to delete channel', 'error');
      }
    }
  };

  const filteredChannels = channels.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' ||
      c.category.toLowerCase() === categoryFilter.toLowerCase() ||
      ((categoryFilter.toLowerCase() === 'athletics & sports' || categoryFilter.toLowerCase() === 'sports') &&
        (c.category.toLowerCase() === 'sports' || c.category.toLowerCase() === 'athletics & sports'));
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(channels.map((c) => c.category)))];

  return (
    <div id="admin-channels-manager" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Channel Management
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Configure authorized stream sources, stream formats, and display settings.
          </p>
        </div>

        <Link
          to="/admin/channels/new"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Channel
        </Link>
      </div>

      {/* Filter / Search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter channels by name, country, genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Channels Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Channel Info</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Region & Lang</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredChannels.map((channel) => (
                <tr key={channel.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-950 border border-slate-800 flex-shrink-0"
                    />
                    <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                      <div className="font-bold text-white truncate">{channel.name}</div>
                      <div className="text-[11px] text-indigo-400">{channel.category}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {channel.streamUrl}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase font-semibold">
                      {channel.streamType || 'HLS'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="text-white font-medium">{channel.country}</div>
                    <div className="text-[10px] text-slate-400">{channel.language}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleToggleActive(channel)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                        channel.active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                    >
                      {channel.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleToggleFeatured(channel)}
                      className={`p-1.5 rounded-lg transition-all ${
                        channel.featured
                          ? 'text-amber-400 bg-amber-500/20'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={channel.featured ? 'Unfeature' : 'Mark as Featured'}
                    >
                      <Star className={`w-4 h-4 ${channel.featured ? 'fill-amber-400' : ''}`} />
                    </button>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/channel/${channel.id}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Open Channel Live Preview"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        to={`/admin/channels/${channel.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        title="Edit Channel Configuration"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDelete(channel.id, channel.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete Channel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
