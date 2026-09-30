import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture,
  Heart,
  RefreshCw,
  Radio,
  Scan,
  SlidersHorizontal,
  Check,
  RotateCcw,
  RotateCw,
  Smartphone,
  Headphones,
  ShieldCheck,
  Sun,
  Maximize2,
  Zap,
} from 'lucide-react';
import { Channel, Program } from '../../types';

const QUALITY_PRESETS = [
  { value: 'Auto', label: 'Auto', badge: 'Adaptive' },
  { value: '1080p', label: '1080p', badge: 'FHD' },
  { value: '720p', label: '720p', badge: 'HD' },
  { value: '480p', label: '480p' },
  { value: '360p', label: '360p' },
  { value: '240p', label: '240p' },
  { value: '144p', label: '144p', badge: 'Saver' },
];
import { useHlsPlayer } from '../../hooks/useHlsPlayer';
import { usePlayer } from '../../context/PlayerContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useHistory } from '../../context/HistoryContext';
import { RealtimeViewerBadge } from '../common/RealtimeViewerBadge';
import { incrementChannelView } from '../../services/viewCounterService';

export type ScreenFitMode = 'contain' | 'cover' | 'fill' | 'zoom' | '16-9' | '4-3';

interface LivePlayerProps {
  channel: Channel;
  currentProgram?: Program | null;
  nextProgram?: Program | null;
  autoPlay?: boolean;
  minimalInline?: boolean;
}

