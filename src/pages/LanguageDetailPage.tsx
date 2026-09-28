import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Languages } from 'lucide-react';
import { LANGUAGES } from '../data/demoChannels';
import { fetchChannels } from '../services/channelService';
import { Channel } from '../types';
import { ChannelGrid } from '../components/channel/ChannelGrid';

export const LanguageDetailPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const langMeta = LANGUAGES.find(
    (l) => l.code.toLowerCase() === code?.toLowerCase()
  );

  const languageName = langMeta?.name || code?.toUpperCase() || 'Language';

  useEffect(() => {
    let isMounted = true;
    fetchChannels().then((list) => {
      if (isMounted) {
        const filtered = list.filter(
          (c) =>
            c.languageCode?.toLowerCase() === code?.toLowerCase() ||
            c.language.toLowerCase() === languageName.toLowerCase()
        );
        setChannels(filtered);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [code, languageName]);

  return (
    <div id="language-detail-page" className="space-y-6">
      <Link
        to="/languages"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Languages</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Languages className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {languageName} TV Channels
            </h1>
            {langMeta?.nativeName && (
              <span className="text-sm font-semibold text-indigo-400">
                ({langMeta.nativeName})
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Broadcasts and shows delivered primarily in {languageName}.
          </p>
        </div>

        <span className="text-xs text-slate-400">
          Showing <strong className="text-white">{channels.length}</strong> channels
        </span>
      </div>

      <ChannelGrid
        channels={channels}
        loading={loading}
        emptyTitle={`No channels found for ${languageName}`}
        emptyDescription="We are actively sourcing licensed live streams in this language."
        emptyActionLabel="Browse All Live TV"
        emptyActionHref="/live"
      />
    </div>
  );
};
