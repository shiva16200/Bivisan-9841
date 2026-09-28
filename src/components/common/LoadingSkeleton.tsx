import React from 'react';

export const ChannelCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 overflow-hidden animate-pulse flex flex-col gap-3">
      <div className="w-full aspect-video bg-slate-800/60 rounded-xl relative overflow-hidden">
        <div className="absolute top-3 left-3 w-14 h-5 bg-slate-700/60 rounded-md" />
        <div className="absolute top-3 right-3 w-8 h-8 bg-slate-700/60 rounded-full" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-800/80 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-800/80 rounded w-3/4" />
          <div className="h-3 bg-slate-800/50 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-slate-800/40 rounded w-full mt-1" />
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
        <div className="h-4 bg-slate-800/60 rounded w-16" />
        <div className="h-4 bg-slate-800/60 rounded w-20" />
      </div>
    </div>
  );
};

export const HeroSkeleton: React.FC = () => {
  return (
    <div className="w-full aspect-[21/9] min-h-[360px] rounded-3xl bg-slate-900/80 border border-slate-800/80 p-6 md:p-12 animate-pulse flex flex-col justify-end space-y-4">
      <div className="w-24 h-7 bg-slate-800 rounded-full" />
      <div className="w-2/3 h-10 bg-slate-800 rounded-xl" />
      <div className="w-1/2 h-5 bg-slate-800/70 rounded-lg" />
      <div className="flex gap-4 pt-4">
        <div className="w-36 h-12 bg-slate-800 rounded-xl" />
        <div className="w-32 h-12 bg-slate-800/60 rounded-xl" />
      </div>
    </div>
  );
};

export const GuideRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-800/60 animate-pulse">
      <div className="w-48 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-slate-800" />
        <div className="w-28 h-4 bg-slate-800 rounded" />
      </div>
      <div className="flex-1 flex gap-3 overflow-hidden">
        <div className="h-14 bg-slate-800/70 rounded-xl flex-1" />
        <div className="h-14 bg-slate-800/40 rounded-xl w-64" />
        <div className="h-14 bg-slate-800/30 rounded-xl w-48" />
      </div>
    </div>
  );
};
