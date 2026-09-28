import React, { useEffect, useState } from 'react';
import { Calendar, Info } from 'lucide-react';
import { Channel } from '../types';
import { fetchChannels } from '../services/channelService';
import { ProgramGuide } from '../components/guide/ProgramGuide';

export const GuidePage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchChannels().then((data) => {
      if (isMounted) {
        setChannels(data.filter((c) => c.active));
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div id="tv-guide-page" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Electronic Program Guide (EPG)
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Browse multi-channel broadcast schedules, see what is airing live, and tune in instantly.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Times shown in your local timezone</span>
        </div>
      </div>

      <ProgramGuide channels={channels} loading={loading} />
    </div>
  );
};
