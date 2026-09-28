export type StreamType = 'hls' | 'dash' | 'mp4' | 'demo' | 'iframe' | 'embed';

export interface Channel {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  streamUrl: string;
  streamType: StreamType;
  country: string;
  countryCode: string;
  language: string;
  languageCode?: string;
  category: string;
  featured: boolean;
  active: boolean;
  viewerCount: number;
  quality?: string;
  resolution?: string;
  website?: string;
  channelNumber?: number;
  isNetTV?: boolean;
  isVerifiedLive?: boolean;
  nettvCategory?: string;
  backupStreamUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Program {
  id: string;
  channelId: string;
  title: string;
  description: string;
  category: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  thumbnail?: string;
  rating?: string;
  seasonEpisode?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  favorites: string[];
  preferredCountry: string;
  preferredLanguage: string;
  role?: 'user' | 'admin';
  createdAt: string;
}

export interface WatchHistoryItem {
  id: string;
  userId?: string;
  channelId: string;
  channelName: string;
  channelLogo: string;
  category: string;
  watchedAt: string; // ISO string
  durationSeconds?: number;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  channelCount?: number;
  gradient: string;
}

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  channelCount?: number;
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  channelCount?: number;
}

export interface FilterOptions {
  category: string;
  country: string;
  language: string;
  searchQuery: string;
  onlyFavorites: boolean;
  sortBy: 'popularity' | 'name' | 'recently_added';
  viewMode: 'grid' | 'list';
}

export interface PlayerQualityLevel {
  id: number;
  height: number;
  bitrate: number;
  name: string;
}

export interface AudioTrackOption {
  id: number;
  name: string;
  lang: string;
  isDefault?: boolean;
}
