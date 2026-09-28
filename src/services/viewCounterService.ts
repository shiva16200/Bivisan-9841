import { useState, useEffect, useCallback, useRef } from 'react';

// Formats views e.g.:
// 0 views
// 1 view
// 10 views
// 840 views
// 1.2K views
// 1.2M views
export function formatViewCount(count: number, label: 'views' | 'watching' | 'viewers' = 'views'): string {
  if (typeof count !== 'number' || isNaN(count) || count <= 0) {
    return `0 ${label === 'viewers' ? 'viewers' : label === 'watching' ? 'watching' : 'views'}`;
  }
  if (count === 1) {
    return `1 ${label === 'viewers' ? 'viewer' : label === 'watching' ? 'watching' : 'view'}`;
  }
  const suffix = label === 'viewers' ? 'viewers' : label === 'watching' ? 'watching' : 'views';
  if (count < 1000) {
    return `${count} ${suffix}`;
  }
  if (count < 1000000) {
    const k = count / 1000;
    const formatted = k < 100 ? (Math.round(k * 10) / 10).toFixed(k % 1 === 0 ? 0 : 1) : Math.round(k).toString();
    return `${formatted}K ${suffix}`;
  }
  const m = count / 1000000;
  const formatted = (Math.round(m * 10) / 10).toFixed(m % 1 === 0 ? 0 : 1);
  return `${formatted}M ${suffix}`;
}

export function formatViewCountExact(count: number, label: 'views' | 'watching' | 'viewers' = 'views'): string {
  if (typeof count !== 'number' || isNaN(count) || count <= 0) {
    return `0 ${label === 'viewers' ? 'viewers' : label === 'watching' ? 'watching' : 'views'}`;
  }
  if (count === 1) {
    return `1 ${label === 'viewers' ? 'viewer' : label === 'watching' ? 'watching' : 'view'}`;
  }
  const suffix = label === 'viewers' ? 'viewers' : label === 'watching' ? 'watching' : 'views';
  return `${count.toLocaleString()} ${suffix}`;
}

export const CANONICAL_CHANNEL_BASELINES: Record<string, number> = {};

// Actual view baseline for all channels starts from 0
export function resolveChannelBaseline(_channelId?: string, _customFallback?: number): number {
  return 0;
}

const LOCAL_STORAGE_VIEWS_KEY = 'streamlive_channel_actual_views_v1';

function loadInitialViews(): Record<string, number> {
  const initial: Record<string, number> = {};
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_VIEWS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'number') {
            initial[k] = v;
          }
        }
      }
    }
  } catch {}
  return initial;
}

function persistCacheLocally(cache: Record<string, number>) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_VIEWS_KEY, JSON.stringify(cache));
    }
  } catch {}
}

// Global cache of channel view counts initialized from localStorage
let viewsCache: Record<string, number> = loadInitialViews();
let hasInitialFetch = false;

// Client session ID for this browser tab
function getSessionClientId(): string {
  try {
    let id = sessionStorage.getItem('streamlive_view_client_id');
    if (!id) {
      id = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('streamlive_view_client_id', id);
    }
    return id;
  } catch {
    return `client_${Date.now()}`;
  }
}

export async function fetchAllViews(): Promise<Record<string, number>> {
  try {
    const res = await fetch('/api/views');
    if (res.ok) {
      const data = await res.json();
      if (data?.views && typeof data.views === 'object') {
        for (const [k, v] of Object.entries(data.views)) {
          if (typeof v === 'number') {
            viewsCache[k] = v;
          }
        }
        persistCacheLocally(viewsCache);
        hasInitialFetch = true;
        window.dispatchEvent(new CustomEvent('streamlive_views_updated', { detail: viewsCache }));
        return viewsCache;
      }
    }
  } catch (err) {
    console.warn('Error fetching all channel views:', err);
  }
  return viewsCache;
}

export async function fetchSingleChannelViews(channelId: string): Promise<number> {
  if (!channelId) return 0;
  try {
    const res = await fetch(`/api/views/${encodeURIComponent(channelId)}`);
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.views === 'number') {
        viewsCache[channelId] = data.views;
        persistCacheLocally(viewsCache);
        window.dispatchEvent(new CustomEvent('streamlive_views_updated', { detail: viewsCache }));
        return viewsCache[channelId];
      }
    }
  } catch (err) {
    console.warn(`Error fetching views for channel ${channelId}:`, err);
  }
  return viewsCache[channelId] || 0;
}

export async function incrementChannelView(channelId: string, _baseCount?: number): Promise<number> {
  if (!channelId) return 0;

  // Actual views: 1 click = 1 view, 20 reloads = 20 views
  const currentVal = viewsCache[channelId] ?? 0;
  const optimisticNext = currentVal + 1;
  viewsCache[channelId] = optimisticNext;
  persistCacheLocally(viewsCache);
  window.dispatchEvent(new CustomEvent('streamlive_views_updated', { detail: { ...viewsCache } }));

  try {
    const res = await fetch('/api/views/increment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });

    if (res.ok) {
      const data = await res.json();
      if (typeof data?.views === 'number') {
        viewsCache[channelId] = data.views;
        persistCacheLocally(viewsCache);
        window.dispatchEvent(new CustomEvent('streamlive_views_updated', { detail: { ...viewsCache } }));
        return viewsCache[channelId];
      }
    }
  } catch (err) {
    console.warn(`Error incrementing views for channel ${channelId}:`, err);
  }

  return optimisticNext;
}

/**
 * Hook for subscribing to a specific channel's real persistent total view count
 */
export function useChannelViews(
  channelId?: string,
  fallbackCount: number = 0,
  isLivePlayer: boolean = false
) {
  const [views, setViews] = useState<number>(() => {
    if (!channelId) return 0;
    const cached = viewsCache[channelId];
    return cached !== undefined ? cached : fallbackCount;
  });

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!channelId) return;

    if (viewsCache[channelId] !== undefined) {
      setViews(viewsCache[channelId]);
    } else if (!hasInitialFetch && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchSingleChannelViews(channelId).then((v) => {
        if (typeof v === 'number') {
          setViews(v);
        }
      });
    }

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Record<string, number>>;
      if (customEvent.detail && channelId && customEvent.detail[channelId] !== undefined) {
        setViews(customEvent.detail[channelId]);
      }
    };

    window.addEventListener('streamlive_views_updated', handleUpdate);

    let refreshTimer: number | null = null;
    if (isLivePlayer) {
      refreshTimer = window.setInterval(() => {
        fetchSingleChannelViews(channelId).then((value) => {
          if (typeof value === 'number') {
            setViews(value);
          }
        });
      }, 20000);
    }

    return () => {
      window.removeEventListener('streamlive_views_updated', handleUpdate);
      if (refreshTimer) {
        window.clearInterval(refreshTimer);
      }
    };
  }, [channelId, isLivePlayer]);

  const triggerIncrement = useCallback(() => {
    if (channelId) {
      incrementChannelView(channelId).then((v) => setViews(v));
    }
  }, [channelId]);

  return {
    views,
    formatted: formatViewCount(views),
    formattedExact: formatViewCountExact(views),
    incrementView: triggerIncrement,
  };
}
