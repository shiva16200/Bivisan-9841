import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid, ChevronRight, Tv } from 'lucide-react';
import { CATEGORIES } from '../data/demoChannels';
import { fetchChannels } from '../services/channelService';
import { Channel } from '../types';

export const CategoriesPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    fetchChannels().then(setChannels);
  }, []);

  return (
    <div id="categories-directory-page" className="space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Grid className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Browse Channels by Category
          </h1>
        </div>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Explore specialized broadcast genres from 24/7 breaking news to live esports, cinema, and nature documentaries.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {CATEGORIES.map((cat) => {
          const categoryChannels = channels.filter((c) => {
            const chCat = c.category.toLowerCase();
            const catName = cat.name.toLowerCase();
            if (
              (catName === 'athletics & sports' || catName === 'sports') &&
              (chCat === 'sports' || chCat === 'athletics & sports')
            ) {
              return true;
            }
            return chCat === catName;
          });

          return (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group relative p-6 rounded-3xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.gradient} flex items-center justify-center text-white font-extrabold text-lg shadow-lg`}
                >
                  {cat.name[0]}
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800/80 text-indigo-300 border border-slate-700/60">
                  {categoryChannels.length} Live Channels
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors mb-1">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {cat.description}
              </p>

              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 pt-4 mt-2 border-t border-slate-800/60">
                <span>View {cat.name} channels</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
