import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ChevronRight } from 'lucide-react';
import { COUNTRIES } from '../data/demoChannels';
import { fetchChannels } from '../services/channelService';
import { Channel } from '../types';

export const CountriesPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    fetchChannels().then(setChannels);
  }, []);

  return (
    <div id="countries-directory-page" className="space-y-8">
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Browse Channels by Country
          </h1>
        </div>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Tune into international live channels organized by region and national origin.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COUNTRIES.map((cty) => {
          const count = channels.filter(
            (c) => c.countryCode.toLowerCase() === cty.code.toLowerCase()
          ).length;

          return (
            <Link
              key={cty.code}
              to={`/country/${cty.code.toLowerCase()}`}
              className="group p-5 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 shadow-md flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-3xl">{cty.flag}</span>
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                    {cty.name}
                  </h3>
                  <span className="text-xs text-slate-400">{count} channels</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
