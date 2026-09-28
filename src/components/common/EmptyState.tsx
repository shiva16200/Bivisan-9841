import React from 'react';
import { LucideIcon, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Tv,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}) => {
  return (
    <div
      id="empty-state"
      className="flex flex-col items-center justify-center p-8 md:p-14 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl max-w-lg mx-auto my-8"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-950/20">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-sm">{description}</p>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-900/30 active:scale-95"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-900/30 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
