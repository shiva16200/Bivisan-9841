import React, { useState, useEffect } from 'react';
import { Channel } from '../../types';
import { ChannelCard } from './ChannelCard';
import { ChannelCardSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { Tv, ChevronDown } from 'lucide-react';

interface ChannelGridProps {
  channels: Channel[];
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  initialPageSize?: number;
}

export const ChannelGrid: React.FC<ChannelGridProps> = ({
  channels,
  loading = false,
  viewMode = 'grid',
  emptyTitle = 'No channels found',
  emptyDescription = 'Try adjusting your filters or search keywords to discover live streams.',
  emptyActionLabel = 'Browse All Live TV',
  emptyActionHref = '/live',
  initialPageSize = 32,
}) => {
  const [displayCount, setDisplayCount] = useState(initialPageSize);

  // Reset display count when channels list changes (e.g. search query or filter change)
  useEffect(() => {
    setDisplayCount(initialPageSize);
  }, [channels.length, initialPageSize]);

  if (loading) {
    return (
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
            : 'space-y-3'
        }
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <ChannelCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <EmptyState
        icon={Tv}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
      />
    );
  }

  const visibleChannels = channels.slice(0, displayCount);
  const hasMore = channels.length > displayCount;

  return (
    <div className="space-y-6">
      <div
        id="channel-grid"
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
            : 'space-y-3'
        }
      >
        {visibleChannels.map((channel) => (
          <ChannelCard key={channel.id} channel={channel} viewMode={viewMode} />
        ))}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center justify-center pt-4 pb-8 space-y-2">
          <button
            onClick={() => setDisplayCount((prev) => prev + initialPageSize)}
            className="px-6 py-2.5 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <span>थप च्यानलहरू हेर्नुहोस् (Load More Channels)</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-slate-400 font-semibold">
            Showing {visibleChannels.length} of {channels.length} Live Channels
          </span>
        </div>
      )}
    </div>
  );
};
