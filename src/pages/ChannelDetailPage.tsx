import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Share2,
  Globe,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Channel, Program } from '../types';
import { fetchChannelById, fetchChannels } from '../services/channelService';
import { fetchProgramsForChannel, getCurrentAndNextProgram } from '../services/epgService';
import { LivePlayer } from '../components/player/LivePlayer';
import { ChannelCard } from '../components/channel/ChannelCard';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { EmptyState } from '../components/common/EmptyState';
import { RealtimeViewerBadge } from '../components/common/RealtimeViewerBadge';
import { incrementChannelView } from '../services/viewCounterService';

export const ChannelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    // Immediately sanitize URL if it contains techjail
    if (id.startsWith('techjail-')) {
      const cleanId = id.replace(/^techjail-/, 'ch-');
      navigate(`/channel/${cleanId}`, { replace: true });
      return;
    }

    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Promise.all([fetchChannelById(id), fetchChannels(), fetchProgramsForChannel(id)])
      .then(([foundChannel, channelsList, progs]) => {
        if (isMounted) {
          setChannel(foundChannel);
          setAllChannels(channelsList);
          setPrograms(progs);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading channel detail:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const { current, next, progressPercent } = useMemo(() => {
    return getCurrentAndNextProgram(programs);
  }, [programs]);

  // Similar channels in the same category
  const similarChannels = useMemo(() => {
    if (!channel) return [];
    return allChannels
      .filter((c) => c.id !== channel.id && c.category === channel.category)
      .slice(0, 4);
  }, [allChannels, channel]);

  const isFav = channel ? isFavorite(channel.id) : false;

  const handleShare = async () => {
    if (!channel) return;
    const shareData = {
      title: `${channel.name} - Watch Live on StreamLive`,
      text: `Tune into ${channel.name} live broadcast online.`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // cancelled or ignored
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Channel link copied to clipboard!', 'success');
      } catch {
        showToast('Unable to copy link', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="w-full aspect-video rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
        <div className="h-8 bg-slate-800 rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-slate-800/60 rounded w-1/2 animate-pulse" />
      </div>
    );
  }

  if (!channel) {
    return (
      <EmptyState
        icon={Radio}
        title="Channel Not Found"
        description="The live channel you are searching for does not exist or may have been retired."
        actionLabel="Browse All Channels"
        actionHref="/live"
      />
    );
  }

  return (
    <div id="channel-detail-view" className="space-y-8 animate-in fade-in overflow-x-hidden">
      {/* 1. Primary Live Player - Mobile Full Screen Fit */}
      <section id="player-section" className="-mx-4 sm:mx-0">
        <LivePlayer
          channel={channel}
          currentProgram={current}
          nextProgram={next}
          autoPlay={true}
        />
      </section>

      {/* 2. Channel Header Meta & Actions */}
      <section id="channel-info-section" className="flex flex-col md:flex-row md:items-start justify-between gap-5 pb-6 border-b border-slate-800/80">
        <div className="flex items-start gap-3 sm:gap-4">
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl object-cover border border-slate-800 bg-slate-950 shadow-xl flex-shrink-0"
          />

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                {channel.category}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800">
                {channel.resolution || '1080p Full HD'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight break-words">
              {channel.name}
            </h1>

            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                {channel.country} ({channel.countryCode})
              </span>
              <span>•</span>
              <span>{channel.language}</span>
              <span>•</span>
              <RealtimeViewerBadge channelId={channel.id} initialCount={channel.viewerCount} variant="youtube" />
            </div>
          </div>
        </div>

        {/* Action Buttons: Favorite, Share, Website */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-start">
          <button
            onClick={() => toggleFavorite(channel.id, channel.name)}
            className={`px-3.5 sm:px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all active:scale-95 ${
              isFav
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
            <span>{isFav ? 'Favorited' : 'Add to Favorites'}</span>
          </button>

          <button
            onClick={handleShare}
            className="px-3.5 sm:px-4 py-2 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-2 transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

        </div>
      </section>

      {/* 3. Program Schedule & Currently Airing */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Current Program Spotlight */}
          {current ? (
            <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Currently Airing
                </span>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(current.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(current.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white">{current.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{current.description}</p>

              <div className="pt-2">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                  <span>{progressPercent}% completed</span>
                  <span>Category: {current.category}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400">
              Live broadcast in progress. Check the program guide below for upcoming schedules.
            </div>
          )}
        </div>

        {/* 4. Upcoming Program Schedule Sidebar */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Upcoming Schedule</span>
            </h3>
            <Link
              to="/guide"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Full Guide
            </Link>
          </div>

          <div className="space-y-3 divide-y divide-slate-800/50">
            {programs.slice(1, 6).map((prog) => (
              <div key={prog.id} className="pt-3 first:pt-0 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400">
                    {new Date(prog.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    {prog.category}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200">{prog.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-normal">
                  {prog.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Similar Channels in same category */}
      {similarChannels.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">
                More in {channel.category}
              </h2>
            </div>
            <Link
              to={`/category/${channel.category.toLowerCase()}`}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {similarChannels.map((sim) => (
              <ChannelCard key={sim.id} channel={sim} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
