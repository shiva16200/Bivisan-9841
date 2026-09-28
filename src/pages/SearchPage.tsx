import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Clock, Trash2, TrendingUp, Tv, Sparkles, Filter } from 'lucide-react';
import { Channel } from '../types';
import { fetchChannels } from '../services/channelService';
import { ChannelGrid } from '../components/channel/ChannelGrid';

const RECENT_SEARCHES_KEY = 'streamlive_recent_search_queries';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    let isMounted = true;
    fetchChannels().then((list) => {
      if (isMounted) {
        setChannels(list.filter((c) => c.active));
        setLoading(false);
      }
    });

    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // ignore
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const saveQueryToRecent = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveQueryToRecent(query);
      setSearchParams({ q: query.trim() });
    }
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    saveQueryToRecent(term);
    setSearchParams({ q: term });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ['All', ...Array.from(set)];
  }, [channels]);

  const filteredChannels = useMemo(() => {
    let result = channels;

    if (selectedCategory !== 'All') {
      result = result.filter(
        (c) => c.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (!query.trim()) {
      return selectedCategory === 'All' ? [] : result;
    }

    const q = query.toLowerCase().trim();
    return result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.countryCode.toLowerCase().includes(q) ||
        c.language.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [channels, query, selectedCategory]);

  const quickPills = [
    'Sports',
    'News',
    'Kantipur',
    'Sony Sports',
    'Star Sports',
    'Entertainment',
    'Music',
    'HD Channels'
  ];

  return (
    <div id="streamlive-search-page" className="space-y-6 max-w-6xl mx-auto px-1 sm:px-0">
      {/* Search Header and Input */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Tv className="w-7 h-7 text-indigo-500" />
            <span>Search Live TV Channels</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Instant search across 200+ Nepali, Indian, and International broadcast live streams.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
          <input
            id="search-main-input"
            type="text"
            placeholder="Search channel name, sports network, news, category, or country..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) {
                setSearchParams({ q: e.target.value.trim() }, { replace: true });
              } else {
                setSearchParams({}, { replace: true });
              }
            }}
            className="w-full pl-12 pr-12 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xl transition-all"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchParams({});
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <TrendingUp className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-400 flex-shrink-0">Popular:</span>
          {quickPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleSelectRecent(pill)}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/50 transition-all whitespace-nowrap"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && !query.trim() && selectedCategory === 'All' && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Recent Searches</span>
            </div>
            <button
              onClick={clearRecentSearches}
              className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectRecent(term)}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 border border-slate-700/60 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      {query.trim() || selectedCategory !== 'All' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">
                Live Channels ({filteredChannels.length})
              </h2>
            </div>
            {query.trim() && (
              <span className="text-xs text-slate-400">
                Matches for &ldquo;{query}&rdquo;
              </span>
            )}
          </div>

          <ChannelGrid
            channels={filteredChannels}
            loading={loading}
            emptyTitle={`No channels match "${query}"`}
            emptyDescription="Try searching for another network, sports name, or clear filters."
            emptyActionLabel="Explore All Live TV"
            emptyActionHref="/live"
          />
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          {/* Top Live Channels */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Featured Broadcast Channels
              </h3>
            </div>
            <ChannelGrid channels={channels.slice(0, 12)} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
};
