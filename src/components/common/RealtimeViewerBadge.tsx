import React from 'react';
import { useChannelViews } from '../../services/viewCounterService';

interface RealtimeViewerBadgeProps {
  channelId?: string;
  initialCount?: number;
  className?: string;
  variant?: 'clickbait' | 'pill' | 'compact' | 'badge' | 'youtube' | 'minimal';
  showLabel?: boolean;
}

/**
 * Signature Live Views Badge
 * Displays persistent live viewer / views count styled with the signature
 * Himalayan Sports glowing live beacon dot and dark glass pill.
 */
export const RealtimeViewerBadge: React.FC<RealtimeViewerBadgeProps> = ({
  channelId,
  initialCount = 0,
  className = '',
  variant = 'youtube',
}) => {
  const { formatted, formattedExact } = useChannelViews(channelId, initialCount, variant === 'pill');

  // Signature Pulsing Live Beacon Indicator (matches Himalayan Sports live style)
  const renderLiveDot = (size: 'sm' | 'md' = 'md') => (
    <span className={`relative flex ${size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'} flex-shrink-0`}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className={`relative inline-flex rounded-full ${size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'} bg-red-500`} />
    </span>
  );

  // 1. VIDEO PLAYER OVERLAY PILL
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-black/85 backdrop-blur-md text-white border border-white/20 shadow-xl shadow-black/60 select-none transition-all ${className}`}
        title={formattedExact}
        aria-label={formattedExact}
      >
        {renderLiveDot('md')}
        <span className="font-bold text-white tracking-tight whitespace-nowrap">
          {formatted}
        </span>
      </div>
    );
  }

  // 2. COMPACT VARIANT (Used on channel cards & metadata lists)
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-black/80 backdrop-blur-md text-slate-100 border border-white/15 shadow-sm select-none transition-all ${className}`}
        title={formattedExact}
        aria-label={formattedExact}
      >
        {renderLiveDot('sm')}
        <span className="font-semibold text-slate-100 tracking-tight whitespace-nowrap">
          {formatted}
        </span>
      </div>
    );
  }

  // 3. YOUTUBE / STANDARD SIGNATURE LIVE BADGE (Default Himalayan Sports style)
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/80 backdrop-blur-md text-white border border-white/15 shadow-md select-none transition-all ${className}`}
      title={formattedExact}
      aria-label={formattedExact}
    >
      {renderLiveDot('md')}
      <span className="font-semibold text-slate-100 tracking-tight whitespace-nowrap">
        {formatted}
      </span>
    </div>
  );
};
