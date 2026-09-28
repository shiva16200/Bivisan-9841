import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Heart,
  ChevronRight,
  TrendingUp,
  Sparkles,
  History,
  Grid,
  Clock,
  Eye,
  Search,
  Zap,
  Tv,
  Radio,
  SlidersHorizontal,
  Newspaper,
} from 'lucide-react';
import { Channel, Program } from '../types';
import { fetchChannels } from '../services/channelService';
import { fetchProgramsForChannel, getCurrentAndNextProgram } from '../services/epgService';
import { CATEGORIES } from '../data/demoChannels';
import { ChannelCard } from '../components/channel/ChannelCard';
import { HeroSkeleton, ChannelCardSkeleton } from '../components/common/LoadingSkeleton';
import { useFavorites } from '../context/FavoritesContext';
import { useHistory } from '../context/HistoryContext';
import { usePlayer } from '../context/PlayerContext';
import { RealtimeViewerBadge } from '../components/common/RealtimeViewerBadge';
import { LivePlayer } from '../components/player/LivePlayer';
import { incrementChannelView } from '../services/viewCounterService';
import { INITIAL_CHANNELS } from '../data/demoChannels';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { history } = useHistory();
  const { playChannel } = usePlayer();

  const initialFeatured =
    INITIAL_CHANNELS.find((c) => c.name === 'H Sports' || c.id === 'himalayan-sports') || INITIAL_CHANNELS[0];
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [loading, setLoading] = useState(false);
  const [featuredChannel, setFeaturedChannel] = useState<Channel | null>(initialFeatured);
  const [featuredProg, setFeaturedProg] = useState<{
    current: Program | null;
    next: Program | null;
    progressPercent: number;
  }>({ current: null, next: null, progressPercent: 0 });
  const [zapperCategory, setZapperCategory] = useState<
    'all' | 'sports' | 'nepal' | 'news' | 'entertainment' | 'music' | 'kids' | 'devotional'
  >('all');
  const [zapperSearchQuery, setZapperSearchQuery] = useState('');
  const [directoryCategory, setDirectoryCategory] = useState<string>('All');
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchChannels().then((allChannels) => {
      if (isMounted) {
        setChannels(allChannels);
        // Automatically find and prioritize the single canonical H Sports channel.
        const featured =
          allChannels.find(
            (c) =>
              c.name === 'H Sports' ||
              c.slug === 'h-sports' ||
              c.id === 'himalayan-sports' ||
              c.id === 'h-sports'
          ) ||
          allChannels.find((c) => c.featured && c.active) ||
          allChannels[0];

        setFeaturedChannel(featured);
        setLoading(false);

        if (featured) {
          playChannel(featured, true);
          incrementChannelView(featured.id, featured.viewerCount);
          fetchProgramsForChannel(featured.id).then((progs) => {
            if (isMounted) {
              setFeaturedProg(getCurrentAndNextProgram(progs));
            }
          });
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [playChannel]);

  // Sports channels
  const sportsChannels = useMemo(() => {
    return channels.filter(
      (c) =>
        c.category === 'Athletics & Sports' ||
        c.category === 'Sports' ||
        c.name.toLowerCase().includes('sports') ||
        c.name.toLowerCase().includes('football') ||
        c.name.toLowerCase().includes('cricket')
    );
  }, [channels]);

  // Nepali Live TV channels
  const nepaliChannels = useMemo(() => {
    return channels.filter(
      (c) => c.country === 'Nepal' || c.category.toLowerCase().includes('nepal') || c.language === 'Nepali'
    );
  }, [channels]);

  // 24/7 Live News channels
  const newsChannels = useMemo(() => {
    return channels.filter(
      (c) => c.category.toLowerCase() === 'news' || c.name.toLowerCase().includes('news')
    );
  }, [channels]);

  // Entertainment channels
  const entertainmentChannels = useMemo(() => {
    return channels.filter((c) => c.category.toLowerCase() === 'entertainment');
  }, [channels]);

  // Music channels
  const musicChannels = useMemo(() => {
    return channels.filter((c) => c.category.toLowerCase() === 'music');
  }, [channels]);

  // Kids channels
  const kidsChannels = useMemo(() => {
    return channels.filter((c) => c.category.toLowerCase() === 'kids');
  }, [channels]);

  // Devotional channels
  const devotionalChannels = useMemo(() => {
    return channels.filter(
      (c) => c.category.toLowerCase().includes('devotional') || c.category.toLowerCase().includes('culture')
    );
  }, [channels]);

  // Popular channels (sorted by viewers)
  const popularChannels = useMemo(() => {
    return [...channels].sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0)).slice(0, 12);
  }, [channels]);

  // Recommended channels (different categories)
  const recommendedChannels = useMemo(() => {
    return channels.filter((c) => c.id !== featuredChannel?.id).slice(0, 8);
  }, [channels, featuredChannel]);

  // Favorite channels
  const favoriteChannels = useMemo(() => {
    return channels.filter((c) => favorites.includes(c.id));
  }, [channels, favorites]);

  // Recently watched channels
  const continueWatchingChannels = useMemo(() => {
    const channelIds = history.map((h) => h.channelId);
    return channels.filter((c) => channelIds.includes(c.id)).slice(0, 6);
  }, [channels, history]);

  const heroSectionRef = useRef<HTMLDivElement | null>(null);

  const handleSelectFeaturedChannel = useCallback((ch: Channel) => {
    setFeaturedChannel(ch);
    playChannel(ch, true);
    incrementChannelView(ch.id, ch.viewerCount);
    fetchProgramsForChannel(ch.id).then((progs) => {
      setFeaturedProg(getCurrentAndNextProgram(progs));
    });
    if (heroSectionRef.current) {
      heroSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [playChannel]);

  // Curated channels for instant zero-lag TV zapping on Home screen
  const quickSwitchChannels = useMemo(() => {
    let pool = channels;
    if (zapperCategory === 'sports') {
      pool = sportsChannels;
    } else if (zapperCategory === 'nepal') {
      pool = nepaliChannels;
    } else if (zapperCategory === 'news') {
      pool = newsChannels;
    } else if (zapperCategory === 'entertainment') {
      pool = entertainmentChannels;
    } else if (zapperCategory === 'music') {
      pool = musicChannels;
    } else if (zapperCategory === 'kids') {
      pool = kidsChannels;
    } else if (zapperCategory === 'devotional') {
      pool = devotionalChannels;
    }

    if (zapperSearchQuery.trim()) {
      const q = zapperSearchQuery.toLowerCase().trim();
      pool = pool.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.channelNumber?.toString() === q
      );
    }

    const list: Channel[] = [];
    const seen = new Set<string>();

    if (featuredChannel && (zapperCategory === 'all' || pool.some((c) => c.id === featuredChannel.id))) {
      list.push(featuredChannel);
      seen.add(featuredChannel.id);
    }

    pool.forEach((c) => {
      if (list.length < 120 && !seen.has(c.id)) {
        list.push(c);
        seen.add(c.id);
      }
    });

    return list;
  }, [
    channels,
    zapperCategory,
    zapperSearchQuery,
    sportsChannels,
    nepaliChannels,
    newsChannels,
    entertainmentChannels,
    musicChannels,
    kidsChannels,
    devotionalChannels,
    featuredChannel,
  ]);

  // Full Directory category tabs
  const directoryCategoriesList = useMemo(() => {
    return [
      'All',
      'Sports',
      'Nepal TV',
      'News',
      'Entertainment',
      'Music',
      'Kids',
      'Devotional & Culture',
    ];
  }, []);

  const [visibleCount, setVisibleCount] = useState(24);

  const directoryFilteredChannels = useMemo(() => {
    let list = channels;
    if (directoryCategory === 'Sports') {
      list = sportsChannels;
    } else if (directoryCategory === 'Nepal TV') {
      list = nepaliChannels;
    } else if (directoryCategory === 'News') {
      list = newsChannels;
    } else if (directoryCategory === 'Entertainment') {
      list = entertainmentChannels;
    } else if (directoryCategory === 'Music') {
      list = musicChannels;
    } else if (directoryCategory === 'Kids') {
      list = kidsChannels;
    } else if (directoryCategory === 'Devotional & Culture') {
      list = devotionalChannels;
    }

    if (directorySearchQuery.trim()) {
      const q = directorySearchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.language.toLowerCase().includes(q)
      );
    }

    return list;
  }, [
    channels,
    directoryCategory,
    directorySearchQuery,
    sportsChannels,
    nepaliChannels,
    newsChannels,
    entertainmentChannels,
    musicChannels,
    kidsChannels,
    devotionalChannels,
  ]);

  if (loading) {
    return (
      <div className="space-y-10">
        <HeroSkeleton />
        <div className="space-y-4">
          <div className="h-6 bg-slate-800 rounded w-48 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ChannelCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="streamlive-home-page" className="space-y-12 animate-in fade-in duration-300">
      {/* 1. Featured Live Channel Hero Banner with Auto-playing TV & Instant Channel Zapper */}
      {featuredChannel && (
        <section ref={heroSectionRef} id="featured-hero" className="space-y-3 sm:space-y-4">
          <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
            <LivePlayer
              channel={featuredChannel}
              currentProgram={featuredProg.current}
              nextProgram={featuredProg.next}
              autoPlay={true}
              minimalInline={true}
            />
          </div>

          {/* Quick TV Channel Switcher Bar with Category Filters (Instant Tuning - faster than TV) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-black uppercase tracking-wider text-rose-400 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>TV Remote Zapper:</span>
              </div>

              {/* Inline filter search for instant TV tuning */}
              <div className="relative flex-1 max-w-xs min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Find channel (e.g. Kantipur, Sony)..."
                  value={zapperSearchQuery}
                  onChange={(e) => setZapperSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Category selector row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All Live' },
                { id: 'sports', label: '⚽ Sports' },
                { id: 'nepal', label: '🇳🇵 Nepal TV' },
                { id: 'news', label: '📰 News' },
                { id: 'entertainment', label: '🎭 Entertainment' },
                { id: 'music', label: '🎵 Music' },
                { id: 'kids', label: '👶 Kids' },
                { id: 'devotional', label: '🕉️ Devotional' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setZapperCategory(tab.id as any);
                    setZapperSearchQuery('');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    zapperCategory === tab.id
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {quickSwitchChannels.map((ch) => {
                const isActive = featuredChannel?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleSelectFeaturedChannel(ch)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer active:scale-95 border ${
                      isActive
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                    title={`Switch to ${ch.name}`}
                  >
                    {ch.logo ? (
                      <img src={ch.logo} alt={ch.name} className="w-4 h-4 rounded-md object-cover bg-slate-950 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-md bg-indigo-600 flex items-center justify-center text-[9px] text-white flex-shrink-0">
                        {ch.name.charAt(0)}
                      </span>
                    )}
                    <span className="truncate max-w-[120px]">{ch.name}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Professional Channel Details Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              {featuredChannel.logo ? (
                <img
                  src={featuredChannel.logo}
                  alt={featuredChannel.name}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover bg-slate-950 border border-white/10 shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                  {featuredChannel.name.charAt(0)}
                </div>
              )}
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white truncate">
                    {featuredChannel.name}
                  </h2>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                    {featuredChannel.category}
                  </span>
                </div>
                {featuredProg.current ? (
                  <p className="text-xs text-slate-300 truncate">
                    <span className="text-slate-400 font-medium">Now:</span> {featuredProg.current.title}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 truncate">
                    {featuredChannel.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Link
                to={`/channel/${featuredChannel.id}`}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 active:scale-95 flex-shrink-0"
              >
                <span>Channel Details & EPG</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. Continue Watching (Recently Watched) */}
      {continueWatchingChannels.length > 0 && (
        <section id="continue-watching-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Continue Watching
              </h2>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All History</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {continueWatchingChannels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} onSelect={handleSelectFeaturedChannel} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Popular Live Channels */}
      <section id="popular-channels-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Popular Live Channels
            </h2>
          </div>
          <Link
            to="/live?sort=popularity"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Explore All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {popularChannels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} onSelect={handleSelectFeaturedChannel} />
          ))}
        </div>
      </section>

      {/* Nepal Live Channels Showcase */}
      {nepaliChannels.length > 0 && (
        <section id="nepal-tv-section" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-950/30 via-slate-900/60 to-slate-900/40 p-4 sm:p-5 rounded-2xl border border-red-900/30">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-600 text-white tracking-wider shadow-md shadow-rose-950/50">
                NEPAL LIVE
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Nepal Live TV (नेपाली च्यानलहरू)
                </h2>
                <p className="text-xs text-slate-400">
                  Kantipur TV HD, AP1 HD, NTV, HD Sports, Music & Entertainment
                </p>
              </div>
            </div>
            <Link
              to="/live?category=nepal-tv"
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <span>View All Nepal Channels</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {nepaliChannels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} onSelect={handleSelectFeaturedChannel} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Live Sports & Athletics Showcase */}
      {sportsChannels.length > 0 && (
        <section id="sports-channels-section" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 p-4 sm:p-5 rounded-2xl border border-emerald-800/40">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white tracking-wider shadow-md shadow-emerald-950/50">
                LIVE SPORTS
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Live Sports & Matches (लाइभ खेलकुद)
                </h2>
                <p className="text-xs text-slate-400">
                  HD Sports, Sports 18, Football, Cricket, Premier League & International Tournaments
                </p>
              </div>
            </div>
            <Link
              to="/live?category=athletics%20%26%20sports"
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <span>View All Sports Channels</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {sportsChannels.slice(0, 8).map((channel) => (
              <ChannelCard key={channel.id} channel={channel} onSelect={handleSelectFeaturedChannel} />
            ))}
          </div>
        </section>
      )}

      {/* 5. 24/7 Live News Channels */}
      {newsChannels.length > 0 && (
        <section id="news-channels-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                24/7 Live News (ताजा समाचार)
              </h2>
            </div>
            <Link
              to="/live?category=news"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Explore All News</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newsChannels.slice(0, 8).map((channel) => (
              <ChannelCard key={channel.id} channel={channel} onSelect={handleSelectFeaturedChannel} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Entertainment & Drama Channels */}
      {entertainmentChannels.length > 0 && (
        <section id="entertainment-channels-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Entertainment & Primetime Shows
              </h2>
            </div>
            <Link
              to="/live?category=entertainment"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Explore All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {entertainmentChannels.slice(0, 8).map((channel) => (
              <ChannelCard key={channel.id} channel={channel} onSelect={handleSelectFeaturedChannel} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Categories Carousel / Grid */}
      <section id="categories-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Browse by Category
            </h2>
          </div>
          <Link
            to="/categories"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat) => {
            const count = channels.filter((c) => {
              const chCat = c.category.toLowerCase();
              const catName = cat.name.toLowerCase();
              if (
                (catName === 'athletics & sports' || catName === 'sports') &&
                (chCat === 'sports' || chCat === 'athletics & sports')
              ) {
                return true;
              }
              return chCat === catName;
            }).length;
            return (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group relative p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all hover:-translate-y-1 overflow-hidden"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${cat.gradient} flex items-center justify-center text-white font-bold mb-3 shadow-md`}
                >
                  {cat.name[0]}
                </div>
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {count} channels
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. Recommended Channels */}
      <section id="recommended-channels-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Recommended For You
            </h2>
          </div>
          <Link
            to="/live"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>See More</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {recommendedChannels.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      </section>

      {/* 6. Favorites Preview (if any) */}
      {favoriteChannels.length > 0 && (
        <section id="home-favorites-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Your Favorite Channels
              </h2>
            </div>
            <Link
              to="/favorites"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Manage Favorites</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {favoriteChannels.slice(0, 4).map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
