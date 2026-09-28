import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { resolvePlayableStreamUrl } from '../../hooks/useHlsPlayer';
import Hls from 'hls.js';

const MiniPlayerComponent: React.FC = () => {
  const {
    activeChannel,
    isMiniPlayerVisible,
    isPlaying,
    isMuted,
    togglePlay,
    toggleMute,
    closePlayer,
  } = usePlayer();

  const navigate = useNavigate();
  const location = useLocation();
  const miniVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // If user is currently on the channel page for this channel, don't show the floating mini player
  const isOnActiveChannelPage = location.pathname === `/channel/${activeChannel?.id}`;

  const isIframe =
    activeChannel?.streamType === 'iframe' ||
    activeChannel?.streamType === 'embed' ||
    activeChannel?.streamUrl.includes('youtube.com/embed') ||
    activeChannel?.streamUrl.includes('player.vimeo.com');

  useEffect(() => {
    if (!activeChannel || isOnActiveChannelPage || !isMiniPlayerVisible || isIframe) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = miniVideoRef.current;
    if (!video) return;

    video.muted = isMuted;
    const playUrl = resolvePlayableStreamUrl(activeChannel.streamUrl);

    if (playUrl.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(playUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) {
          video.play().catch(() => {});
        }
      });
    } else {
      video.src = playUrl;
      if (isPlaying) {
        video.play().catch(() => {});
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, isOnActiveChannelPage, isMiniPlayerVisible, isPlaying, isMuted]);

  if (!activeChannel || isOnActiveChannelPage || !isMiniPlayerVisible) {
    return null;
  }

  const handleReturnToFullPlayer = () => {
    navigate(`/channel/${activeChannel.id}`);
  };

  return (
    <div
      id="streamlive-mini-player"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-40 w-72 sm:w-80 rounded-2xl bg-slate-900/95 border border-indigo-500/40 shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-md flex flex-col group transition-all transform animate-in slide-in-from-bottom-5"
    >
      {/* Video preview with overlay controls */}
      <div className="relative aspect-video w-full bg-black">
        {isIframe ? (
          <div
            onClick={handleReturnToFullPlayer}
            className="w-full h-full relative cursor-pointer group/preview flex items-center justify-center overflow-hidden bg-slate-950"
          >
            <img
              src={activeChannel.logo}
              alt={activeChannel.name}
              className="w-full h-full object-cover opacity-60 group-hover/preview:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-center">
              <span className="text-[11px] font-semibold text-white px-2.5 py-1 rounded-full bg-indigo-600/90 shadow-md">
                Click to Watch Stream
              </span>
            </div>
          </div>
        ) : (
          <video
            ref={miniVideoRef}
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover cursor-pointer"
            onClick={handleReturnToFullPlayer}
          />
        )}

        {/* Top Mini Overlay */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-sm pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              onClick={handleReturnToFullPlayer}
              aria-label="Expand player"
              className="p-1 rounded-md bg-black/60 hover:bg-indigo-600 text-white transition-colors"
              title="Expand to Full Player"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={closePlayer}
              aria-label="Close mini player"
              className="p-1 rounded-md bg-black/60 hover:bg-rose-600 text-white transition-colors"
              title="Close Player"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Mini Controls */}
        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between bg-black/70 backdrop-blur-xs rounded-xl px-2.5 py-1.5 text-xs text-white">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <img
              src={activeChannel.logo}
              alt={activeChannel.name}
              className="w-5 h-5 rounded-md object-cover flex-shrink-0"
            />
            <span className="font-semibold text-xs truncate max-w-[120px]">
              {activeChannel.name}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-1 text-slate-300 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1 text-slate-200 hover:text-white"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MiniPlayer = React.memo(MiniPlayerComponent);
