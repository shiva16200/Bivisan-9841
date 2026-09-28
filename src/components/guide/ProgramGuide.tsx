import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Calendar, ChevronRight, X, Info } from 'lucide-react';
import { Channel, Program } from '../../types';
import { fetchProgramsForChannel, getCurrentAndNextProgram } from '../../services/epgService';
import { usePlayer } from '../../context/PlayerContext';
import { GuideRowSkeleton } from '../common/LoadingSkeleton';

interface ProgramGuideProps {
  channels: Channel[];
  loading?: boolean;
}

export const ProgramGuide: React.FC<ProgramGuideProps> = ({
  channels,
  loading = false,
}) => {
  const { playChannel } = usePlayer();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProgram, setSelectedProgram] = useState<{ program: Program; channel: Channel } | null>(null);
  const [channelPrograms, setChannelPrograms] = useState<Record<string, Program[]>>({});
  const [fetchingSchedule, setFetchingSchedule] = useState(true);

  // Time grid reference anchored to current time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filter channels
  const filteredChannels = useMemo(() => {
    if (selectedCategory === 'all') return channels;
    const filterCat = selectedCategory.toLowerCase();
    return channels.filter((c) => {
      const chCat = c.category.toLowerCase();
      if (
        (filterCat === 'athletics & sports' || filterCat === 'sports') &&
        (chCat === 'sports' || chCat === 'athletics & sports')
      ) {
        return true;
      }
      return chCat === filterCat;
    });
  }, [channels, selectedCategory]);

  // Load programs for all filtered channels
  useEffect(() => {
    let isMounted = true;
    setFetchingSchedule(true);

    const loadAll = async () => {
      const results: Record<string, Program[]> = {};
      for (const ch of filteredChannels) {
        results[ch.id] = await fetchProgramsForChannel(ch.id);
      }
      if (isMounted) {
        setChannelPrograms(results);
        setFetchingSchedule(false);
      }
    };

    loadAll();
    return () => {
      isMounted = false;
    };
  }, [filteredChannels]);

  // Generate 6 half-hour timeline slots starting from the nearest half hour
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const base = new Date(currentTime);
    base.setMinutes(base.getMinutes() < 30 ? 0 : 30, 0, 0);

    for (let i = 0; i < 6; i++) {
      slots.push(new Date(base.getTime() + i * 30 * 60 * 1000));
    }
    return slots;
  }, [currentTime]);

  const categories = useMemo(() => {
    const set = new Set(channels.map((c) => c.category));
    return ['all', ...Array.from(set)];
  }, [channels]);

  if (loading || fetchingSchedule) {
    return (
      <div className="space-y-4 p-4 bg-slate-900/40 border border-slate-800 rounded-3xl">
        <div className="h-10 bg-slate-800/60 rounded-xl w-64 animate-pulse mb-6" />
        {Array.from({ length: 6 }).map((_, i) => (
          <GuideRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div id="epg-guide-container" className="space-y-6">
      {/* Category Pills & Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat === 'all' ? 'All Channels' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Current Broadcast Time:{' '}
            <strong className="text-slate-200">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </strong>
          </span>
        </div>
      </div>

      {/* Desktop EPG Timeline Grid */}
      <div className="hidden md:block bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
        {/* Timeline Header */}
        <div className="grid grid-cols-12 bg-slate-950/80 border-b border-slate-800 py-3.5 px-4 text-xs font-bold text-slate-400 sticky top-0 z-10 backdrop-blur-md">
          <div className="col-span-3 flex items-center gap-2 text-slate-300">
            <span>Live Channel</span>
          </div>
          <div className="col-span-9 grid grid-cols-6 gap-2">
            {timeSlots.map((slot, i) => (
              <div
                key={i}
                className={`text-center font-semibold ${
                  i === 0 ? 'text-indigo-400 flex items-center justify-center gap-1' : 'text-slate-400'
                }`}
              >
                {i === 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            ))}
          </div>
        </div>

        {/* Channels Rows */}
        <div className="divide-y divide-slate-800/60">
          {filteredChannels.map((channel) => {
            const progs = channelPrograms[channel.id] || [];
            const { current, progressPercent } = getCurrentAndNextProgram(progs, currentTime);

            return (
              <div
                key={channel.id}
                id={`epg-row-${channel.id}`}
                className="grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-800/30 transition-colors group"
              >
                {/* Channel Meta Column */}
                <div className="col-span-3 flex items-center justify-between pr-4">
                  <Link
                    to={`/channel/${channel.id}`}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-800 bg-slate-950 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors truncate">
                        {channel.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">{channel.category}</span>
                        <span>•</span>
                        <span>{channel.countryCode}</span>
                      </div>
                    </div>
                  </Link>

                  <button
                    onClick={() => playChannel(channel, true)}
                    aria-label={`Tune into ${channel.name}`}
                    className="p-2 rounded-lg bg-indigo-600/10 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white transition-all ml-1 flex-shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Program Timeline Blocks */}
                <div className="col-span-9 grid grid-cols-6 gap-2">
                  {/* Current Playing Block (Spans first 2 or 3 columns) */}
                  {current ? (
                    <div
                      onClick={() => setSelectedProgram({ program: current, channel })}
                      className="col-span-3 relative bg-gradient-to-r from-indigo-950/60 to-slate-900/90 border border-indigo-500/30 hover:border-indigo-500/80 rounded-xl p-2.5 cursor-pointer transition-all shadow-md flex flex-col justify-between overflow-hidden group/prog"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                            Now Airing
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(current.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(current.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-white group-hover/prog:text-indigo-300 truncate">
                        {current.title}
                      </div>

                      {/* Progress Bar inside block */}
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-3 bg-slate-900/40 rounded-xl p-2.5 text-xs text-slate-500 italic flex items-center">
                      Schedule updating...
                    </div>
                  )}

                  {/* Upcoming Program Blocks (Remaining 3 columns) */}
                  {progs
                    .filter((p) => new Date(p.startTime).getTime() >= currentTime.getTime())
                    .slice(0, 2)
                    .map((prog, idx) => (
                      <div
                        key={prog.id || idx}
                        onClick={() => setSelectedProgram({ program: prog, channel })}
                        className={`${
                          idx === 0 ? 'col-span-2' : 'col-span-1'
                        } bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer transition-all flex flex-col justify-between group/up`}
                      >
                        <div className="text-[10px] text-slate-400 font-semibold truncate mb-1">
                          {new Date(prog.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs font-semibold text-slate-200 group-hover/up:text-white truncate">
                          {prog.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-1">
                          {prog.category}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stacked Schedule View */}
      <div className="md:hidden space-y-4">
        {filteredChannels.map((channel) => {
          const progs = channelPrograms[channel.id] || [];
          const { current, next } = getCurrentAndNextProgram(progs, currentTime);

          return (
            <div
              key={channel.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Link to={`/channel/${channel.id}`} className="flex items-center gap-3">
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-800 bg-slate-950"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{channel.name}</h4>
                    <span className="text-xs text-slate-400">{channel.category}</span>
                  </div>
                </Link>

                <button
                  onClick={() => playChannel(channel, true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-white" /> Tune In
                </button>
              </div>

              {current && (
                <div
                  onClick={() => setSelectedProgram({ program: current, channel })}
                  className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    NOW AIRING
                  </div>
                  <div className="text-xs font-bold text-white mb-1">{current.title}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{current.description}</p>
                </div>
              )}

              {next && (
                <div
                  onClick={() => setSelectedProgram({ program: next, channel })}
                  className="text-xs text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80"
                >
                  <span className="truncate">
                    <strong className="text-slate-300">Up Next:</strong> {next.title}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <div
          id="epg-program-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedProgram(null)}
              aria-label="Close dialog"
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <img
                src={selectedProgram.channel.logo}
                alt={selectedProgram.channel.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-700"
              />
              <div>
                <span className="text-xs font-bold text-indigo-400">
                  {selectedProgram.channel.name}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedProgram.program.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 border-y border-slate-800 py-2.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                {new Date(selectedProgram.program.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedProgram.program.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                {selectedProgram.program.category}
              </span>
              {selectedProgram.program.rating && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                  {selectedProgram.program.rating}
                </span>
              )}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {selectedProgram.program.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={() => setSelectedProgram(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  playChannel(selectedProgram.channel, true);
                  setSelectedProgram(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" /> Tune In Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
