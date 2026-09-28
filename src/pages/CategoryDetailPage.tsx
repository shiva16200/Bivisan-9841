import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Grid } from 'lucide-react';
import { CATEGORIES } from '../data/demoChannels';
import { fetchChannels } from '../services/channelService';
import { Channel } from '../types';
import { ChannelGrid } from '../components/channel/ChannelGrid';

export const CategoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryMeta = CATEGORIES.find(
    (c) =>
      c.slug === slug ||
      c.name.toLowerCase() === slug?.toLowerCase() ||
      (slug === 'sports' && (c.id === 'sports' || c.name.toLowerCase().includes('sports')))
  );

  const categoryName = categoryMeta?.name || slug || 'Category';

  useEffect(() => {
    let isMounted = true;
    fetchChannels().then((list) => {
      if (isMounted) {
        const catNameLower = categoryName.toLowerCase();
        const filtered = list.filter((c) => {
          const chCat = c.category.toLowerCase();
          if (
            (catNameLower === 'athletics & sports' || catNameLower === 'sports') &&
            (chCat === 'sports' || chCat === 'athletics & sports')
          ) {
            return true;
          }
          return chCat === catNameLower;
        });
        setChannels(filtered);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [categoryName]);

  return (
    <div id="category-detail-page" className="space-y-6">
      <Link
        to="/categories"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Categories</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                categoryMeta?.gradient || 'from-indigo-600 to-blue-500'
              } flex items-center justify-center text-white font-bold text-sm shadow-md`}
            >
              {categoryName[0]}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {categoryName} Channels
            </h1>
          </div>
          {categoryMeta && (
            <p className="text-xs md:text-sm text-slate-400 mt-1">{categoryMeta.description}</p>
          )}
        </div>

        <span className="text-xs text-slate-400">
          Showing <strong className="text-white">{channels.length}</strong> channels
        </span>
      </div>

      <ChannelGrid
        channels={channels}
        loading={loading}
        emptyTitle={`No ${categoryName} channels currently available`}
        emptyDescription="Check back soon as new authorized broadcasters are added regularly."
        emptyActionLabel="Browse All Live TV"
        emptyActionHref="/live"
      />
    </div>
  );
};
