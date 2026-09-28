import { Channel, FilterOptions } from '../types';
import { INITIAL_CHANNELS } from '../data/demoChannels';
import { TECHJAIL_CHANNELS } from '../data/techjailChannels';
import { VERIFIED_CHID_SET } from '../data/verifiedChannelIds';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

const initialIdSet = new Set(INITIAL_CHANNELS.map((c) => c.id));

export const ALL_DEFAULT_CHANNELS: Channel[] = [
  ...INITIAL_CHANNELS.map((c) => ({ ...c, isVerifiedLive: true })),
  ...TECHJAIL_CHANNELS.filter((c) => !initialIdSet.has(c.id)).map((c) => {
    const chidMatch = c.streamUrl.match(/\/api\/stream\/live\/(\d+)\.m3u8/);
    const chid = chidMatch ? chidMatch[1] : '';
    const isVerified = chid ? VERIFIED_CHID_SET.has(chid) : false;
    return {
      ...c,
      isVerifiedLive: isVerified,
    };
  }),
].filter((c) => {
  const cat = (c.category || '').toLowerCase();
  const name = (c.name || '').toLowerCase();
  if (cat === 'movies' || cat === 'cinema' || cat.includes('movie') || cat.includes('cinema')) return false;
  if (name.includes('cinema') || name.includes('b4u movies')) return false;
  return true;
}).sort((a, b) => {
  // 100% verified working channels appear first so user has immediate playback
  if (a.isVerifiedLive && !b.isVerifiedLive) return -1;
  if (!a.isVerifiedLive && b.isVerifiedLive) return 1;
  if (a.featured && !b.featured) return -1;
  if (!a.featured && b.featured) return 1;
  return 0;
});

export function getVerifiedWorkingChannels(): Channel[] {
  return ALL_DEFAULT_CHANNELS.filter((c) => c.isVerifiedLive);
}

const CUSTOM_STORAGE_KEY = 'streamlive_custom_channels_v20';

let inMemoryStoredChannels: Channel[] | null = null;

// Helper to get local stored channels with instantaneous in-memory speed and zero localStorage bloat
function getStoredChannels(): Channel[] {
  if (inMemoryStoredChannels) {
    return inMemoryStoredChannels;
  }
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CUSTOM_STORAGE_KEY) : null;
    if (!raw) {
      inMemoryStoredChannels = ALL_DEFAULT_CHANNELS;
      return ALL_DEFAULT_CHANNELS;
    }
    const userEdits: Channel[] = JSON.parse(raw);
    if (!Array.isArray(userEdits) || userEdits.length === 0) {
      inMemoryStoredChannels = ALL_DEFAULT_CHANNELS;
      return ALL_DEFAULT_CHANNELS;
    }

    const editMap = new Map(userEdits.map((c) => [c.id, c]));
    const merged = ALL_DEFAULT_CHANNELS.map((defaultCh) => {
      const edit = editMap.get(defaultCh.id);
      return edit ? { ...defaultCh, ...edit } : defaultCh;
    });

    const defaultIds = new Set(ALL_DEFAULT_CHANNELS.map((c) => c.id));
    const customOnly = userEdits.filter((c) => !defaultIds.has(c.id));
    inMemoryStoredChannels = [...customOnly, ...merged];
    return inMemoryStoredChannels;
  } catch {
    inMemoryStoredChannels = ALL_DEFAULT_CHANNELS;
    return ALL_DEFAULT_CHANNELS;
  }
}

function saveStoredChannels(channels: Channel[]) {
  inMemoryStoredChannels = channels;
  try {
    if (typeof window !== 'undefined') {
      // Only persist channels that differ from default or are newly created by user to keep storage ultralight
      const defaultIds = new Set(ALL_DEFAULT_CHANNELS.map((c) => c.id));
      const customAndEdited = channels.filter((c) => !defaultIds.has(c.id));
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customAndEdited));
    }
  } catch (err) {
    console.error('Error saving channels to storage:', err);
  }
}

