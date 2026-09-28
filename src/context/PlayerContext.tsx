import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Channel, PlayerQualityLevel } from '../types';

interface PlayerContextType {
  activeChannel: Channel | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isMiniPlayerVisible: boolean;
  isLoading: boolean;
  playerError: string | null;
  qualityLevels: PlayerQualityLevel[];
  currentQuality: number; // -1 for auto
  playChannel: (channel: Channel, autoStart?: boolean) => void;
  pauseChannel: () => void;
  resumeChannel: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  setQuality: (levelIndex: number) => void;
  setQualityLevels: (levels: PlayerQualityLevel[]) => void;
  setIsLoading: (loading: boolean) => void;
  setPlayerError: (error: string | null) => void;
  showMiniPlayer: () => void;
  hideMiniPlayer: () => void;
  closePlayer: () => void;
  registerVideoElement: (el: HTMLVideoElement | null) => void;
  videoElement: HTMLVideoElement | null;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.9);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<PlayerQualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const registerVideoElement = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.volume = volume;
      el.muted = isMuted;
    }
  }, [volume, isMuted]);

  const playChannel = useCallback((channel: Channel, autoStart: boolean = true) => {
    setActiveChannel(channel);
    setPlayerError(null);
    setIsLoading(true);
    setIsPlaying(autoStart);
    setIsMiniPlayerVisible(false);
  }, []);

  const pauseChannel = useCallback(() => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const resumeChannel = useCallback(() => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseChannel();
    } else {
      resumeChannel();
    }
  }, [isPlaying, pauseChannel, resumeChannel]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) {
        videoRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      if (clamped > 0 && isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  }, [isMuted]);

  const setQuality = useCallback((levelIndex: number) => {
    setCurrentQuality(levelIndex);
  }, []);

  const showMiniPlayer = useCallback(() => {
    if (activeChannel) {
      setIsMiniPlayerVisible(true);
    }
  }, [activeChannel]);

  const hideMiniPlayer = useCallback(() => {
    setIsMiniPlayerVisible(false);
  }, []);

  const closePlayer = useCallback(() => {
    pauseChannel();
    setActiveChannel(null);
    setIsMiniPlayerVisible(false);
    setPlayerError(null);
  }, [pauseChannel]);

  return (
    <PlayerContext.Provider
      value={{
        activeChannel,
        isPlaying,
        isMuted,
        volume,
        isMiniPlayerVisible,
        isLoading,
        playerError,
        qualityLevels,
        currentQuality,
        playChannel,
        pauseChannel,
        resumeChannel,
        togglePlay,
        toggleMute,
        setVolume,
        setQuality,
        setQualityLevels,
        setIsLoading,
        setPlayerError,
        showMiniPlayer,
        hideMiniPlayer,
        closePlayer,
        registerVideoElement,
        videoElement: videoRef.current,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
