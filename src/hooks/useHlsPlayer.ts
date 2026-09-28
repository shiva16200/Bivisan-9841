import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { PlayerQualityLevel, AudioTrackOption } from '../types';

interface UseHlsPlayerProps {
  streamUrl: string;
  backupStreamUrl?: string;
  streamType?: 'hls' | 'dash' | 'mp4' | 'demo' | 'iframe' | 'embed';
  autoPlay?: boolean;
  onQualityLevels?: (levels: PlayerQualityLevel[]) => void;
  onError?: (errMessage: string) => void;
  onReady?: () => void;
}

export function resolvePlayableStreamUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.includes('fifa26') ||
    trimmed.includes('HimalayaSports') ||
    trimmed.includes('himalayan-sports') ||
    trimmed.includes('h-sports') ||
    trimmed.includes('fifa.m3u8')
  ) {
    return '/fifa26/HimalayaSportsFifa026/playlist.m3u8';
  }
  if (trimmed.startsWith('/api/')) return trimmed;
  if (trimmed.includes('.php') || trimmed.includes('.html')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('/api/stream/proxy')) return trimmed;
    return `/api/stream/proxy?url=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

export function useHlsPlayer({
  streamUrl,
  backupStreamUrl,
  streamType = 'hls',
  autoPlay = true,
  onQualityLevels,
  onError,
  onReady,
}: UseHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<PlayerQualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState<string>(streamUrl);
  const [isBackupActive, setIsBackupActive] = useState<boolean>(false);
  const [isLowDataMode, setIsLowDataMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('streamlive_low_data_mode');
      return saved === 'true';
    }
    return false;
  });

  const toggleLowDataMode = useCallback(() => {
    setIsLowDataMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('streamlive_low_data_mode', String(next));
      }
      return next;
    });
  }, []);

  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bufferingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayPendingRef = useRef<boolean>(false);
  const watchdogIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCurrentTimeRef = useRef<number>(0);
  const freezeCounterRef = useRef<number>(0);

  // Multi-Audio Track State
  const [audioTracks, setAudioTracks] = useState<AudioTrackOption[]>([
    { id: 0, name: 'Default Audio (Original)', lang: 'Original', isDefault: true },
    { id: 1, name: 'Nepali Commentary (नेपाली)', lang: 'ne' },
    { id: 2, name: 'English Commentary', lang: 'en' },
    { id: 3, name: 'Hindi Commentary (हिन्दी)', lang: 'hi' },
  ]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(0);

  // DVR / Instant Rewind & Catch-up State
  const [isAtLiveEdge, setIsAtLiveEdge] = useState<boolean>(true);
  const [liveEdgeDelay, setLiveEdgeDelay] = useState<number>(0);

  // Sync activeUrl when streamUrl prop changes
  useEffect(() => {
    setActiveUrl(streamUrl);
    setIsBackupActive(false);
    retryCountRef.current = 0;
  }, [streamUrl]);

  const cleanup = useCallback(() => {
    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }
    if (watchdogIntervalRef.current) {
      clearInterval(watchdogIntervalRef.current);
      watchdogIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, []);

  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');

  const setQuality = useCallback((target: string) => {
    setSelectedQuality(target);

    if (!hlsRef.current) return;

    if (target.toLowerCase() === 'auto') {
      hlsRef.current.currentLevel = -1;
      hlsRef.current.autoLevelCapping = -1;
      setCurrentLevel(-1);
      return;
    }

    const heightNum = parseInt(target.replace('p', ''), 10);
    if (isNaN(heightNum)) return;

    const levels = hlsRef.current.levels;
    if (levels && levels.length > 0) {
      let closestIdx = 0;
      let minDiff = Infinity;
      levels.forEach((lvl, idx) => {
        const h = lvl.height || 720;
        const diff = Math.abs(h - heightNum);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      hlsRef.current.currentLevel = closestIdx;
      hlsRef.current.autoLevelCapping = closestIdx;
      setCurrentLevel(closestIdx);
    }
  }, []);

  const changeQuality = useCallback((levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
    }
  }, []);

  const setAudioTrack = useCallback((trackId: number) => {
    setSelectedAudioTrack(trackId);
    if (hlsRef.current && hlsRef.current.audioTracks && hlsRef.current.audioTracks.length > trackId) {
      try {
        hlsRef.current.audioTrack = trackId;
      } catch (err) {
        console.warn('Error setting HLS audio track:', err);
      }
    }
  }, []);

  // DVR: 10s Rewind (or custom seconds)
  const rewindSeconds = useCallback((seconds: number = 10) => {
    const video = videoRef.current;
    if (!video) return;
    const seekable = video.seekable;
    const start = seekable.length > 0 ? seekable.start(0) : 0;
    const target = Math.max(start, video.currentTime - seconds);
    video.currentTime = target;
    setIsAtLiveEdge(false);
  }, []);

  // DVR: Seek back to Real-Time Live Edge
  const seekToLive = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const seekable = video.seekable;
    if (seekable.length > 0) {
      const end = seekable.end(seekable.length - 1);
      video.currentTime = Math.max(0, end - 1.2);
    }
    setIsAtLiveEdge(true);
    setLiveEdgeDelay(0);
  }, []);

  const triggerAutoplayWithFallback = useCallback((video: HTMLVideoElement) => {
    if (!autoPlay || !video) return;

    // Guarantee muted autoplay compliance immediately
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', 'true');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    try {
      const playPromise = video.play();
      if (playPromise !== undefined && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch(() => {
            // Silently attach user interaction listener for instant start on tap/click
            const resumeOnInteraction = () => {
              video.muted = true;
              video.play().then(() => {
                setIsPlaying(true);
                setIsBuffering(false);
              }).catch(() => {});
              window.removeEventListener('touchstart', resumeOnInteraction);
              window.removeEventListener('click', resumeOnInteraction);
              window.removeEventListener('keydown', resumeOnInteraction);
            };
            window.addEventListener('touchstart', resumeOnInteraction, { once: true, passive: true });
            window.addEventListener('click', resumeOnInteraction, { once: true, passive: true });
            window.addEventListener('keydown', resumeOnInteraction, { once: true, passive: true });
          });
      }
    } catch {
      // ignore
    }
  }, [autoPlay]);

  const switchToBackup = useCallback(() => {
    if (backupStreamUrl && activeUrl !== backupStreamUrl) {
      console.warn('Primary stream failed, seamlessly switching to backup stream:', backupStreamUrl);
      setIsBackupActive(true);
      setActiveUrl(backupStreamUrl);
      setErrorMessage(null);
      setIsBuffering(true);
    }
  }, [backupStreamUrl, activeUrl]);

  const setupPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !activeUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setErrorMessage(null);
    setIsBuffering(false);

    if (
      streamType === 'iframe' ||
      streamType === 'embed' ||
      activeUrl.includes('.php') ||
      activeUrl.includes('.html')
    ) {
      setIsBuffering(false);
      setIsPlaying(true);
      onReady?.();
      return;
    }

    const isHlsStream = activeUrl.includes('.m3u8') || streamType === 'hls';
    const finalPlayUrl = resolvePlayableStreamUrl(activeUrl);

    // Detect mobile device for performance optimization
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isHlsStream && Hls.isSupported()) {
      // Highly optimized HLS configuration for instantaneous playback, even on 512 kbps mobile networks
      const hls = new Hls({
        enableWorker: true,
        progressive: true, // Enables fast parallel progressive parsing
        lowLatencyMode: false, // Ensures solid continuous streaming without chunk underrun
        liveSyncDurationCount: isLowDataMode ? 2.0 : 2.5,
        liveMaxLatencyDurationCount: 6.0,
        // Tuned buffer size: avoids downloading 30s ahead on 512 kbps which starves the connection
        maxBufferLength: isLowDataMode ? 6 : (isMobile ? 10 : 20),
        maxMaxBufferLength: isLowDataMode ? 12 : (isMobile ? 20 : 40),
        backBufferLength: 8,
        maxBufferSize: isLowDataMode ? 4 * 1024 * 1024 : (isMobile ? 10 * 1024 * 1024 : 30 * 1024 * 1024),
        maxBufferHole: 1.5, // Smoothly jumps tiny network transmission gaps on 512k
        maxFragLookUpTolerance: 0.4,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.2,
        nudgeMaxRetry: 10,
        // Adaptive Bitrate tuned for 512 kbps connections
        startLevel: isLowDataMode ? 0 : -1,
        abrEwmaDefaultEstimate: isLowDataMode ? 350000 : 450000,
        abrBandWidthFactor: 0.80, // Safe conservative factor: downshifts fast if 512k dips
        abrBandWidthUpFactor: 0.70, // Only scales up when network genuinely sustains higher bandwidth
        abrMaxWithRealBitrate: true,
        capLevelToPlayerSize: isMobile || isLowDataMode, // On mobile/low-data, cap resolution to save bandwidth
        startFragPrefetch: true, // Eagerly pre-fetches next fragments ahead of time
        testBandwidth: false,
        // Increased timeout to 45s: on 512 kbps a 3MB segment takes ~45s, so HLS must NOT prematurely abort!
        fragLoadingTimeOut: 45000,
        manifestLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 12,
        fragLoadingRetryDelay: 400,
        manifestLoadingMaxRetry: 10,
        manifestLoadingRetryDelay: 400,
        levelLoadingMaxRetry: 10,
        appendErrorMaxRetry: 8,
      });

      hlsRef.current = hls;
      hls.loadSource(finalPlayUrl);
      hls.attachMedia(video);

      // Autonomous Playback Watchdog: monitors actual playback health gently and un-sticks freezes automatically
      if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
      lastCurrentTimeRef.current = video.currentTime;
      freezeCounterRef.current = 0;

      watchdogIntervalRef.current = setInterval(() => {
        if (!video || video.paused || video.ended || video.readyState < 1) {
          if (video) lastCurrentTimeRef.current = video.currentTime;
          return;
        }

        const isTimeFrozen = Math.abs(video.currentTime - lastCurrentTimeRef.current) < 0.04;

        if (isTimeFrozen) {
          freezeCounterRef.current += 1;

          // Quick recovery if frozen for ~4 seconds: unstick buffer and seek to live edge
          if (freezeCounterRef.current === 2) {
            const seekable = video.seekable;
            if (seekable && seekable.length > 0) {
              const liveEnd = seekable.end(seekable.length - 1);
              if (liveEnd - video.currentTime > 4) {
                video.currentTime = Math.max(0, liveEnd - 1.5);
              } else {
                video.currentTime += 0.1;
              }
            }
            if (hlsRef.current) {
              hlsRef.current.startLoad();
            }
            video.play().catch(() => {});
          }

          // Gentle reload trigger if frozen for ~6 seconds
          if (freezeCounterRef.current === 3) {
            if (hlsRef.current) {
              hlsRef.current.startLoad();
            }
            video.play().catch(() => {});
          }

          // If truly frozen > 12s, switch to backup stream if available
          if (freezeCounterRef.current >= 6) {
            if (backupStreamUrl && !isBackupActive) {
              console.warn('Watchdog detected prolonged freeze, auto-failing over to backup stream');
              switchToBackup();
              return;
            }
            freezeCounterRef.current = 0;
          }
        } else {
          // Playback is running smoothly
          freezeCounterRef.current = 0;
          setIsBuffering(false);
          setIsPlaying(true);
          setHasStarted(true);
          lastCurrentTimeRef.current = video.currentTime;
        }
      }, 2000);

      const handleVideoWaiting = () => {
        if (hlsRef.current) hlsRef.current.startLoad();
        // Debounce visible buffering state so micro-decoding pauses don't flash loading spinner
        if (!bufferingTimeoutRef.current) {
          bufferingTimeoutRef.current = setTimeout(() => {
            setIsBuffering(true);
          }, 1200);
        }
      };
      const handleVideoPlaying = () => {
        if (bufferingTimeoutRef.current) {
          clearTimeout(bufferingTimeoutRef.current);
          bufferingTimeoutRef.current = null;
        }
        setIsBuffering(false);
        setIsPlaying(true);
        setHasStarted(true);
        freezeCounterRef.current = 0;
      };
      const handleVideoTimeUpdate = () => {
        if (bufferingTimeoutRef.current) {
          clearTimeout(bufferingTimeoutRef.current);
          bufferingTimeoutRef.current = null;
        }
        const seekable = video.seekable;
        if (seekable && seekable.length > 0) {
          const end = seekable.end(seekable.length - 1);
          const delay = Math.max(0, end - video.currentTime);
          setLiveEdgeDelay(Math.round(delay));
          setIsAtLiveEdge(delay <= 4.0);
        }
      };

      video.addEventListener('waiting', handleVideoWaiting);
      video.addEventListener('stalled', handleVideoWaiting);
      video.addEventListener('playing', handleVideoPlaying);
      video.addEventListener('timeupdate', handleVideoTimeUpdate);

      const onCanPlay = () => {
        if (bufferingTimeoutRef.current) {
          clearTimeout(bufferingTimeoutRef.current);
          bufferingTimeoutRef.current = null;
        }
        setIsBuffering(false);
        setHasStarted(true);
        triggerAutoplayWithFallback(video);
      };
      video.addEventListener('canplay', onCanPlay, { once: true });

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        if (bufferingTimeoutRef.current) {
          clearTimeout(bufferingTimeoutRef.current);
          bufferingTimeoutRef.current = null;
        }
        setIsBuffering(false);
        setHasStarted(true);
        retryCountRef.current = 0;
        const levels: PlayerQualityLevel[] = data.levels.map((lvl, index) => ({
          id: index,
          height: lvl.height || 720,
          bitrate: lvl.bitrate || 0,
          name: lvl.height ? `${lvl.height}p` : `Level ${index + 1}`,
        }));

        setQualityLevels(levels);
        onQualityLevels?.(levels);

        // Populate audio tracks if stream has multiple tracks
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          const parsedTracks: AudioTrackOption[] = hls.audioTracks.map((t, idx) => ({
            id: idx,
            name: t.name || (t.lang === 'ne' ? 'Nepali (नेपाली)' : t.lang === 'hi' ? 'Hindi (हिन्दी)' : t.lang === 'en' ? 'English' : `Track ${idx + 1}`),
            lang: t.lang || '',
            isDefault: t.default,
          }));
          setAudioTracks(parsedTracks);
          setSelectedAudioTrack(hls.audioTrack >= 0 ? hls.audioTrack : 0);
        }

        onReady?.();
        triggerAutoplayWithFallback(video);
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          const parsedTracks: AudioTrackOption[] = data.audioTracks.map((t, idx) => ({
            id: idx,
            name: t.name || (t.lang === 'ne' ? 'Nepali (नेपाली)' : t.lang === 'hi' ? 'Hindi (हिन्दी)' : t.lang === 'en' ? 'English' : `Track ${idx + 1}`),
            lang: t.lang || '',
            isDefault: t.default,
          }));
          setAudioTracks(parsedTracks);
          setSelectedAudioTrack(hls.audioTrack >= 0 ? hls.audioTrack : 0);
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentLevel(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) {
          if (
            data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR ||
            data.details === Hls.ErrorDetails.BUFFER_NUDGE_ON_STALL ||
            data.details === Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE
          ) {
            try {
              if (video && video.paused && video.readyState >= 2) {
                video.play().catch(() => {});
              }
              hls.startLoad();
            } catch {
              // ignore
            }
          }
          return;
        }

        // Fatal Error Handler - self-heal or failover seamlessly to backup stream!
        console.warn('HLS Fatal Error encountered:', data.details);
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('Recovering from network error on current channel...');
            if (retryCountRef.current < 3) {
              retryCountRef.current += 1;
              hls.startLoad();
            } else if (backupStreamUrl && !isBackupActive) {
              console.warn('Failing over to backup stream URL after network retries:', backupStreamUrl);
              switchToBackup();
            } else {
              // Cache-bust retry after 1.5 seconds on the SAME channel
              retryTimeoutRef.current = setTimeout(() => {
                retryCountRef.current = 0;
                hls.loadSource(finalPlayUrl + (finalPlayUrl.includes('?') ? '&' : '?') + `_r=${Date.now()}`);
                hls.startLoad();
              }, 1500);
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('Recovering from media error on current channel...');
            hls.recoverMediaError();
            break;
          default:
            console.error('Fatal playback error, self-healing current channel:', data.details);
            if (backupStreamUrl && !isBackupActive) {
              switchToBackup();
            } else {
              retryTimeoutRef.current = setTimeout(() => {
                retryCountRef.current = 0;
                setErrorMessage(null);
                setupPlayer();
              }, 2000);
            }
            break;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isHlsStream) {
      // Native Apple Safari / iOS HLS (Hardware accelerated)
      video.src = finalPlayUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsBuffering(false);
        onReady?.();
        triggerAutoplayWithFallback(video);
      });
      video.addEventListener('error', () => {
        if (backupStreamUrl && !isBackupActive) {
          switchToBackup();
        } else {
          retryTimeoutRef.current = setTimeout(() => {
            setupPlayer();
          }, 2500);
        }
      });
    } else {
      // Standard HTML5 video
      video.src = activeUrl;
      video.addEventListener('loadeddata', () => {
        setIsBuffering(false);
        onReady?.();
        triggerAutoplayWithFallback(video);
      });
      video.addEventListener('error', () => {
        if (backupStreamUrl && !isBackupActive) {
          switchToBackup();
        } else {
          retryTimeoutRef.current = setTimeout(() => {
            setupPlayer();
          }, 2500);
        }
      });
    }
  }, [activeUrl, streamType, triggerAutoplayWithFallback, onQualityLevels, onError, onReady, backupStreamUrl, isBackupActive, switchToBackup, isLowDataMode]);

  const retryPlayback = useCallback(() => {
    setErrorMessage(null);
    setIsBuffering(true);
    cleanup();
    setupPlayer();
  }, [cleanup, setupPlayer]);

  useEffect(() => {
    setupPlayer();
    return () => {
      cleanup();
    };
  }, [setupPlayer, cleanup]);

  return {
    videoRef,
    isBuffering,
    isPlaying,
    hasStarted,
    qualityLevels,
    currentLevel,
    selectedQuality,
    setQuality,
    changeQuality,
    audioTracks,
    selectedAudioTrack,
    setAudioTrack,
    isAtLiveEdge,
    liveEdgeDelay,
    rewindSeconds,
    seekToLive,
    errorMessage,
    isBackupActive,
    isLowDataMode,
    toggleLowDataMode,
    activeUrl,
    switchToBackup,
    retryPlayback,
    setIsBuffering,
    setIsPlaying,
  };
}
