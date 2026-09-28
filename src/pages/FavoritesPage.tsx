import React, { useState, useEffect } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { Channel } from '../types';
import { fetchChannels } from '../services/channelService';
import { useFavorites } from '../context/FavoritesContext';
import { ChannelGrid } from '../components/channel/ChannelGrid';

export const FavoritesPage: React.FC = () => {
  const { favorites, clearFavorites } = useFavorites();
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchChannels().then((data) => {
      if (isMounted) {
        setAllChannels(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const favoriteChannels = allChannels.filter((c) => favorites.includes(c.id));

  return (
    <div id="favorites-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Favorite Channels
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Fast access to your pinned and saved live TV channels across all your devices.
          </p>
        </div>

        {favoriteChannels.length > 0 && (
          <button
            onClick={clearFavorites}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Favorites</span>
          </button>
        )}
      </div>

      <ChannelGrid
        channels={favoriteChannels}
        loading={loading}
        emptyTitle="No favorite channels yet"
        emptyDescription="Heart your favorite channels while browsing or watching to pin them here for rapid tune-in."
        emptyActionLabel="Browse Live Channels"
        emptyActionHref="/live"
      />
    </div>
  );
};
