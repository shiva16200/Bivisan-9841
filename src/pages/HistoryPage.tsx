import React from 'react';
import { Link } from 'react-router-dom';
import { History, Trash2, Play, X, Clock, Tv } from 'lucide-react';
import { useHistory } from '../context/HistoryContext';
import { usePlayer } from '../context/PlayerContext';
import { EmptyState } from '../components/common/EmptyState';
import { fetchChannelById } from '../services/channelService';

export const HistoryPage: React.FC = () => {
  const { history, removeFromHistory, clearHistory } = useHistory();
  const { playChannel } = usePlayer();

  const handleTuneIn = async (channelId: string) => {
    const ch = await fetchChannelById(channelId);
    if (ch) {
      playChannel(ch, true);
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div id="history-page" className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Watch History
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Revisit broadcasts you recently watched and pick up where you left off.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon={Tv}
          title="No watch history yet"
          description="Channels you tune in to will appear here automatically so you can resume anytime."
          actionLabel="Watch Live TV"
          actionHref="/live"
        />
      ) : (
        <div className="space-y-2.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 transition-all group"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <Link to={`/channel/${item.channelId}`} className="flex-shrink-0">
                  <img
                    src={item.channelLogo}
                    alt={item.channelName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-800 bg-slate-950"
                  />
                </Link>

                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/channel/${item.channelId}`}
                      className="text-sm font-bold text-white hover:text-indigo-400 transition-colors truncate"
                    >
                      {item.channelName}
                    </Link>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Watched {formatTimestamp(item.watchedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleTuneIn(item.channelId)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden sm:inline">Watch Now</span>
                </button>

                <button
                  onClick={() => removeFromHistory(item.channelId)}
                  aria-label="Remove item from history"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
