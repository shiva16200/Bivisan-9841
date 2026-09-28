import React from 'react';
import { Link } from 'react-router-dom';
import { Tv, ArrowLeft, Radio } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center shadow-2xl">
        <Radio className="w-10 h-10 animate-pulse" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">404 - Channel Offline</h1>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          The transmission frequency or page you requested could not be located on the StreamLive network.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-950 transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Live TV Home
      </Link>
    </div>
  );
};
