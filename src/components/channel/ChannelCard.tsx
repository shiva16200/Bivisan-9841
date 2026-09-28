import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Play, Globe } from 'lucide-react';
import { Channel, Program } from '../../types';
import { useFavorites } from '../../context/FavoritesContext';
import { usePlayer } from '../../context/PlayerContext';
import { fetchProgramsForChannel, getCurrentAndNextProgram } from '../../services/epgService';
import { RealtimeViewerBadge } from '../common/RealtimeViewerBadge';
import { incrementChannelView } from '../../services/viewCounterService';

interface ChannelCardProps {
  channel: Channel;
  viewMode?: 'grid' | 'list';
  featured?: boolean;
  onSelect?: (channel: Channel) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  viewMode = 'grid',
  onSelect,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { playChannel, activeChannel } = usePlayer();
  const isFav = isFavorite(channel.id);
  const isCurrentlyActive = activeChannel?.id === channel.id;

  const [currentProg, setCurrentProg] = useState<Program | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Only lazily check current program to avoid clogging mobile network
    let isMounted = true;
    fetchProgramsForChannel(channel.id).then((progs) => {
      if (isMounted && progs && progs.length > 0) {
        const { current } = getCurrentAndNextProgram(progs);
        setCurrentProg(current);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [channel.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(channel.id, channel.name);
  };

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    incrementChannelView(channel.id, channel.viewerCount);
    if (onSelect) {
      onSelect(channel);
    } else {
      playChannel(channel, true);
    }
  };

  const handleThumbnailClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      handleQuickPlay(e);
    } else {
      incrementChannelView(channel.id, channel.viewerCount);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        id={`channel-row-${channel.id}`}
        className={`group relative flex items-center justify-between p-3.5 md:p-4 rounded-2xl border transition-all duration-200 bg-slate-900/40 hover:bg-slate-900/80 ${
          isCurrentlyActive ? 'border-indigo-500/70 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/50' : 'border-slate-800/80 hover:border-slate-700'
        }`}
      >
        <Link
          to={`/channel/${channel.id}`}
          onClick={handleThumbnailClick}
          className="flex items-center gap-4 flex-1 min-w-0"
        >
          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
            {channel.logo && !imgError ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-indigo-950/80 flex items-center justify-center text-indigo-300 font-black text-xs">
                {channel.name.slice(0, 3).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                LIVE
              </span>
              {channel.isVerifiedLive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Verified
                </span>
              )}
              {channel.channelNumber && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Ch {channel.channelNumber}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                {channel.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span>{channel.countryCode}</span>
                <span>•</span>
                <span>{channel.language}</span>
              </span>
              <RealtimeViewerBadge channelId={channel.id} initialCount={channel.viewerCount} variant="compact" />
            </div>

            <h4 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
              {channel.name}
            </h4>

            <p className="text-xs text-slate-400 truncate mt-0.5">
              {currentProg ? `Now: ${currentProg.title}` : channel.description}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            id={`quick-play-${channel.id}`}
            onClick={handleQuickPlay}
            aria-label={`Play ${channel.name}`}
            className="p-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
          <button
            id={`fav-btn-${channel.id}`}
            onClick={handleFavoriteClick}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            className={`p-2.5 rounded-xl transition-all active:scale-95 ${
              isFav
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  // Grid view card
  return (
    <div
      id={`channel-card-${channel.id}`}
      className={`group relative flex flex-col rounded-2xl border transition-all duration-300 bg-slate-900/40 hover:bg-slate-900/80 hover:-translate-y-1 overflow-hidden ${
        isCurrentlyActive
          ? 'border-indigo-500/80 shadow-xl shadow-indigo-950/30 ring-1 ring-indigo-500/50'
          : 'border-slate-800/80 hover:border-slate-700/90 shadow-lg shadow-black/20'
      }`}
    >
      {/* Thumbnail / Header */}
      <Link
        to={`/channel/${channel.id}`}
        onClick={handleThumbnailClick}
        className="block relative aspect-video w-full overflow-hidden bg-slate-950 cursor-pointer"
      >
        {channel.logo && !imgError ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-black text-lg flex items-center justify-center shadow-lg">
              {channel.name.slice(0, 3).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-300 mt-2 text-center line-clamp-1">
              {channel.name}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

        {/* Live Badge & Verified Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-md shadow-rose-950/50">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
          {channel.isVerifiedLive && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 backdrop-blur-md shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Verified 100%</span>
            </div>
          )}
        </div>

        {/* Realtime YouTube Viewers Pill */}
        <div className="absolute top-3 right-3 flex items-center z-10">
          <RealtimeViewerBadge channelId={channel.id} initialCount={channel.viewerCount} variant="youtube" />
        </div>

        {/* Play Overlay Button */}
        <button
          onClick={handleQuickPlay}
          aria-label={`Instant play ${channel.name}`}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-950/50 transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </button>
      </Link>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {channel.channelNumber && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Ch {channel.channelNumber}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                {channel.category}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Globe className="w-3 h-3 text-slate-500" />
              <span>{channel.countryCode}</span>
              <span>•</span>
              <span>{channel.language}</span>
            </div>
          </div>

          <Link 
            to={`/channel/${channel.id}`}
            onClick={handleThumbnailClick}
          >
            <h4 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
              {channel.name}
            </h4>
          </Link>

          {/* Program information */}
          <div className="mt-2 bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/60">
            <div className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider mb-0.5">
              Playing Now
            </div>
            <div className="text-xs font-semibold text-slate-200 line-clamp-1">
              {currentProg?.title || 'Live Broadcast Transmission'}
            </div>
            {currentProg?.description && (
              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                {currentProg.description}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60">
          {onSelect ? (
            <button
              onClick={handleQuickPlay}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Switch Channel</span>
            </button>
          ) : (
            <Link
              to={`/channel/${channel.id}`}
              onClick={() => incrementChannelView(channel.id, channel.viewerCount)}
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              Watch Stream
            </Link>
          )}

          <div className="flex items-center gap-1.5">
            <Link
              to={`/channel/${channel.id}`}
              title="Channel EPG Schedule"
              className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              EPG
            </Link>

            <button
              id={`fav-btn-grid-${channel.id}`}
              onClick={handleFavoriteClick}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-2 rounded-xl transition-all active:scale-90 ${
                isFav
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
