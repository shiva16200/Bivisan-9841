import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Heart,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { Channel } from '../types';
import { fetchChannels } from '../services/channelService';
import { CATEGORIES, COUNTRIES, LANGUAGES } from '../data/demoChannels';
import { ChannelGrid } from '../components/channel/ChannelGrid';
import { useFavorites } from '../context/FavoritesContext';

export const LiveChannelsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { favorites } = useFavorites();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'all');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || 'all');
  const [onlyFavorites, setOnlyFavorites] = useState(searchParams.get('favorites') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchChannels().then((data) => {
      if (isMounted) {
        setChannels(data.filter((c) => c.active));
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state to URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedCountry !== 'all') params.country = selectedCountry;
    if (selectedLanguage !== 'all') params.language = selectedLanguage;
    if (onlyFavorites) params.favorites = 'true';
    if (sortBy !== 'popularity') params.sort = sortBy;
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, selectedCountry, selectedLanguage, onlyFavorites, sortBy, setSearchParams]);

  // Filtered and sorted channels
  const filteredChannels = useMemo(() => {
    let list = [...channels];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.language.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      const filterCat = selectedCategory.toLowerCase();
      list = list.filter((c) => {
        const chCat = c.category.toLowerCase();
        if (filterCat === 'nepal-tv' || filterCat === 'nepal tv' || filterCat === 'nepal' || filterCat === 'nettv' || filterCat === 'nettv nepal') {
          return c.country === 'Nepal' || chCat.includes('nepal');
        }
        if (
          (filterCat === 'athletics & sports' || filterCat === 'sports') &&
          (chCat === 'sports' || chCat === 'athletics & sports')
        ) {
          return true;
        }
        return chCat === filterCat || chCat.includes(filterCat);
      });
    }

    // Country filter
    if (selectedCountry !== 'all') {
      list = list.filter(
        (c) => c.countryCode.toLowerCase() === selectedCountry.toLowerCase()
      );
    }

    // Language filter
    if (selectedLanguage !== 'all') {
      list = list.filter(
        (c) =>
          c.languageCode?.toLowerCase() === selectedLanguage.toLowerCase() ||
          c.language.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    // Favorites only
    if (onlyFavorites) {
      list = list.filter((c) => favorites.includes(c.id));
    }

    // Sorting
    if (sortBy === 'popularity') {
      list.sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [channels, searchQuery, selectedCategory, selectedCountry, selectedLanguage, onlyFavorites, sortBy, favorites]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCountry('all');
    setSelectedLanguage('all');
    setOnlyFavorites(false);
    setSortBy('popularity');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    selectedCountry !== 'all' ||
    selectedLanguage !== 'all' ||
    onlyFavorites;

  return (
    <div id="live-channels-page" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Live TV Channels
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Watch verified legal and authorized TV broadcasts from around the world.
          </p>
        </div>

        {/* View Mode Switcher & Filter Drawer Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`md:hidden px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              hasActiveFilters ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Desktop & Collapsible Mobile) */}
      <div className={`space-y-4 ${showFilterDrawer ? 'block' : 'hidden md:block'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search bar inside toolbar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, genre, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Country Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Countries</option>
            {COUNTRIES.map((cty) => (
              <option key={cty.code} value={cty.code}>
                {cty.flag} {cty.name}
              </option>
            ))}
          </select>

          {/* Language Selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Languages</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filter Badges & Sort Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                onlyFavorites
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : ''}`} />
              <span>Favorites Only</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="popularity">Most Popular</option>
              <option value="name">Channel Name (A-Z)</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing <strong className="text-white">{filteredChannels.length}</strong> live channels
        </span>
      </div>

      {/* Main Channels Grid / List */}
      <ChannelGrid
        channels={filteredChannels}
        loading={loading}
        viewMode={viewMode}
        emptyTitle="No live channels match your filters"
        emptyDescription="Try clearing some of your filter criteria or search with a different keyword."
        emptyActionLabel="Clear All Filters"
        emptyActionHref="/live"
      />
    </div>
  );
};