export const LivePlayer: React.FC<LivePlayerProps> = ({
  channel,
  currentProgram,
  nextProgram,
  autoPlay = true,
  minimalInline = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToHistory } = useHistory();
  const { registerVideoElement } = usePlayer();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCssFullscreen, setIsCssFullscreen] = useState(false);

  // Aspect Ratio & Fit Modes (Fit, Fill, Stretch)
  const [fitMode, setFitMode] = useState<ScreenFitMode>('cover');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [fitHudMessage, setFitHudMessage] = useState<string | null>(null);
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const suppressNativePauseRef = useRef<boolean>(false);
  
  // Start with muted sound on website load for guaranteed autoplay
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Touch tracking for pinch-to-zoom if user pinches
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1.0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isPinchingRef = useRef<boolean>(false);

  // Touch Gestures on Mobile / Fullscreen: Left side = Brightness, Right side = Sound / Volume
  const [brightness, setBrightness] = useState<number>(1.0);
  const [activeGesture, setActiveGesture] = useState<'brightness' | 'volume' | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartYRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchStartSideRef = useRef<'left' | 'right' | null>(null);
  const touchStartValueRef = useRef<number>(0);
  const isSideDraggingRef = useRef<boolean>(false);
  const suppressClickUntilRef = useRef<number>(0);

  const {
    videoRef,
    isBuffering,
    isPlaying,
    hasStarted,
    errorMessage,
    selectedQuality,
    setQuality,
    qualityLevels,
    audioTracks,
    selectedAudioTrack,
    setAudioTrack,
    isAtLiveEdge,
    liveEdgeDelay,
    rewindSeconds,
    seekToLive,
    isBackupActive,
    isLowDataMode,
    toggleLowDataMode,
    retryPlayback,
    setIsPlaying,
  } = useHlsPlayer({
    streamUrl: channel.streamUrl,
    backupStreamUrl: channel.backupStreamUrl,
    streamType: channel.streamType,
    autoPlay,
  });

  const isIframeStream =
    channel.streamType === 'iframe' ||
    channel.streamType === 'embed' ||
    channel.streamUrl.includes('.php') ||
    channel.streamUrl.includes('.html');

  const isFav = isFavorite(channel.id);

  // Enforce initial muted autoplay state on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.setAttribute('muted', 'true');
      videoRef.current.setAttribute('playsinline', 'true');
    }
  }, [videoRef]);

  // Register video element for global picture-in-picture / mini-player
  useEffect(() => {
    if (videoRef.current) {
      registerVideoElement(videoRef.current);
    }
  }, [videoRef, registerVideoElement]);

  // Track viewing history and increment view count
  useEffect(() => {
    addToHistory(channel);
    incrementChannelView(channel.id, channel.viewerCount);
  }, [channel, addToHistory]);

  // Fullscreen listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
      if (!isFs && isCssFullscreen) {
        setIsCssFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isCssFullscreen]);

  // Handle ESC key to exit CSS fullscreen
  useEffect(() => {
    const handleKeyDownEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCssFullscreen) {
          setIsCssFullscreen(false);
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDownEsc);
    return () => window.removeEventListener('keydown', handleKeyDownEsc);
  }, [isCssFullscreen]);

  const showHud = useCallback((msg: string) => {
    setFitHudMessage(msg);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => setFitHudMessage(null), 1800);
  }, []);

  // Keep player controls visible on interaction and auto-hide cleanly after idle
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  }, []);

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      suppressNativePauseRef.current = false;
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    resetControlsTimer();
  };

  // Sound toggle (unmutes cleanly when clicked)
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      const activeVol = volume > 0 ? volume : 0.85;
      videoRef.current.volume = activeVol;
      setVolume(activeVol);
    }
    resetControlsTimer();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      const willMute = val === 0;
      videoRef.current.muted = willMute;
      setIsMuted(willMute);
    }
    resetControlsTimer();
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen && !isCssFullscreen) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
          setIsFullscreen(true);
        } else if ((container as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          await (container as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
          setIsFullscreen(true);
        } else {
          setIsCssFullscreen(true);
          setIsFullscreen(true);
        }
      } catch {
        setIsCssFullscreen(true);
        setIsFullscreen(true);
      }
    } else {
      try {
        if (document.exitFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        } else if (
          (document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen &&
          (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
        ) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        }
      } catch {
        // ignore
      }
      setIsCssFullscreen(false);
      setIsFullscreen(false);
    }
    resetControlsTimer();
  };

  // PiP toggle
  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // ignore
    }
    resetControlsTimer();
  };

  // Video Quality Selection (144p to 1080p, Auto)
  const handleSelectQuality = (qualityLabel: string) => {
    setQuality(qualityLabel);
    setShowQualityMenu(false);
    showHud(`Quality: ${qualityLabel}`);
    resetControlsTimer();
  };

  // Screen Fit Mode Cycle (Edge-to-Edge Notch Cover -> Zoom 120% -> Stretch -> Fit)
  const cycleFitMode = () => {
    setFitMode((prev) => {
      let next: ScreenFitMode;
      if (prev === 'cover') {
        next = 'zoom';
      } else if (prev === 'zoom') {
        next = 'fill';
      } else if (prev === 'fill') {
        next = 'contain';
      } else {
        next = 'cover';
      }
      const labels: Record<ScreenFitMode, string> = {
        cover: '📱 Edge-to-Edge (Covers Notch)',
        zoom: '🔍 Zoom 120% (Full Bleed)',
        fill: '📐 Stretch Full Screen',
        contain: '📺 Fit to Screen (Letterbox)',
        '16-9': '🎬 16:9 Widescreen',
        '4-3': '📻 4:3 Standard TV',
      };
      showHud(labels[next]);
      return next;
    });
    resetControlsTimer();
  };

  // Mouse wheel zoom support for desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || isFullscreen || isCssFullscreen) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoomLevel((prev) => {
        const next = Math.min(3.0, Math.max(1.0, Number((prev + delta).toFixed(2))));
        if (next <= 1.05) {
          setPanOffset({ x: 0, y: 0 });
        }
        showHud(`🔍 Zoom: ${Math.round(next * 100)}%`);
        return next;
      });
    }
  };

  // Touch handlers for mobile: Left side vertical drag = Brightness, Right side = Sound, Pinch = Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      isSideDraggingRef.current = false;
      setActiveGesture(null);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
      touchStartZoomRef.current = zoomLevel;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        touchStartXRef.current = touch.clientX;
        touchStartYRef.current = touch.clientY;
        const isLeft = touch.clientX < rect.left + rect.width / 2;
        touchStartSideRef.current = isLeft ? 'left' : 'right';
        touchStartValueRef.current = isLeft ? brightness : (isMuted ? 0 : volume);
        isSideDraggingRef.current = false;
      }
      touchStartPosRef.current = { x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / touchStartDistRef.current;
      const newZoom = Math.min(3.0, Math.max(1.0, touchStartZoomRef.current * ratio));
      const rounded = Number(newZoom.toFixed(2));
      setZoomLevel(rounded);
      showHud(`🔍 Zoom: ${Math.round(rounded * 100)}%`);
    } else if (e.touches.length === 1 && !isPinchingRef.current) {
      const touch = e.touches[0];
      const deltaY = touchStartYRef.current - touch.clientY; // Upwards = positive (increase)
      const deltaX = Math.abs(touch.clientX - touchStartXRef.current);
      const absDeltaY = Math.abs(deltaY);

      // Detect vertical swipe on side (fullscreen or mobile landscape/portrait)
      if (absDeltaY > 8 && absDeltaY > deltaX * 1.1) {
        isSideDraggingRef.current = true;
        const rect = containerRef.current?.getBoundingClientRect();
        const height = rect?.height || 320;
        const changePercent = (deltaY / height) * 1.3;

        if (touchStartSideRef.current === 'left') {
          // Left Side: Brightness (0.2x to 1.6x)
          const newB = Math.min(1.6, Math.max(0.2, touchStartValueRef.current + changePercent));
          const roundedB = Number(newB.toFixed(2));
          setBrightness(roundedB);
          setActiveGesture('brightness');
        } else if (touchStartSideRef.current === 'right') {
          // Right Side: Sound / Volume (0.0 to 1.0)
          const newV = Math.min(1.0, Math.max(0.0, touchStartValueRef.current + changePercent));
          const roundedV = Number(newV.toFixed(2));
          setVolume(roundedV);
          if (videoRef.current) {
            videoRef.current.volume = roundedV;
            if (roundedV > 0 && isMuted) {
              videoRef.current.muted = false;
              setIsMuted(false);
            } else if (roundedV === 0 && !isMuted) {
              videoRef.current.muted = true;
              setIsMuted(true);
            }
          }
          setActiveGesture('volume');
        }

        if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
        gestureTimeoutRef.current = setTimeout(() => {
          setActiveGesture(null);
        }, 1200);
      } else if (zoomLevel > 1.05 && touchStartPosRef.current && !isSideDraggingRef.current) {
        const newX = touch.clientX - touchStartPosRef.current.x;
        const newY = touch.clientY - touchStartPosRef.current.y;
        setPanOffset({ x: newX, y: newY });
      }
    }
  };

  const handleTouchEnd = () => {
    isPinchingRef.current = false;
    touchStartDistRef.current = null;
    touchStartPosRef.current = null;
    touchStartSideRef.current = null;

    if (isSideDraggingRef.current) {
      suppressClickUntilRef.current = Date.now() + 400;
      setTimeout(() => {
        isSideDraggingRef.current = false;
      }, 60);
    }

    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => {
      setActiveGesture(null);
    }, 900);

    if (zoomLevel < 1.05) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  // Container click handler with double-tap support for mobile
  const handleContainerClick = (e: React.MouseEvent) => {
    if (Date.now() < suppressClickUntilRef.current || isSideDraggingRef.current) {
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.player-control-tool')) {
      return;
    }

    if (showQualityMenu) {
      setShowQualityMenu(false);
    }
    if (showAudioMenu) {
      setShowAudioMenu(false);
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected: cycle screen fit mode
      cycleFitMode();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // Screen click ONLY toggles controls - NEVER play/pause on screen click!
    setShowControls((prev) => {
      const next = !prev;
      if (next) {
        resetControlsTimer();
      }
      return next;
    });
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleMute();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      cycleFitMode();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      retryPlayback();
      showHud('🔄 Stream Reconnected');
    } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
      e.preventDefault();
      rewindSeconds(10);
      showHud('⏪ Rewound 10s (Catch-up)');
    } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      seekToLive();
      showHud('🔴 Real-time Live Stream');
    }
  };

  // Compute CSS classes based on fitMode
  const getVideoClasses = () => {
    if (fitMode === 'cover') return 'object-cover w-full h-full scale-[1.01]';
    if (fitMode === 'zoom') return 'object-cover w-full h-full scale-125';
    if (fitMode === 'fill') return 'object-fill w-full h-full';
    if (fitMode === '16-9') return 'object-contain aspect-video';
    if (fitMode === '4-3') return 'object-contain aspect-[4/3]';
    return 'object-contain w-full h-full';
  };

  // Only apply CSS transform when zoomed/panned to avoid rendering overhead and lag on mobile
  const videoTransformStyle: React.CSSProperties = {
    ...(zoomLevel > 1.05 || panOffset.x !== 0 || panOffset.y !== 0
      ? {
          transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
          transformOrigin: 'center center',
          transition: isPinchingRef.current ? 'none' : 'transform 150ms ease-out',
        }
      : {}),
    filter: brightness !== 1.0 ? `brightness(${brightness})` : undefined,
  };

  // Fullscreen container style for seamless edge-to-edge viewing
  const fullscreenContainerStyle: React.CSSProperties =
    isFullscreen || isCssFullscreen
      ? {
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
        }
      : {};

  const isExpanded = isFullscreen || isCssFullscreen || !minimalInline;

  return (
    <div
      ref={containerRef}
      id={`live-player-container-${channel.id}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleContainerClick}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(true)}
      onWheel={handleWheel}
      style={fullscreenContainerStyle}
      className={`${
        isCssFullscreen || isFullscreen
          ? 'fixed inset-0 z-[100] w-screen h-screen min-w-full min-h-full rounded-none border-0'
          : 'relative w-full h-[36vh] min-h-[250px] xs:h-[42vh] xs:min-h-[285px] sm:h-auto sm:aspect-video rounded-none sm:rounded-3xl border-0 sm:border border-slate-800'
      } bg-black overflow-hidden shadow-2xl group focus:outline-none select-none`}
    >
      {/* Top Header Overlay: In minimal inline mode, only Views count is displayed; in fullscreen all details appear */}
      <div
        className={`absolute top-0 inset-x-0 p-3 sm:p-5 pt-[max(0.75rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] bg-gradient-to-b from-black/90 via-black/40 to-transparent z-20 transition-opacity duration-300 flex items-center justify-between pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {isExpanded ? (
          <div className="flex items-center gap-2.5 pointer-events-auto">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover bg-slate-900 border border-white/10"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                {channel.name.charAt(0)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-sm sm:text-base drop-shadow-md leading-tight">
                  {channel.name}
                </h3>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </span>
              </div>

              {currentProgram && (
                <p className="text-xs text-slate-300 drop-shadow line-clamp-1">
                  {currentProgram.title}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 pointer-events-auto ml-auto">
          <RealtimeViewerBadge
            channelId={channel.id}
            initialCount={channel.viewerCount}
            variant="pill"
          />

          {isExpanded && (
            <button
              id="player-favorite-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(channel.id);
              }}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
                isFav
                  ? 'bg-rose-600/80 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-black/40 hover:bg-black/60 text-slate-300 border border-white/10'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFav ? 'fill-white' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Primary Video Container */}
      {isIframeStream ? (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          <iframe
            src={channel.streamUrl}
            title={channel.name}
            className={`w-full h-full border-0 bg-black ${
              fitMode === 'cover' ? 'scale-105 origin-center' : ''
            }`}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            id={`video-element-${channel.id}`}
            muted={isMuted}
            playsInline={true}
            autoPlay={true}
            controls={false}
            preload="auto"
            style={videoTransformStyle}
            className={`w-full h-full ${getVideoClasses()} bg-black pointer-events-none transition-[object-fit] duration-200`}
            onPlay={() => setIsPlaying(true)}
            onPlaying={() => setIsPlaying(true)}
            onVolumeChange={() => {
              if (videoRef.current) {
                setIsMuted(videoRef.current.muted);
                setVolume(videoRef.current.volume);
              }
            }}
            onPause={() => {
              if (suppressNativePauseRef.current && isPlaying) {
                videoRef.current?.play().catch(() => {});
                return;
              }
              setIsPlaying(false);
            }}
          />
        </div>
      )}

      {/* Mobile Touch Gesture HUD: Left (Brightness), Right (Sound / Volume) */}
      {activeGesture && (
        <div className="absolute inset-y-0 inset-x-4 sm:inset-x-8 pointer-events-none z-40 flex items-center justify-between">
          {/* Left Side: Brightness Indicator */}
          {activeGesture === 'brightness' ? (
            <div className="flex flex-col items-center bg-black/85 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-100 text-white min-w-[58px]">
              <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mb-2 animate-pulse" />
              <div className="w-2 sm:w-2.5 h-28 bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end p-0.5 mb-2">
                <div
                  className="w-full bg-gradient-to-t from-amber-500 to-yellow-300 rounded-full transition-all duration-75"
                  style={{ height: `${Math.min(100, Math.max(10, Math.round((brightness / 1.5) * 100)))}%` }}
                />
              </div>
              <span className="text-[11px] font-black text-amber-300">
                {Math.round(brightness * 100)}%
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Bright</span>
            </div>
          ) : <div />}

          {/* Right Side: Sound / Volume Indicator */}
          {activeGesture === 'volume' ? (
            <div className="flex flex-col items-center bg-black/85 backdrop-blur-md border border-indigo-500/40 rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-100 text-white min-w-[58px] ml-auto">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400 mb-2" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 mb-2" />
              ) : (
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 mb-2" />
              )}
              <div className="w-2 sm:w-2.5 h-28 bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end p-0.5 mb-2">
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full transition-all duration-75"
                  style={{ height: `${isMuted ? 0 : Math.round(volume * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-black text-indigo-300">
                {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Sound</span>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Floating HUD Feedback when switching Screen Mode */}
      {fitHudMessage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 px-4 py-2.5 rounded-2xl bg-black/90 border border-amber-500/40 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <Scan className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
          <span>{fitHudMessage}</span>
        </div>
      )}

      {/* Floating Quick Unmute Action Badge: only in expanded mode */}
      {isMuted && isPlaying && !isBuffering && isExpanded && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute top-16 right-4 sm:right-6 z-30 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-indigo-600 text-white border border-white/20 text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title="Click to Unmute"
        >
          <VolumeX className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Tap to Unmute Audio</span>
          <span className="sm:hidden">Unmute</span>
        </button>
      )}

      {/* Initial Connecting Indicator (only in expanded fullscreen mode to keep inline home screen pristine) */}
      {isBuffering && !hasStarted && !isPlaying && !errorMessage && isExpanded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 pointer-events-none z-20">
          <div className="w-12 h-12 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin mb-3" />
          <div className="text-xs font-bold uppercase tracking-widest text-slate-200">
            Connecting to {channel.name}...
          </div>
        </div>
      )}

      {/* Playback Error Overlay with Instant Reconnect */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center z-30">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mb-4 shadow-xl shadow-rose-950/50">
            <Radio className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-white mb-2">Live Stream Reconnecting</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              retryPlayback();
            }}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Reconnect Now</span>
          </button>
        </div>
      )}

      {/* Tap to Unmute Overlay Button when Playing Muted */}
      {isPlaying && isMuted && !isBuffering && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
            showHud('🔊 Sound Enabled');
          }}
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 hover:bg-slate-900 text-white text-xs font-bold border border-white/20 backdrop-blur-md shadow-xl transition-all active:scale-95 animate-in fade-in cursor-pointer"
          title="Click to Unmute Sound"
        >
          <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>Tap to Unmute</span>
        </button>
      )}

      {/* Clean Single Bottom Controls Bar (Notch / Safe Area aware) */}
      <div
        className={`absolute bottom-0 inset-x-0 p-2.5 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] bg-gradient-to-t from-black/95 via-black/75 to-transparent z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Live Broadcast Timeline Indicator & Catch-Up Bar: only in fullscreen / expanded mode */}
        {isExpanded && (
          <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
            {isAtLiveEdge ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] sm:text-[11px] font-extrabold text-rose-400 uppercase tracking-wider">
                  Live Stream
                </span>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  seekToLive();
                  showHud('🔴 Jumped to Live Stream');
                }}
                title="Click to jump back to real-time live broadcast"
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-extrabold tracking-wider animate-pulse transition-all shadow-md shadow-rose-600/40 flex-shrink-0 cursor-pointer active:scale-95"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>-{liveEdgeDelay}s (Live Sync)</span>
              </button>
            )}

            <div className="h-1 flex-1 bg-slate-800/80 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-400 w-full" />
            </div>

            {isBackupActive && (
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 flex-shrink-0 shadow-sm shadow-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Backup Active</span>
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
          {/* Left Controls: Play/Pause ALWAYS present on homescreen & fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="player-play-toggle"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md active:scale-95 flex-shrink-0 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            {/* 10s DVR Quick Rewind Button: Only shown in Fullscreen / Expanded */}
            {isExpanded && (
              <button
                id="player-rewind-10s"
                onClick={(e) => {
                  e.stopPropagation();
                  rewindSeconds(10);
                  showHud('⏪ Rewound 10s (Catch-up)');
                }}
                aria-label="Rewind 10 seconds"
                title="10s Quick Rewind (Catch-up missed goal/moment)"
                className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-black/50 hover:bg-white/20 border border-white/10 text-white flex items-center gap-1 text-[11px] font-extrabold backdrop-blur-md transition-all active:scale-95 flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>10s</span>
              </button>
            )}

            {/* Volume & Mute Control: Always visible */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-black/50 px-2 py-1 rounded-xl border border-white/10 backdrop-blur-md player-control-tool">
              <button
                id="player-mute-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Click to Unmute' : 'Click to Mute'}
                className="p-1 text-slate-300 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  e.stopPropagation();
                  handleVolumeChange(e);
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label="Volume level"
                className="w-14 sm:w-18 md:w-22 h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {isExpanded && nextProgram && (
              <span className="hidden xl:inline-block text-xs text-slate-400 border-l border-slate-700 pl-3 truncate max-w-xs">
                <span className="text-slate-500">Next:</span> {nextProgram.title}
              </span>
            )}
          </div>

          {/* Right Controls: Audio Selector, Video Quality, Screen Fit Mode (Fullscreen only), plus PiP & Fullscreen (Always) */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            {isExpanded && (
              <>
                {/* Multi-Audio Track Selector (Nepali, English, Hindi, Original) */}
                <div className="relative player-control-tool">
                  <button
                    id="player-audio-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAudioMenu((prev) => !prev);
                      setShowQualityMenu(false);
                      resetControlsTimer();
                    }}
                    aria-label="Select Audio Track"
                    title="Select Commentary / Audio Language"
                    className={`px-2.5 py-1 rounded-xl border text-white font-bold text-xs transition-colors active:scale-95 flex items-center gap-1.5 backdrop-blur-md ${
                      showAudioMenu
                        ? 'bg-amber-600 border-amber-400 text-white'
                        : 'bg-black/50 hover:bg-white/20 border-white/10 text-white'
                    }`}
                  >
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden xs:inline truncate max-w-[70px]">
                      {audioTracks[selectedAudioTrack]?.lang === 'ne'
                        ? 'नेपाली'
                        : audioTracks[selectedAudioTrack]?.lang === 'hi'
                        ? 'हिन्दी'
                        : audioTracks[selectedAudioTrack]?.lang === 'en'
                        ? 'English'
                        : 'Audio'}
                    </span>
                  </button>

                  {/* Audio Track Menu Dropdown */}
                  {showAudioMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-full right-0 mb-2 w-52 rounded-2xl bg-slate-950/95 border border-slate-700/80 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                    >
                      <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
                        <span>Commentary / Audio</span>
                        <span className="text-amber-400 font-semibold">Dual Track</span>
                      </div>
                      <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
                        {audioTracks.map((track) => (
                          <button
                            key={track.id}
                            onClick={() => {
                              setAudioTrack(track.id);
                              setShowAudioMenu(false);
                              showHud(`Audio: ${track.name}`);
                              resetControlsTimer();
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              selectedAudioTrack === track.id
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-bold'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Headphones className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                              <span className="truncate">{track.name}</span>
                            </div>
                            {selectedAudioTrack === track.id && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Quality Selector (144p to 1080p, Auto) */}
                <div className="relative player-control-tool">
                  <button
                    id="player-quality-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQualityMenu((prev) => !prev);
                      setShowAudioMenu(false);
                      resetControlsTimer();
                    }}
                    aria-label="Select Video Quality"
                    title="Video Quality (144p - 1080p)"
                    className={`px-2.5 py-1 rounded-xl border text-white font-bold text-xs transition-colors active:scale-95 flex items-center gap-1.5 backdrop-blur-md ${
                      showQualityMenu
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-black/50 hover:bg-white/20 border-white/10 text-white'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{selectedQuality}</span>
                  </button>

                  {/* Quality Dropdown Menu */}
                  {showQualityMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-full right-0 mb-2 w-52 rounded-2xl bg-slate-950/95 border border-slate-700/80 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                    >
                      <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 flex items-center justify-between">
                        <span>Quality & Speed</span>
                        <span className="text-indigo-400 font-semibold">Adaptive</span>
                      </div>

                      <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
                        {QUALITY_PRESETS.map((q) => (
                          <button
                            key={q.value}
                            onClick={() => handleSelectQuality(q.value)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              selectedQuality === q.value
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{q.label}</span>
                              {q.badge && (
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded border ${
                                    selectedQuality === q.value
                                      ? 'bg-white/20 text-white border-white/30'
                                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                  }`}
                                >
                                  {q.badge}
                                </span>
                              )}
                            </div>
                            {selectedQuality === q.value && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Screen Fit Mode Cycle Button (Fit / Notch / Zoom / Stretch) - Always accessible */}
            <button
              id="player-fit-cycle"
              onClick={(e) => {
                e.stopPropagation();
                cycleFitMode();
              }}
              aria-label="Screen Fit"
              title="Screen Fit: Tap to toggle between Fit (Normal), Notch (Edge-to-Edge), Zoom, Stretch"
              className="px-2 py-1 rounded-xl bg-black/50 hover:bg-white/20 border border-white/10 text-white font-bold text-xs transition-colors active:scale-95 flex items-center gap-1 backdrop-blur-md cursor-pointer flex-shrink-0"
            >
              <Scan className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px]">
                {fitMode === 'cover' ? 'Notch' : fitMode === 'zoom' ? 'Zoom' : fitMode === 'contain' ? 'Fit' : fitMode === 'fill' ? 'Stretch' : fitMode}
              </span>
            </button>

            {/* Picture-in-picture (Always visible) */}
            <button
              id="player-pip-toggle"
              onClick={(e) => {
                e.stopPropagation();
                togglePip();
              }}
              aria-label="Picture in Picture"
              title="Picture-in-Picture"
              className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <PictureInPicture className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Fullscreen Toggle (Always visible) */}
            <button
              id="player-fullscreen-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
              className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
