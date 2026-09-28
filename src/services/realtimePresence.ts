import { useState, useEffect, useRef } from 'react';

// Generates or retrieves a persistent client session ID per browser tab
export function getPresenceClientId(): string {
  try {
    let id = sessionStorage.getItem('streamlive_client_id');
    if (!id) {
      id = `viewer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('streamlive_client_id', id);
    }
    return id;
  } catch {
    return `viewer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export interface RealtimePresenceState {
  viewers: number;
  totalActive: number;
  isConnected: boolean;
}

/**
 * Hook to track and subscribe to genuine real-time viewers for a specific channel
 * Uses Server-Sent Events (SSE) backed by Express presence management
 */
export function useRealtimeChannelViewers(
  channelId?: string,
  initialCount = 1
): RealtimePresenceState {
  const [viewers, setViewers] = useState<number>(() => Math.max(initialCount, 1));
  const [totalActive, setTotalActive] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!channelId) return;

    const clientId = getPresenceClientId();
    let isCancelled = false;

    // 1. Initial quick fetch
    fetch(`/api/presence/count?channelId=${encodeURIComponent(channelId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !isCancelled) {
          // If the user just joined, viewers is at least 1
          setViewers(Math.max(data.viewers, 1));
          if (data.totalActive) setTotalActive(data.totalActive);
        }
      })
      .catch(() => {});

    // 2. Open SSE stream
    const sseUrl = `/api/presence/stream?channelId=${encodeURIComponent(channelId)}&clientId=${encodeURIComponent(clientId)}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      if (!isCancelled) {
        setIsConnected(true);
      }
    };

    es.addEventListener('viewers', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload && !isCancelled) {
          setViewers(Math.max(payload.viewers, 1));
          if (payload.totalActive) {
            setTotalActive(payload.totalActive);
          }
        }
      } catch (err) {
        console.warn('Error parsing presence SSE:', err);
      }
    });

    es.onerror = () => {
      if (!isCancelled) {
        setIsConnected(false);
      }
    };

    // 3. Regular heartbeat interval (every 15s)
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetch('/api/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId, clientId }),
        }).catch(() => {});
      }
    }, 15000);

    // 4. Send leave beacon on tab unload or navigation away
    const handleUnload = () => {
      try {
        const payload = JSON.stringify({ channelId, clientId });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/presence/leave', blob);
      } catch {
        // Ignore fallback
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      isCancelled = true;
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Notify server client left this channel
      try {
        fetch('/api/presence/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId, clientId }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Ignore
      }
    };
  }, [channelId]);

  return { viewers, totalActive, isConnected };
}

/**
 * Hook to retrieve real-time counts for all channels (for channel cards/grids)
 */
export function useAllRealtimeCounts(): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;

    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/presence/counts');
        if (res.ok) {
          const data = await res.json();
          if (active && data.counts) {
            setCounts(data.counts);
          }
        }
      } catch {
        // Fallback
      }
    };

    fetchCounts();
    const timer = setInterval(fetchCounts, 15000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return counts;
}
