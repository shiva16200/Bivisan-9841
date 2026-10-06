var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  normalizeUpstreamUrl: () => normalizeUpstreamUrl
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_stream = require("stream");
var import_vite = require("vite");
var import_compression = __toESM(require("compression"), 1);

// src/data/verifiedChannelIds.ts
var VERIFIED_CHANNEL_CHIDS = [
  "225",
  "1413",
  "516",
  "429",
  "836",
  "265",
  "238",
  "262",
  "1312",
  "778",
  "1238",
  "1318",
  "1045",
  "578",
  "235",
  "1297",
  "422",
  "1162",
  "237",
  "226",
  "224",
  "263",
  "1396",
  "587",
  "288",
  "454",
  "1357",
  "590",
  "472",
  "525",
  "537",
  "790",
  "481",
  "1063",
  "937",
  "961",
  "1105",
  "485",
  "1009",
  "799",
  "769",
  "428",
  "949",
  "1245",
  "1196",
  "1090",
  "1012",
  "1270",
  "1036",
  "1242",
  "1279",
  "943",
  "1117",
  "1315",
  "1144",
  "1107",
  "1027",
  "775",
  "898",
  "460",
  "910",
  "1211",
  "859",
  "892",
  "1222",
  "1048",
  "1273",
  "1327",
  "1137",
  "1191",
  "1282",
  "1132",
  "1333",
  "1229",
  "534",
  "1324",
  "1237",
  "1345",
  "1351",
  "1364",
  "1408",
  "1399",
  "1354",
  "1367",
  "351",
  "496",
  "386",
  "436",
  "395",
  "973",
  "461",
  "474",
  "479",
  "391",
  "393",
  "319",
  "558",
  "309",
  "341",
  "343",
  "243",
  "358",
  "425",
  "916",
  "371",
  "1259",
  "1227",
  "1303",
  "348",
  "406",
  "1250",
  "253",
  "468",
  "1167",
  "673",
  "363",
  "361",
  "1288",
  "919",
  "426",
  "362",
  "427",
  "1285",
  "787",
  "359",
  "342",
  "483",
  "344",
  "1306",
  "308",
  "373",
  "374",
  "418",
  "313",
  "317",
  "303",
  "464",
  "316",
  "346",
  "661",
  "367",
  "739",
  "365",
  "366",
  "412",
  "397",
  "502",
  "469",
  "398",
  "399",
  "522",
  "1391",
  "946",
  "552",
  "1389",
  "1337",
  "249",
  "655",
  "465",
  "246",
  "913",
  "940",
  "1298",
  "394",
  "415",
  "413",
  "580",
  "414",
  "1110",
  "381",
  "1294",
  "383",
  "387",
  "396",
  "934",
  "1334",
  "251",
  "976",
  "1300",
  "471",
  "384",
  "931",
  "350",
  "1405",
  "820",
  "1402",
  "339",
  "327",
  "922",
  "266",
  "291",
  "435",
  "490",
  "880",
  "239",
  "1015",
  "1157",
  "324",
  "560",
  "430",
  "853",
  "230",
  "424",
  "487",
  "610"
];
var VERIFIED_CHID_SET = new Set(VERIFIED_CHANNEL_CHIDS);

