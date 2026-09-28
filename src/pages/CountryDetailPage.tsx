import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import { COUNTRIES } from '../data/demoChannels';
import { fetchChannels } from '../services/channelService';
import { Channel } from '../types';
import { ChannelGrid } from '../components/channel/ChannelGrid';

export const CountryDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const countryMeta = COUNTRIES.find(
    (c) => c.code.toLowerCase() === code?.toLowerCase()
  );

  const countryName = countryMeta?.name || code?.toUpperCase() || 'Country';

  useEffect(() => {
    let isMounted = true;
    fetchChannels().then((list) => {
      if (isMounted) {
        const filtered = list.filter(
          (c) =>
            c.countryCode.toLowerCase() === code?.toLowerCase() ||
            c.country.toLowerCase() === countryName.toLowerCase()
        );
        setChannels(filtered);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [code, countryName]);

  return (
    <div id="country-detail-page" className="space-y-6">
      <Link
        to="/countries"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Countries</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{countryMeta?.flag || '🌍'}</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {countryName} Live Channels
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Channels broadcasting from {countryName} ({countryMeta?.code || code?.toUpperCase()})
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400">
          Showing <strong className="text-white">{channels.length}</strong> channels
        </span>
      </div>

      <ChannelGrid
        channels={channels}
        loading={loading}
        emptyTitle={`No channels found for ${countryName}`}
        emptyDescription="We are constantly working with licensed broadcasters to expand international streaming."
        emptyActionLabel="Browse All Live TV"
        emptyActionHref="/live"
      />
    </div>
  );
};