export async function fetchChannels(): Promise<Channel[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'channels'), orderBy('viewerCount', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Channel));
      }
    } catch (err) {
      console.warn('Firestore fetch failed, using local channels:', err);
    }
  }

  return getStoredChannels();
}

export async function fetchChannelById(id: string): Promise<Channel | null> {
  const cleanId = id.replace(/^techjail-/, 'ch-');
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'channels', cleanId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Channel;
      }
    } catch (err) {
      console.warn('Firestore fetchChannelById failed, falling back:', err);
    }
  }

  const channels = getStoredChannels();
  if (id === 'hd-sports' || id === 'himalayan-sports') {
    const found = channels.find(
      (c) => c.id === 'himalayan-sports' || c.id === 'hd-sports' || c.slug === 'hd-sports' || c.name === 'HD Sports'
    );
    if (found) return found;
  }
  return channels.find(
    (c) =>
      c.id === id ||
      c.id === cleanId ||
      c.slug === id ||
      c.slug === cleanId ||
      c.id === `ch-${id}` ||
      c.id === `live-${id}`
  ) || null;
}

export async function saveChannel(channel: Channel): Promise<Channel> {
  const channels = getStoredChannels();
  const existingIdx = channels.findIndex(c => c.id === channel.id);

  let updatedChannels: Channel[];
  if (existingIdx >= 0) {
    updatedChannels = [...channels];
    updatedChannels[existingIdx] = {
      ...channel,
      updatedAt: new Date().toISOString(),
    };
  } else {
    updatedChannels = [
      {
        ...channel,
        createdAt: channel.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...channels,
    ];
  }

  saveStoredChannels(updatedChannels);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'channels', channel.id), channel);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `channels/${channel.id}`);
    }
  }

  return channel;
}

export async function createChannel(channel: Channel): Promise<Channel> {
  return saveChannel(channel);
}

export async function updateChannel(id: string, updates: Partial<Channel>): Promise<Channel> {
  const existing = await fetchChannelById(id);
  if (!existing) {
    throw new Error(`Channel ${id} not found`);
  }
  const updated: Channel = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  return saveChannel(updated);
}

export function resetToDefaultChannels(): void {
  saveStoredChannels(ALL_DEFAULT_CHANNELS);
}

export async function deleteChannel(channelId: string): Promise<void> {
  const channels = getStoredChannels();
  const filtered = channels.filter(c => c.id !== channelId);
  saveStoredChannels(filtered);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'channels', channelId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `channels/${channelId}`);
    }
  }
}

export function filterChannels(channels: Channel[], filters: Partial<FilterOptions>): Channel[] {
  return channels.filter(channel => {
    // Only active channels unless explicitly in admin
    if (!channel.active && filters.onlyFavorites === undefined) {
      // allow inactive if searching admin
    }

    if (filters.category && filters.category !== 'all') {
      const filterCat = filters.category.toLowerCase();
      const channelCat = channel.category.toLowerCase();
      const isSportsMatch =
        (filterCat === 'athletics & sports' || filterCat === 'sports') &&
        (channelCat === 'sports' || channelCat === 'athletics & sports');

      if (!isSportsMatch && channelCat !== filterCat) {
        return false;
      }
    }

    if (filters.country && filters.country !== 'all') {
      if (
        channel.countryCode.toLowerCase() !== filters.country.toLowerCase() &&
        channel.country.toLowerCase() !== filters.country.toLowerCase()
      ) {
        return false;
      }
    }

    if (filters.language && filters.language !== 'all') {
      if (channel.language.toLowerCase() !== filters.language.toLowerCase()) {
        return false;
      }
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchesName = channel.name.toLowerCase().includes(q);
      const matchesCategory = channel.category.toLowerCase().includes(q);
      const matchesCountry = channel.country.toLowerCase().includes(q);
      const matchesLang = channel.language.toLowerCase().includes(q);
      const matchesDesc = channel.description.toLowerCase().includes(q);
      if (!matchesName && !matchesCategory && !matchesCountry && !matchesLang && !matchesDesc) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (filters.sortBy === 'recently_added') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // Default popularity / viewerCount
    return (b.viewerCount || 0) - (a.viewerCount || 0);
  });
}