// server.ts
process.on("uncaughtException", (err) => {
  if (err?.name === "TimeoutError" || err?.message?.includes("aborted") || err?.message?.includes("premature close") || err?.code === "ECONNRESET" || err?.code === "EPIPE") {
    return;
  }
  console.error("[Process Uncaught Exception]", err);
});
process.on("unhandledRejection", (reason) => {
  if (reason?.name === "TimeoutError" || reason?.message?.includes("aborted") || reason?.code === "ECONNRESET") {
    return;
  }
  console.error("[Process Unhandled Rejection]", reason);
});
var app = (0, import_express.default)();
var PORT = 3e3;
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(
  (0, import_compression.default)({
    filter: (req, res) => {
      if (req.path.includes("/proxy") || req.path.includes(".fmp4") || req.path.includes(".ts") || req.path.includes(".mp4") || req.path.includes("/stream")) {
        return false;
      }
      return import_compression.default.filter(req, res);
    }
  })
);
var cachedWmsAuthToken = null;
var HIMALAYAN_EDGES = ["202.79.40.181"];
function normalizeUpstreamUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  return rawUrl.replace(
    /https?:\/\/(?:202\.166\.\d+\.\d+|202\.79\.(?!40\.181)\d+\.\d+|edge\.stream\.nettv\.com\.np)(?::\d+)?\//g,
    "http://202.79.40.181/"
  );
}
async function getHimalayanWmsAuthToken(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && cachedWmsAuthToken && cachedWmsAuthToken.expiresAt > now) {
    return cachedWmsAuthToken.token;
  }
  try {
    const pageRes = await fetch("http://tv.techjail.net/freefa/s2.php", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "http://tv.techjail.net/freefa/s2.php"
      },
      signal: AbortSignal.timeout(4e3)
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const tokenMatch = html.match(/wmsAuthSign=([a-zA-Z0-9+/=]+)/);
      if (tokenMatch && tokenMatch[1]) {
        const token = tokenMatch[1];
        cachedWmsAuthToken = {
          token,
          expiresAt: now + 30 * 60 * 1e3
          // cache for 30 minutes
        };
        return token;
      }
    }
  } catch (err) {
    const error = err;
    console.warn("[Himalayan Sports] Token fetch notice:", error.message);
  }
  if (cachedWmsAuthToken) {
    return cachedWmsAuthToken.token;
  }
  return "";
}
setInterval(() => {
  getHimalayanWmsAuthToken(true).catch(() => {
  });
}, 10 * 60 * 1e3);
var playlistCache = /* @__PURE__ */ new Map();
var segmentCache = /* @__PURE__ */ new Map();
function rewriteM3u8Content(content, baseUrl) {
  const normalizedBase = normalizeUpstreamUrl(baseUrl);
  return content.split("\n").map((line) => {
    let l = line.trim();
    if (!l) return "";
    l = l.replace(/URI=["']([^"']+)["']/g, (_match, uri) => {
      try {
        const resolved = normalizeUpstreamUrl(new URL(uri, normalizedBase).href);
        return `URI="/api/stream/proxy?url=${encodeURIComponent(resolved)}"`;
      } catch {
        return _match;
      }
    });
    if (!l.startsWith("#")) {
      try {
        const resolved = normalizeUpstreamUrl(new URL(l, normalizedBase).href);
        return `/api/stream/proxy?url=${encodeURIComponent(resolved)}`;
      } catch {
        return l;
      }
    }
    return l;
  }).join("\n");
}
app.use(import_express.default.json());
app.use(import_express.default.urlencoded({ extended: true }));
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var VIEWS_FILE_PATH = import_path.default.join(DATA_DIR, "views.json");
try {
  if (!import_fs.default.existsSync(DATA_DIR)) {
    import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("Could not initialize data directory:", err);
}
var DEFAULT_CHANNEL_BASELINES = {};
var channelViewsMap = /* @__PURE__ */ new Map();
function loadViewsFromDisk() {
  try {
    if (import_fs.default.existsSync(VIEWS_FILE_PATH)) {
      const raw = import_fs.default.readFileSync(VIEWS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const [key, val] of Object.entries(parsed)) {
          if (typeof val === "number") {
            channelViewsMap.set(key, val);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error loading views from disk:", err);
  }
}
loadViewsFromDisk();
function persistViewsToDiskSync() {
  try {
    const obj = Object.fromEntries(channelViewsMap);
    import_fs.default.writeFileSync(VIEWS_FILE_PATH, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving views to disk:", err);
  }
}
process.on("SIGINT", () => {
  persistViewsToDiskSync();
});
process.on("SIGTERM", () => {
  persistViewsToDiskSync();
});
app.get(["/health", "/healthz", "/api/health"], (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/views", (_req, res) => {
  const views = Object.fromEntries(channelViewsMap);
  res.json({ views });
});
app.get("/api/views/:channelId", (req, res) => {
  const { channelId } = req.params;
  const base = DEFAULT_CHANNEL_BASELINES[channelId] ?? 0;
  const views = channelViewsMap.get(channelId) ?? base;
  res.json({ channelId, views });
});
app.post("/api/views/increment", (req, res) => {
  const { channelId } = req.body || {};
  if (!channelId || typeof channelId !== "string") {
    res.status(400).json({ error: "Missing or invalid channelId" });
    return;
  }
  const existing = channelViewsMap.get(channelId) ?? 0;
  const newTotal = existing + 1;
  channelViewsMap.set(channelId, newTotal);
  if (channelId === "h-sports") channelViewsMap.set("himalayan-sports", newTotal);
  if (channelId === "himalayan-sports") channelViewsMap.set("h-sports", newTotal);
  persistViewsToDiskSync();
  res.json({ ok: true, channelId, views: newTotal });
});
app.get("/api/presence/count", (req, res) => {
  const channelId = req.query.channelId || "global";
  const views = channelViewsMap.get(channelId) || 0;
  res.json({ channelId, viewers: views, totalActive: 1 });
});
app.get("/api/presence/counts", (_req, res) => {
  const counts = Object.fromEntries(channelViewsMap);
  res.json({ counts, totalActive: 1 });
});
app.get("/api/presence/stream", (_req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.write(":ready\n\n");
  res.end();
});
app.post("/api/presence/heartbeat", (_req, res) => {
  res.json({ ok: true });
});
app.post("/api/presence/leave", (_req, res) => {
  res.json({ ok: true });
});
var liveChannelUrlCache = /* @__PURE__ */ new Map();
var KNOWN_DIRECT_STREAMS = {
  "1413": "http://202.79.40.181/oldlivestream/KTVMax2HD.stream/playlist.m3u8",
  "516": "http://202.79.40.181/iptvlivestream/netKANTIPUR1500.stream/playlist.m3u8",
  "836": "http://202.79.40.181/iptvlivedge/netAP1HD1500.stream/playlist.m3u8",
  "238": "http://202.79.40.181/iptvlivestream/netHIMALAYA1500.stream/playlist.m3u8",
  "225": "http://202.79.40.181/iptvlivestream/netNTVNEPAL1500.stream/playlist.m3u8",
  "265": "http://202.79.40.181/iptvlivestream/netNTVNEWS1500.stream/playlist.m3u8",
  "262": "http://202.79.40.181/iptvlivestream/netNTVPLUS1500.stream/playlist.m3u8",
  "778": "http://202.79.40.181/iptvlivestream/netPRIMETV1500.stream/playlist.m3u8",
  "1312": "http://202.79.40.181/iptvlivestream/netMakaluTvHD.stream/playlist.m3u8",
  "429": "http://202.79.40.181/iptvlivestream/netJANTATV1500.stream/playlist.m3u8"
};
async function resolveChannelStreamUrl(chid, forceIntl = false) {
  const cacheKey = forceIntl ? `${chid}_intl` : chid;
  const now = Date.now();
  const cached = liveChannelUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }
  const candidateUrls = forceIntl ? [`http://tv.techjail.net/huritv9/getlink.php?CHID=${encodeURIComponent(chid)}&intl=1`] : [
    `http://tv.techjail.net/huritv9/getlink.php?CHID=${encodeURIComponent(chid)}&intl=1`,
    `http://tv.techjail.net/huritv9/getlink.php?CHID=${encodeURIComponent(chid)}`
  ];
  for (const linkFetchUrl of candidateUrls) {
    try {
      const linkRes = await fetch(linkFetchUrl, {
        headers: {
          "Referer": "http://tv.techjail.net/v9x9/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        signal: AbortSignal.timeout(3500)
      });
      const linkText = (await linkRes.text()).trim();
      if (linkText.startsWith("http://") || linkText.startsWith("https://")) {
        const streamUrl = normalizeUpstreamUrl(linkText);
        liveChannelUrlCache.set(cacheKey, { url: streamUrl, expiresAt: now + 12e4 });
        return streamUrl;
      }
    } catch (err) {
      const error = err;
      console.log(`[Stream] Link resolution notice for ${chid}: ${error.message}`);
    }
  }
  if (KNOWN_DIRECT_STREAMS[chid]) {
    const token = await getHimalayanWmsAuthToken(false);
    const directUrl = KNOWN_DIRECT_STREAMS[chid] + (token ? `?wmsAuthSign=${token}` : "");
    liveChannelUrlCache.set(cacheKey, { url: directUrl, expiresAt: now + 6e4 });
    return directUrl;
  }
  return "";
}
async function serveSelfHealedFallback(res, originalChid) {
  try {
    const freshUrl = await resolveChannelStreamUrl(originalChid, true);
    if (freshUrl) {
      const upRes = await fetch(freshUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Referer": "http://tv.techjail.net/" },
        signal: AbortSignal.timeout(4e3)
      });
      if (upRes.ok) {
        const txt = await upRes.text();
        const rewritten = rewriteM3u8Content(txt, freshUrl);
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Cache-Control", "no-cache");
        res.send(rewritten);
        return;
      }
    }
  } catch {
  }
  res.status(503).send("#EXTM3U\n#EXT-X-ERROR:STREAM_CURRENTLY_UNAVAILABLE\n");
}
async function handleLiveStreamRequest(req, res, forceIntl = false) {
  const { chid } = req.params;
  if (!chid) {
    res.status(400).json({ error: "Missing channel ID" });
    return;
  }
  const now = Date.now();
  const manifestCacheKey = `live_manifest_${chid}_${forceIntl ? "intl" : "std"}`;
  const cachedManifest = playlistCache.get(manifestCacheKey);
  if (cachedManifest && cachedManifest.expiresAt > now) {
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=1, stale-while-revalidate=2");
    res.send(cachedManifest.body);
    return;
  }
  const streamUrl = await resolveChannelStreamUrl(chid, forceIntl);
  if (!streamUrl) {
    if (cachedManifest) {
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(cachedManifest.body);
      return;
    }
    await serveSelfHealedFallback(res, chid);
    return;
  }
  try {
    const upstreamRes = await fetch(streamUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "http://tv.techjail.net/"
      },
      signal: AbortSignal.timeout(6e3)
    });
    if (!upstreamRes.ok) {
      if (cachedManifest) {
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send(cachedManifest.body);
        return;
      }
      liveChannelUrlCache.delete(forceIntl ? `${chid}_intl` : chid);
      await serveSelfHealedFallback(res, chid);
      return;
    }
    const playlistText = await upstreamRes.text();
    const rewritten = rewriteM3u8Content(playlistText, streamUrl);
    playlistCache.set(manifestCacheKey, {
      body: rewritten,
      expiresAt: now + 2500
    });
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=1, stale-while-revalidate=2");
    res.send(rewritten);
  } catch (err) {
    if (cachedManifest) {
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.send(cachedManifest.body);
      return;
    }
    liveChannelUrlCache.delete(forceIntl ? `${chid}_intl` : chid);
    await serveSelfHealedFallback(res, chid);
  }
}
var TOP_CHANNELS_TO_WARM = ["1413", "516", "238", "836"];
async function warmTopChannels() {
  for (const chid of TOP_CHANNELS_TO_WARM) {
    try {
      const streamUrl = await resolveChannelStreamUrl(chid, true);
      if (streamUrl) {
        const res = await fetch(streamUrl, {
          headers: { "User-Agent": "Mozilla/5.0", "Referer": "http://tv.techjail.net/" },
          signal: AbortSignal.timeout(3e3)
        });
        if (res.ok) {
          const text = await res.text();
          const rewritten = rewriteM3u8Content(text, streamUrl);
          playlistCache.set(`live_manifest_${chid}_intl`, {
            body: rewritten,
            expiresAt: Date.now() + 4e3
          });
          playlistCache.set(`live_manifest_${chid}_std`, {
            body: rewritten,
            expiresAt: Date.now() + 4e3
          });
        }
      }
    } catch {
    }
  }
}
setTimeout(() => {
  warmTopChannels().catch(() => {
  });
  setInterval(() => {
    warmTopChannels().catch(() => {
    });
  }, 12e4);
}, 2e3);
app.get("/api/stream/live/:chid.m3u8", (req, res) => handleLiveStreamRequest(req, res, false));
app.get("/api/stream/live-backup/:chid.m3u8", (req, res) => handleLiveStreamRequest(req, res, true));
app.get("/api/stream/ch/:chid.m3u8", (req, res) => handleLiveStreamRequest(req, res, false));
app.get("/api/stream/techjail/:chid.m3u8", (req, res) => handleLiveStreamRequest(req, res, false));
app.get("/api/channels/verified-status", (_req, res) => {
  res.json({
    ok: true,
    total: VERIFIED_CHANNEL_CHIDS.length,
    verifiedChids: VERIFIED_CHANNEL_CHIDS,
    timestamp: Date.now()
  });
});
var handleHimalayanStream = async (req, res) => {
  let rawFile = (req.params.file || req.params[0] || "").trim();
  let fileName = rawFile;
  if (!fileName || fileName === "playlist" || fileName === "playlist." || fileName === "playlist.m3u8" || fileName.endsWith("h-sports.m3u8") || fileName.endsWith("himalayan-sports.m3u8") || fileName.endsWith("fifa.m3u8")) {
    fileName = "playlist.m3u8";
  } else if (!fileName.includes(".")) {
    fileName = `${fileName}.m3u8`;
  }
  let queryStr = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  if (!queryStr.includes("wmsAuthSign=")) {
    const token = await getHimalayanWmsAuthToken(false);
    if (token) {
      queryStr = (queryStr ? queryStr + "&" : "?") + `wmsAuthSign=${token}`;
    }
  }
  const isPlaylist = fileName.endsWith(".m3u8");
  const now = Date.now();
  const cacheKey = `fifa26_${fileName}_${queryStr}`;
  if (isPlaylist) {
    const cached = playlistCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=1, stale-while-revalidate=2");
      res.send(cached.body);
      return;
    }
  } else {
    const cachedSeg = segmentCache.get(fileName);
    if (cachedSeg && cachedSeg.expiresAt > now) {
      res.setHeader("Content-Type", cachedSeg.contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
      res.setHeader("Content-Length", cachedSeg.buffer.length);
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
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Referer": "http://tv.techjail.net/",
            ...req.headers.range ? { "Range": req.headers.range } : {}
          },
          signal: AbortSignal.timeout(isPlaylist ? 4e3 : 8e3)
        });
        if (upstreamRes.status === 403 && attempt === 0) {
          const freshToken = await getHimalayanWmsAuthToken(true);
          queryStr = queryStr.replace(/wmsAuthSign=[^&]*/, `wmsAuthSign=${freshToken}`);
          if (!queryStr.includes("wmsAuthSign=")) {
            queryStr = (queryStr ? queryStr + "&" : "?") + `wmsAuthSign=${freshToken}`;
          }
          break;
        }
        if (upstreamRes.ok || upstreamRes.status === 206) {
          res.status(upstreamRes.status);
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "*");
          let contentType = "application/octet-stream";
          if (isPlaylist) {
            contentType = "application/vnd.apple.mpegurl; charset=utf-8";
          } else if (fileName.includes("audio") || fileName.startsWith("a_")) {
            contentType = "audio/mp4";
          } else if (fileName.includes("video") || fileName.startsWith("v_") || fileName.endsWith(".fmp4") || fileName.endsWith(".mp4")) {
            contentType = "video/mp4";
          }
          res.setHeader("Content-Type", contentType);
          const contentLength = upstreamRes.headers.get("content-length");
          if (contentLength) res.setHeader("Content-Length", contentLength);
          const contentRange = upstreamRes.headers.get("content-range");
          if (contentRange) res.setHeader("Content-Range", contentRange);
          const acceptRanges = upstreamRes.headers.get("accept-ranges");
          if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
          if (isPlaylist) {
            let bodyText = await upstreamRes.text();
            if (fileName === "video.m3u8" || fileName === "audio.m3u8") {
              bodyText = bodyText.split("\n").filter((line) => !line.startsWith("#EXT-X-PART") && !line.startsWith("#EXT-X-SERVER-CONTROL") && !line.startsWith("#EXT-X-PRELOAD-HINT")).join("\n");
            }
            res.setHeader("Cache-Control", "public, max-age=1, stale-while-revalidate=2");
            playlistCache.set(cacheKey, {
              body: bodyText,
              expiresAt: now + (fileName === "playlist.m3u8" ? 1800 : 1500)
            });
            res.send(bodyText);
            return;
          } else {
            res.setHeader("Cache-Control", "public, max-age=86400, immutable");
            if (upstreamRes.body) {
              const nodeStream = import_stream.Readable.fromWeb(upstreamRes.body);
              nodeStream.on("error", () => {
                if (!res.headersSent) res.status(502).end();
              });
              res.on("close", () => {
                if (!nodeStream.destroyed) nodeStream.destroy();
              });
              (0, import_stream.pipeline)(nodeStream, res, () => {
              });
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
  res.status(503).json({ error: "H Sports stream temporarily buffering, retrying..." });
};
app.get([
  "/fifa26/HimalayaSportsFifa026",
  "/fifa26/HimalayaSportsFifa026/",
  "/fifa26/HimalayaSportsFifa026/:file(*)",
  "/api/stream/h-sports.m3u8",
  "/api/stream/himalayan-sports.m3u8",
  "/api/stream/fifa.m3u8",
  "/api/stream/h-sports/:file(*)",
  "/api/stream/himalayan-sports/:file(*)",
  "/api/stream/video.m3u8",
  "/api/stream/audio.m3u8",
  "/api/stream/:file(*.fmp4)"
], handleHimalayanStream);
app.get("/api/stream/proxy", async (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== "string") {
    res.status(400).send("Missing url parameter");
    return;
  }
  targetUrl = normalizeUpstreamUrl(targetUrl);
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    res.status(400).send("Invalid url protocol");
    return;
  }
  const now = Date.now();
  const isPlaylist = targetUrl.includes(".m3u8");
  if (isPlaylist) {
    const cached = playlistCache.get(targetUrl);
    if (cached && cached.expiresAt > now) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "public, max-age=1, stale-while-revalidate=2");
      res.send(cached.body);
      return;
    }
  }
  try {
    const forwardHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Referer": "http://tv.techjail.net/"
    };
    if (req.headers.range) {
      forwardHeaders["Range"] = req.headers.range;
    }
    const upstreamRes = await fetch(targetUrl, {
      headers: forwardHeaders,
      signal: AbortSignal.timeout(isPlaylist ? 12e3 : 45e3)
    });
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    const contentType = upstreamRes.headers.get("content-type") || "";
    const isM3u8Response = isPlaylist || contentType.includes("mpegurl") || contentType.includes("x-mpegURL");
    if (isM3u8Response) {
      if (!upstreamRes.ok) {
        const cached = playlistCache.get(targetUrl);
        if (cached) {
          res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
          res.send(cached.body);
          return;
        }
        res.status(upstreamRes.status).send("Stream temporarily unavailable");
        return;
      }
      const text = await upstreamRes.text();
      const rewritten = rewriteM3u8Content(text, targetUrl);
      playlistCache.set(targetUrl, {
        body: rewritten,
        expiresAt: now + 2e3
      });
      res.status(upstreamRes.status);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "public, max-age=1, stale-while-revalidate=2");
      res.send(rewritten);
      return;
    }
    res.status(upstreamRes.status);
    const segContentType = contentType || (targetUrl.includes(".fmp4") || targetUrl.includes(".mp4") ? "video/mp4" : "video/MP2T");
    res.setHeader("Content-Type", segContentType);
    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) res.setHeader("Content-Range", contentRange);
    const acceptRanges = upstreamRes.headers.get("accept-ranges");
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    if (upstreamRes.body) {
      const nodeStream = import_stream.Readable.fromWeb(upstreamRes.body);
      nodeStream.on("error", (_err) => {
        if (!res.headersSent) {
          res.status(502).end();
        }
      });
      res.on("close", () => {
        if (!nodeStream.destroyed) {
          nodeStream.destroy();
        }
      });
      (0, import_stream.pipeline)(nodeStream, res, (_err) => {
      });
    } else {
      res.end();
    }
  } catch (err) {
    const error = err;
    if (!res.headersSent) {
      const cached = playlistCache.get(targetUrl);
      if (isPlaylist && cached) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.send(cached.body);
        return;
      }
      res.status(502).send("Error streaming media fragment: " + error.message);
    }
  }
});
app.post("/api/ai/stream", async (req, res) => {
  const { prompt, channelContext } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders?.();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ text: `\u0928\u092E\u0938\u094D\u0924\u0947! \u092E \u092C\u093F\u0937\u094D\u0923\u0941 (Bishnu AI) \u0939\u0941\u0901\u0964 \u092E \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u0916\u0947\u0932\u0915\u0941\u0926 \u0930 \u0932\u093E\u0907\u092D \u092A\u094D\u0930\u0938\u093E\u0930\u0923\u092E\u093E \u092E\u0926\u094D\u0926\u0924 \u0917\u0930\u094D\u0928 \u0924\u092F\u093E\u0930 \u091B\u0941\u0964 ${prompt}` })}

