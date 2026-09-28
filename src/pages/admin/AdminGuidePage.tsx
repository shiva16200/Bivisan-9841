import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Clock,
  Tv,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Channel, Program } from '../../types';
import { fetchChannels } from '../../services/channelService';
import {
  fetchProgramsForChannel,
  createProgram,
  deleteProgram,
  generate24HourGuide,
} from '../../services/epgService';
import { useToast } from '../../context/ToastContext';

export const AdminGuidePage: React.FC = () => {
  const { showToast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // New Program Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProgram, setNewProgram] = useState<Partial<Program>>({
    title: '',
    description: '',
    category: 'News',
    rating: 'TV-14',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });

  useEffect(() => {
    fetchChannels().then((data) => {
      setChannels(data);
      if (data.length > 0) {
        setSelectedChannelId(data[0].id);
      }
      setLoading(false);
    });
  }, []);

  const loadChannelPrograms = (channelId: string) => {
    fetchProgramsForChannel(channelId).then(setPrograms);
  };

  useEffect(() => {
    if (selectedChannelId) {
      loadChannelPrograms(selectedChannelId);
    }
  }, [selectedChannelId]);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelId || !newProgram.title) return;

    try {
      const created: Program = {
        id: `prog-${selectedChannelId}-${Date.now()}`,
        channelId: selectedChannelId,
        title: newProgram.title,
        description: newProgram.description || 'Program broadcast',
        category: newProgram.category || 'General',
        startTime: newProgram.startTime || new Date().toISOString(),
        endTime: newProgram.endTime || new Date(Date.now() + 3600000).toISOString(),
        rating: newProgram.rating || 'TV-G',
      };

      await createProgram(created);
      setPrograms((prev) => [...prev, created].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      setIsModalOpen(false);
      showToast('Program added to broadcast schedule', 'success');
    } catch {
      showToast('Failed to add program', 'error');
    }
  };

  const handleDeleteProgram = async (id: string, title: string) => {
    if (window.confirm(`Delete "${title}" from schedule?`)) {
      try {
        await deleteProgram(id);
        setPrograms((prev) => prev.filter((p) => p.id !== id));
        showToast('Program removed from schedule', 'info');
      } catch {
        showToast('Failed to delete program', 'error');
      }
    }
  };

  const handleRegenerateSchedule = () => {
    if (!selectedChannel) return;
    const fresh = generate24HourGuide(selectedChannel.id, selectedChannel.name, selectedChannel.category);
    localStorage.setItem(`streamlive_epg_${selectedChannel.id}`, JSON.stringify(fresh));
    setPrograms(fresh);
    showToast(`Regenerated standard 24h schedule for ${selectedChannel.name}`, 'success');
  };

  return (
    <div id="admin-guide-manager" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            EPG Schedule Manager
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Program timeline planner and broadcast metadata scheduler.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerateSchedule}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Auto-fill 24 hours of simulated programming"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Generate 24h Guide</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Program
          </button>
        </div>
      </div>

      {/* Channel Selector Bar */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <Tv className="w-5 h-5 text-indigo-400 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
          Target Channel:
        </span>
        <select
          value={selectedChannelId}
          onChange={(e) => setSelectedChannelId(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.name} ({ch.category} • {ch.countryCode})
            </option>
          ))}
        </select>
      </div>

      {/* Program Schedule Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <span>Listing for</span>
            <span className="text-indigo-400 font-extrabold">{selectedChannel?.name}</span>
            <span className="text-slate-500">({programs.length} scheduled items)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Air Time</th>
                <th className="px-4 py-3">Show Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-5 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {programs.map((prog) => {
                const isNow =
                  new Date(prog.startTime).getTime() <= Date.now() &&
                  new Date(prog.endTime).getTime() > Date.now();

                return (
                  <tr
                    key={prog.id}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isNow ? 'bg-indigo-950/30' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-white flex items-center gap-2">
                        {isNow && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                        <span>
                          {new Date(prog.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(prog.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(prog.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white">{prog.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 max-w-sm">
                        {prog.description}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium">
                        {prog.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        {prog.rating || 'TV-G'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteProgram(prog.id, prog.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete Program"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Program Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white">Add Broadcast Program</h3>

            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Program Title *
                </label>
                <input
                  type="text"
                  required
                  value={newProgram.title}
                  onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })}
                  placeholder="e.g. World Evening News Live"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  placeholder="Brief synopsis..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newProgram.category}
                    onChange={(e) => setNewProgram({ ...newProgram, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Rating
                  </label>
                  <input
                    type="text"
                    value={newProgram.rating}
                    onChange={(e) => setNewProgram({ ...newProgram, rating: e.target.value })}
                    placeholder="TV-PG"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Save Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
