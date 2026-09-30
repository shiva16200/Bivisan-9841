import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Readable, pipeline } from 'stream';
import { createServer as createViteServer } from 'vite';
import compression from 'compression';

// Process-level protection for stream aborts and client disconnects
process.on('uncaughtException', (err: any) => {
  if (
    err?.name === 'TimeoutError' ||
    err?.message?.includes('aborted') ||
    err?.message?.includes('premature close') ||
    err?.code === 'ECONNRESET' ||
    err?.code === 'EPIPE'
  ) {
    // Expected benign network/stream drop when user changes channel or stream times out
    return;
  }
  console.error('[Process Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason: any) => {
  if (
    reason?.name === 'TimeoutError' ||
    reason?.message?.includes('aborted') ||
    reason?.code === 'ECONNRESET'
  ) {
    return;
  }
  console.error('[Process Unhandled Rejection]', reason);
});

const app = express();
const PORT = 3000;

// CORS & Preflight middleware for streaming
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Enable gzip/deflate compression for ultra-fast mobile loading (<100kb payload)
app.use(
  compression({
    filter: (req, res) => {
      // Don't compress video/audio segments (they are already binary compressed media) or SSE
      if (
        req.path.includes('/proxy') ||
        req.path.includes('.fmp4') ||
        req.path.includes('.ts') ||
        req.path.includes('.mp4') ||
        req.path.includes('/stream')
      ) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// Cache the active wmsAuthSign token for Himalayan Sports (valid up to 24h upstream)
let cachedWmsAuthToken: { token: string; expiresAt: number } | null = null;
// Himalayan Sports Nimble edge: operational high-speed edge 202.79.40.181
const HIMALAYAN_EDGES = ['202.79.40.181'];
const HIMALAYAN_PATH = '/fifa26/HimalayaSportsFifa026/playlist.m3u8';

// Normalize unreachable Nepal ISP internal IPs (202.166.*.*, 202.79.*.*, edge.stream.nettv) to the active 202.79.40.181 edge
export function normalizeUpstreamUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  return rawUrl.replace(
    /https?:\/\/(?:202\.166\.\d+\.\d+|202\.79\.(?!40\.181)\d+\.\d+|edge\.stream\.nettv\.com\.np)(?::\d+)?\//g,
    'http://202.79.40.181/'
  );
}

async function getHimalayanWmsAuthToken(forceFresh = false): Promise<string> {
  const now = Date.now();
  if (!forceFresh && cachedWmsAuthToken && cachedWmsAuthToken.expiresAt > now) {
    return cachedWmsAuthToken.token;
  }

  try {
    const pageRes = await fetch('http://tv.techjail.net/freefa/s2.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'http://tv.techjail.net/freefa/s2.php',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      const tokenMatch = html.match(/wmsAuthSign=([a-zA-Z0-9+/=]+)/);
      if (tokenMatch && tokenMatch[1]) {
        const token = tokenMatch[1];
        cachedWmsAuthToken = {
          token,
          expiresAt: now + 30 * 60 * 1000, // cache for 30 minutes
        };
        return token;
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.warn('[Himalayan Sports] Token fetch notice:', error.message);
  }

  if (cachedWmsAuthToken) {
    return cachedWmsAuthToken.token;
  }

  return '';
}

// Proactively refresh wmsAuthSign token in background every 10 minutes to eliminate playback stall pauses
setInterval(() => {
  getHimalayanWmsAuthToken(true).catch(() => {});
}, 10 * 60 * 1000);

// In-memory cache of recent playlists to eliminate lag and prevent playback stalls
const playlistCache = new Map<string, { body: string; expiresAt: number }>();

// High-speed in-memory cache for media segments and fMP4 init headers (instant delivery, zero lag)
const segmentCache = new Map<string, { buffer: Buffer; contentType: string; expiresAt: number }>();

function rewriteM3u8Content(content: string, baseUrl: string): string {
  const normalizedBase = normalizeUpstreamUrl(baseUrl);
  return content
    .split('\n')
    .map((line) => {
      let l = line.trim();
      if (!l) return '';

      // Rewrite URI="..." attributes (e.g. #EXT-X-MAP, #EXT-X-PART, #EXT-X-MEDIA)
      l = l.replace(/URI=["']([^"']+)["']/g, (_match, uri) => {
        try {
          const resolved = normalizeUpstreamUrl(new URL(uri, normalizedBase).href);
          return `URI="/api/stream/proxy?url=${encodeURIComponent(resolved)}"`;
        } catch {
          return _match;
        }
      });

      // Rewrite bare segment / sub-playlist lines (lines not starting with #)
      if (!l.startsWith('#')) {
        try {
          const resolved = normalizeUpstreamUrl(new URL(l, normalizedBase).href);
          return `/api/stream/proxy?url=${encodeURIComponent(resolved)}`;
        } catch {
          return l;
        }
      }

      return l;
    })
    .join('\n');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// PERSISTENT TOTAL VIEW COUNTER STORAGE
// ==========================================
const DATA_DIR = path.join(process.cwd(), 'data');
const VIEWS_FILE_PATH = path.join(DATA_DIR, 'views.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Could not initialize data directory:', err);
}

// Baseline view counts: all channels start from 0 actual views
const DEFAULT_CHANNEL_BASELINES: Record<string, number> = {};

// In-memory view counts map: channelId -> total views
const channelViewsMap = new Map<string, number>();

function loadViewsFromDisk() {
  try {
    if (fs.existsSync(VIEWS_FILE_PATH)) {
      const raw = fs.readFileSync(VIEWS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        for (const [key, val] of Object.entries(parsed)) {
          if (typeof val === 'number') {
            channelViewsMap.set(key, val);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error loading views from disk:', err);
  }
}
loadViewsFromDisk();

function persistViewsToDiskSync() {
  try {
    const obj = Object.fromEntries(channelViewsMap);
    fs.writeFileSync(VIEWS_FILE_PATH, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving views to disk:', err);
  }
}

// Ensure saved on graceful shutdown
process.on('SIGINT', () => { persistViewsToDiskSync(); });
process.on('SIGTERM', () => { persistViewsToDiskSync(); });

// 1. Health endpoint (compatible with Cloud Run health checks)
app.get(['/health', '/healthz', '/api/health'], (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. View Count Endpoints
app.get('/api/views', (_req, res) => {
  const views = Object.fromEntries(channelViewsMap);
  res.json({ views });
});

app.get('/api/views/:channelId', (req, res) => {
  const { channelId } = req.params;
  const base = DEFAULT_CHANNEL_BASELINES[channelId] ?? 0;
  const views = channelViewsMap.get(channelId) ?? base;
  res.json({ channelId, views });
});

app.post('/api/views/increment', (req, res) => {
  const { channelId } = req.body || {};
  if (!channelId || typeof channelId !== 'string') {
    res.status(400).json({ error: 'Missing or invalid channelId' });
    return;
  }

  // 1 click = 1 view, 20 reloads = 20 views for all channels
  const existing = channelViewsMap.get(channelId) ?? 0;
  const newTotal = existing + 1;
  channelViewsMap.set(channelId, newTotal);
  if (channelId === 'h-sports') channelViewsMap.set('himalayan-sports', newTotal);
  if (channelId === 'himalayan-sports') channelViewsMap.set('h-sports', newTotal);
  persistViewsToDiskSync();

  res.json({ ok: true, channelId, views: newTotal });
});

// Backward-compatibility endpoints for presence
app.get('/api/presence/count', (req, res) => {
  const channelId = (req.query.channelId as string) || 'global';
  const views = channelViewsMap.get(channelId) || 0;
  res.json({ channelId, viewers: views, totalActive: 1 });
});

app.get('/api/presence/counts', (_req, res) => {
  const counts = Object.fromEntries(channelViewsMap);
  res.json({ counts, totalActive: 1 });
});

app.get('/api/presence/stream', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.write(':ready\n\n');
  res.end();
});

app.post('/api/presence/heartbeat', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/presence/leave', (_req, res) => {
  res.json({ ok: true });
});

// ==========================================
// LIVE CHANNEL STREAM ENDPOINTS
// ==========================================
const liveChannelUrlCache = new Map<string, { url: string; expiresAt: number }>();

import { VERIFIED_CHANNEL_CHIDS } from './src/data/verifiedChannelIds';

// Known direct edge stream mapping for high-traffic Nepali channels
const KNOWN_DIRECT_STREAMS: Record<string, string> = {
  '1413': 'http://202.79.40.181/oldlivestream/KTVMax2HD.stream/playlist.m3u8',
  '516': 'http://202.79.40.181/iptvlivestream/netKANTIPUR1500.stream/playlist.m3u8',
  '836': 'http://202.79.40.181/iptvlivedge/netAP1HD1500.stream/playlist.m3u8',
  '238': 'http://202.79.40.181/iptvlivestream/netHIMALAYA1500.stream/playlist.m3u8',
  '225': 'http://202.79.40.181/iptvlivestream/netNTVNEPAL1500.stream/playlist.m3u8',
  '265': 'http://202.79.40.181/iptvlivestream/netNTVNEWS1500.stream/playlist.m3u8',
  '262': 'http://202.79.40.181/iptvlivestream/netNTVPLUS1500.stream/playlist.m3u8',
  '778': 'http://202.79.40.181/iptvlivestream/netPRIMETV1500.stream/playlist.m3u8',
  '1312': 'http://202.79.40.181/iptvlivestream/netMakaluTvHD.stream/playlist.m3u8',
  '429': 'http://202.79.40.181/iptvlivestream/netJANTATV1500.stream/playlist.m3u8',
};

async function resolveChannelStreamUrl(chid: string, forceIntl = false): Promise<string> {
  const cacheKey = forceIntl ? `${chid}_intl` : chid;
  const now = Date.now();
  const cached = liveChannelUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const candidateUrls = forceIntl
    ? [`http://tv.techjail.net/huritv9/getlink.php?CHID=${encodeURIComponent(chid)}&intl=1`]
    : [
        `http://tv.techjail.net/huritv9/getlink.php?CHID=${encodeURIComponent(chid)}&intl=1`,
        `http://tv.techjail.net/huritv9/getlink.php?CHID=${encodeURIComponent(chid)}`,
      ];

  for (const linkFetchUrl of candidateUrls) {
    try {
      const linkRes = await fetch(linkFetchUrl, {
        headers: {
          'Referer': 'http://tv.techjail.net/v9x9/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        signal: AbortSignal.timeout(3500),
      });
      const linkText = (await linkRes.text()).trim();
      if (linkText.startsWith('http://') || linkText.startsWith('https://')) {
        const streamUrl = normalizeUpstreamUrl(linkText);
        liveChannelUrlCache.set(cacheKey, { url: streamUrl, expiresAt: now + 120000 });
        return streamUrl;
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.log(`[Stream] Link resolution notice for ${chid}: ${error.message}`);
    }
  }

  // Resilient fallback: If dynamic link resolution timed out, use direct edge stream with wmsAuthSign
  if (KNOWN_DIRECT_STREAMS[chid]) {
    const token = await getHimalayanWmsAuthToken(false);
    const directUrl = KNOWN_DIRECT_STREAMS[chid] + (token ? `?wmsAuthSign=${token}` : '');
    liveChannelUrlCache.set(cacheKey, { url: directUrl, expiresAt: now + 60000 });
    return directUrl;
  }

  return '';
}

// Resilient Stream Handler: Ensures only the requested channel is served without hijacking to another channel
async function serveSelfHealedFallback(res: express.Response, originalChid: string) {
  // Retry original channel once with fresh token
  try {
    const freshUrl = await resolveChannelStreamUrl(originalChid, true);
    if (freshUrl) {
      const upRes = await fetch(freshUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'http://tv.techjail.net/' },
        signal: AbortSignal.timeout(4000),
      });
      if (upRes.ok) {
        const txt = await upRes.text();
        const rewritten = rewriteM3u8Content(txt, freshUrl);
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(rewritten);
        return;
      }
    }
  } catch {
    // ignore
  }

  res.status(503).send('#EXTM3U\n#EXT-X-ERROR:STREAM_CURRENTLY_UNAVAILABLE\n');
}

async function handleLiveStreamRequest(req: express.Request, res: express.Response, forceIntl = false) {
  const { chid } = req.params;
  if (!chid) {
    res.status(400).json({ error: 'Missing channel ID' });
    return;
  }

  const now = Date.now();
  const manifestCacheKey = `live_manifest_${chid}_${forceIntl ? 'intl' : 'std'}`;

  // Instant RAM cache response (<1ms) for instantaneous TV-speed playback
  const cachedManifest = playlistCache.get(manifestCacheKey);
  if (cachedManifest && cachedManifest.expiresAt > now) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=1, stale-while-revalidate=2');
    res.send(cachedManifest.body);
    return;
  }

  const streamUrl = await resolveChannelStreamUrl(chid, forceIntl);

  if (!streamUrl) {
    // If cache has a slightly older version, serve it to prevent decoder stall
    if (cachedManifest) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(cachedManifest.body);
      return;
    }
    // Auto-heal seamlessly with verified fallback
    await serveSelfHealedFallback(res, chid);
    return;
  }

  try {
    const upstreamRes = await fetch(streamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'http://tv.techjail.net/',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!upstreamRes.ok) {
      if (cachedManifest) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(cachedManifest.body);
        return;
      }
      liveChannelUrlCache.delete(forceIntl ? `${chid}_intl` : chid);
      // Auto-heal seamlessly with verified fallback
      await serveSelfHealedFallback(res, chid);
      return;
    }

    const playlistText = await upstreamRes.text();
    const rewritten = rewriteM3u8Content(playlistText, streamUrl);

    // Cache live manifest for 2.5 seconds to allow instant non-blocking TV-speed delivery
    playlistCache.set(manifestCacheKey, {
      body: rewritten,
      expiresAt: now + 2500,
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=1, stale-while-revalidate=2');
    res.send(rewritten);
  } catch (err) {
    if (cachedManifest) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(cachedManifest.body);
      return;
    }
    liveChannelUrlCache.delete(forceIntl ? `${chid}_intl` : chid);
    await serveSelfHealedFallback(res, chid);
  }
}

// Background Warmer: warm top channels gently after startup without choking the server
const TOP_CHANNELS_TO_WARM = ['1413', '516', '238', '836'];
async function warmTopChannels() {
  for (const chid of TOP_CHANNELS_TO_WARM) {
    try {
      const streamUrl = await resolveChannelStreamUrl(chid, true);
      if (streamUrl) {
        const res = await fetch(streamUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'http://tv.techjail.net/' },
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const text = await res.text();
          const rewritten = rewriteM3u8Content(text, streamUrl);
          playlistCache.set(`live_manifest_${chid}_intl`, {
            body: rewritten,
            expiresAt: Date.now() + 4000,
          });
          playlistCache.set(`live_manifest_${chid}_std`, {
            body: rewritten,
            expiresAt: Date.now() + 4000,
          });
        }
      }
    } catch {
      // background silent warm
    }
  }
}

// Warm top channels once gently after startup, then refresh every 2 minutes
setTimeout(() => {
  warmTopChannels().catch(() => {});
  setInterval(() => {
    warmTopChannels().catch(() => {});
  }, 120000);
}, 2000);

app.get('/api/stream/live/:chid.m3u8', (req, res) => handleLiveStreamRequest(req, res, false));
app.get('/api/stream/live-backup/:chid.m3u8', (req, res) => handleLiveStreamRequest(req, res, true));
app.get('/api/stream/ch/:chid.m3u8', (req, res) => handleLiveStreamRequest(req, res, false));
app.get('/api/stream/techjail/:chid.m3u8', (req, res) => handleLiveStreamRequest(req, res, false));

// Endpoint to query verified active channel health
app.get('/api/channels/verified-status', (_req, res) => {
  res.json({
    ok: true,
    total: VERIFIED_CHANNEL_CHIDS.length,
    verifiedChids: VERIFIED_CHANNEL_CHIDS,
    timestamp: Date.now(),
  });
});

// Canonical Himalayan Sports Live Stream Direct Endpoints
// Direct upstream path: http://202.79.40.181/fifa26/HimalayaSportsFifa026/playlist.m3u8
const handleHimalayanStream = async (req: express.Request, res: express.Response) => {
  let rawFile = (req.params.file || req.params[0] || '').trim();
  let fileName = rawFile;

  if (
    !fileName ||
    fileName === 'playlist' ||
    fileName === 'playlist.' ||
    fileName === 'playlist.m3u8' ||
    fileName.endsWith('h-sports.m3u8') ||
    fileName.endsWith('himalayan-sports.m3u8') ||
    fileName.endsWith('fifa.m3u8')
  ) {
    fileName = 'playlist.m3u8';
  } else if (!fileName.includes('.')) {
    fileName = `${fileName}.m3u8`;
  }

  let queryStr = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';

  // If token is missing from query string, fetch fresh token
  if (!queryStr.includes('wmsAuthSign=')) {
    const token = await getHimalayanWmsAuthToken(false);
    if (token) {
      queryStr = (queryStr ? queryStr + '&' : '?') + `wmsAuthSign=${token}`;
    }
  }

  const isPlaylist = fileName.endsWith('.m3u8');
  const now = Date.now();
  const cacheKey = `fifa26_${fileName}_${queryStr}`;

  if (isPlaylist) {
    const cached = playlistCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=1, stale-while-revalidate=2');
      res.send(cached.body);
      return;
    }
  } else {
    // Check in-memory segment cache for instant 0ms fragment delivery
    const cachedSeg = segmentCache.get(fileName);
    if (cachedSeg && cachedSeg.expiresAt > now) {
      res.setHeader('Content-Type', cachedSeg.contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      res.setHeader('Content-Length', cachedSeg.buffer.length);
      res.send(cachedSeg.buffer);
      return;
    }
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const host of HIMALAYAN_EDGES) {
      const targetUrl = `http://${host}/fifa26/HimalayaSportsFifa026/${fileName}${queryStr}`;
      try {
        const upstreamRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'http://tv.techjail.net/',
            ...(req.headers.range ? { 'Range': req.headers.range } : {}),
          },
          signal: AbortSignal.timeout(isPlaylist ? 4000 : 8000),
        });

        if (upstreamRes.status === 403 && attempt === 0) {
          // Token expired, refresh token and rebuild query string
          const freshToken = await getHimalayanWmsAuthToken(true);
          queryStr = queryStr.replace(/wmsAuthSign=[^&]*/, `wmsAuthSign=${freshToken}`);
          if (!queryStr.includes('wmsAuthSign=')) {
            queryStr = (queryStr ? queryStr + '&' : '?') + `wmsAuthSign=${freshToken}`;
          }
          break; // retry inner loop with new token
        }

        if (upstreamRes.ok || upstreamRes.status === 206) {
          res.status(upstreamRes.status);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');

          let contentType = 'application/octet-stream';
          if (isPlaylist) {
            contentType = 'application/vnd.apple.mpegurl; charset=utf-8';
          } else if (fileName.includes('audio') || fileName.startsWith('a_')) {
            contentType = 'audio/mp4';
          } else if (fileName.includes('video') || fileName.startsWith('v_') || fileName.endsWith('.fmp4') || fileName.endsWith('.mp4')) {
            contentType = 'video/mp4';
          }
          res.setHeader('Content-Type', contentType);

          const contentLength = upstreamRes.headers.get('content-length');
          if (contentLength) res.setHeader('Content-Length', contentLength);
          const contentRange = upstreamRes.headers.get('content-range');
          if (contentRange) res.setHeader('Content-Range', contentRange);
          const acceptRanges = upstreamRes.headers.get('accept-ranges');
          if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

          if (isPlaylist) {
            let bodyText = await upstreamRes.text();
            // If sub-playlist video.m3u8 or audio.m3u8, strip partial segments (#EXT-X-PART) and server control
            // to provide standard 4-second fragments, preventing decoder stalls and lag
            if (fileName === 'video.m3u8' || fileName === 'audio.m3u8') {
              bodyText = bodyText
                .split('\n')
                .filter((line) => !line.startsWith('#EXT-X-PART') && !line.startsWith('#EXT-X-SERVER-CONTROL') && !line.startsWith('#EXT-X-PRELOAD-HINT'))
                .join('\n');
            }
            res.setHeader('Cache-Control', 'public, max-age=1, stale-while-revalidate=2');
            playlistCache.set(cacheKey, {
              body: bodyText,
              expiresAt: now + (fileName === 'playlist.m3u8' ? 1800 : 1500),
            });
            res.send(bodyText);
            return;
          } else {
            // Media segment (fMP4 chunk) - Stream directly to client using pipeline for instant delivery with zero lag
            res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
            if (upstreamRes.body) {
              const nodeStream = Readable.fromWeb(upstreamRes.body as any);
              nodeStream.on('error', () => {
                if (!res.headersSent) res.status(502).end();
              });
              res.on('close', () => {
                if (!nodeStream.destroyed) nodeStream.destroy();
              });
              pipeline(nodeStream, res, () => {});
              return;
            } else {
              res.end();
              return;
            }
          }
        }
      } catch {
        continue;
      }
    }
  }

  res.status(503).json({ error: 'H Sports stream temporarily buffering, retrying...' });
};

// Route matching for H Sports: support direct path, trailing slashes, subpaths, and backward-compatible api routes
app.get([
  '/fifa26/HimalayaSportsFifa026',
  '/fifa26/HimalayaSportsFifa026/',
  '/fifa26/HimalayaSportsFifa026/:file(*)',
  '/api/stream/h-sports.m3u8',
  '/api/stream/himalayan-sports.m3u8',
  '/api/stream/fifa.m3u8',
  '/api/stream/h-sports/:file(*)',
  '/api/stream/himalayan-sports/:file(*)',
  '/api/stream/video.m3u8',
  '/api/stream/audio.m3u8',
  '/api/stream/:file(*.fmp4)',
], handleHimalayanStream);

// 3. Generic Stream Segment / Sub-playlist Proxy with Fast Streaming & Memory Cache
app.get('/api/stream/proxy', async (req, res) => {
  let targetUrl = req.query.url as string;
  if (!targetUrl || typeof targetUrl !== 'string') {
    res.status(400).send('Missing url parameter');
    return;
  }

  targetUrl = normalizeUpstreamUrl(targetUrl);

  // Safety check: only proxy http/https URLs
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    res.status(400).send('Invalid url protocol');
    return;
  }

  const now = Date.now();
  const isPlaylist = targetUrl.includes('.m3u8');

  // For playlists, check memory cache for fast sub-millisecond response
  if (isPlaylist) {
    const cached = playlistCache.get(targetUrl);
    if (cached && cached.expiresAt > now) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'public, max-age=1, stale-while-revalidate=2');
      res.send(cached.body);
      return;
    }
  }

  try {
    const forwardHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Referer': 'http://tv.techjail.net/',
    };

    if (req.headers.range) {
      forwardHeaders['Range'] = req.headers.range;
    }

    const upstreamRes = await fetch(targetUrl, {
      headers: forwardHeaders,
      signal: AbortSignal.timeout(isPlaylist ? 12000 : 45000),
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    const contentType = upstreamRes.headers.get('content-type') || '';
    const isM3u8Response =
      isPlaylist ||
      contentType.includes('mpegurl') ||
      contentType.includes('x-mpegURL');

    if (isM3u8Response) {
      if (!upstreamRes.ok) {
        // Do NOT replace with a different channel! Return cached or upstream status
        const cached = playlistCache.get(targetUrl);
        if (cached) {
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          res.send(cached.body);
          return;
        }
        res.status(upstreamRes.status).send('Stream temporarily unavailable');
        return;
      }

      const text = await upstreamRes.text();
      const rewritten = rewriteM3u8Content(text, targetUrl);

      // Cache live playlist for 2 seconds
      playlistCache.set(targetUrl, {
        body: rewritten,
        expiresAt: now + 2000,
      });

      res.status(upstreamRes.status);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'public, max-age=1, stale-while-revalidate=2');
      res.send(rewritten);
      return;
    }

    // Media segment (fMP4, TS, AAC chunk) — Stream directly to client using pipeline for ultra-fast latency & safe error handling
    res.status(upstreamRes.status);
    const segContentType = contentType || (targetUrl.includes('.fmp4') || targetUrl.includes('.mp4') ? 'video/mp4' : 'video/MP2T');
    res.setHeader('Content-Type', segContentType);

    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) res.setHeader('Content-Range', contentRange);
    const acceptRanges = upstreamRes.headers.get('accept-ranges');
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    if (upstreamRes.body) {
      const nodeStream = Readable.fromWeb(upstreamRes.body as any);

      // Handle stream aborts cleanly so they never become unhandled 'error' events
      nodeStream.on('error', (_err) => {
        if (!res.headersSent) {
          res.status(502).end();
        }
      });

      res.on('close', () => {
        if (!nodeStream.destroyed) {
          nodeStream.destroy();
        }
      });

      pipeline(nodeStream, res, (_err) => {
        // pipeline cleanly handles and absorbs premature closes or stream timeouts
      });
    } else {
      res.end();
    }
  } catch (err: unknown) {
    const error = err as Error;
    if (!res.headersSent) {
      // Check if playlist can be served from cache
      const cached = playlistCache.get(targetUrl);
      if (isPlaylist && cached) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(cached.body);
        return;
      }
      res.status(502).send('Error streaming media fragment: ' + error.message);
    }
  }
});

// 4. Real-time Server-Sent Events (SSE) & Fetch Stream for AI Generation (Eliminates Initial Delay)
app.post('/api/ai/stream', async (req, res) => {
  const { prompt, channelContext } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  // Set up SSE headers for immediate word-by-word streaming
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ text: `नमस्ते! म बिष्णु (Bishnu AI) हुँ। म प्रत्यक्ष खेलकुद र लाइभ प्रसारणमा मद्दत गर्न तयार छु। ${prompt}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI();
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are the Bishnu AI Sports & Live TV Companion for the web portal. Answer helpfully and enthusiastically in Nepali (or English if prompted). Context: ${channelContext || 'Watching live broadcast'}. User asks: ${prompt}`,
            },
          ],
        },
      ],
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown AI error';
    console.warn('[AI Stream] Fallback triggered:', errMessage);
    // Graceful fallback response streamed so client never breaks
    res.write(`data: ${JSON.stringify({ text: `म तपाईँको प्रत्यक्ष प्रसारण साथी हुँ। खेल र कार्यक्रम निरन्तर हेर्नुहोस्!` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Vite middleware and static serving
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(__dirname, 'index.html'))
      ? __dirname
      : path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.on('error', (err: unknown) => {
    console.error('Server error on startup:', err);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
