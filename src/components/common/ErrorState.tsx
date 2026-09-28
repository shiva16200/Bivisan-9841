import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Playback or Loading Error',
  message,
  onRetry,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-200 text-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-3 px-2 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-100 rounded-md font-medium text-xs flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      id="error-state-card"
      className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-rose-950/20 border border-rose-900/40 rounded-3xl max-w-md mx-auto my-6"
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/40">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-rose-100 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all shadow-md shadow-rose-950/40 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      )}
    </div>
  );
};
