import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Languages, ChevronRight } from 'lucide-react';
import { LANGUAGES } from '../data/demoChannels';
import { fetchChannels } from '../services/channelService';
import { Channel } from '../types';

export const LanguagesPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    fetchChannels().then(setChannels);
  }, []);

  return (
    <div id="languages-directory-page" className="space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Languages className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Browse Channels by Language
          </h1>
        </div>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Find programs and news presented in your preferred native or spoken language.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LANGUAGES.map((lang) => {
          const count = channels.filter(
            (c) => c.languageCode.toLowerCase() === lang.code.toLowerCase()
          ).length;

          return (
            <Link
              key={lang.code}
              to={`/language/${lang.code.toLowerCase()}`}
              className="group p-5 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 shadow-md flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                    {lang.name}
                  </h3>
                  <span className="text-xs text-indigo-400/80 font-medium">
                    ({lang.nativeName})
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-0.5 block">{count} channels</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