`);
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI();
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are the Bishnu AI Sports & Live TV Companion for the web portal. Answer helpfully and enthusiastically in Nepali (or English if prompted). Context: ${channelContext || "Watching live broadcast"}. User asks: ${prompt}`
            }
          ]
        }
      ]
    });
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}

`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : "Unknown AI error";
    console.warn("[AI Stream] Fallback triggered:", errMessage);
    res.write(`data: ${JSON.stringify({ text: `\u092E \u0924\u092A\u093E\u0908\u0901\u0915\u094B \u092A\u094D\u0930\u0924\u094D\u092F\u0915\u094D\u0937 \u092A\u094D\u0930\u0938\u093E\u0930\u0923 \u0938\u093E\u0925\u0940 \u0939\u0941\u0901\u0964 \u0916\u0947\u0932 \u0930 \u0915\u093E\u0930\u094D\u092F\u0915\u094D\u0930\u092E \u0928\u093F\u0930\u0928\u094D\u0924\u0930 \u0939\u0947\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D!` })}

`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});
async function startServer() {
  const httpServer = import_http.default.createServer(app);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT,
        hmr: {
          server: httpServer
        }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_fs.default.existsSync(import_path.default.join(__dirname, "index.html")) ? __dirname : import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  httpServer.on("error", (err) => {
    console.error("Server error on startup:", err);
  });
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  normalizeUpstreamUrl
});
//# sourceMappingURL=server.cjs.map
