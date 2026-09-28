import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Tv,
  CheckCircle,
  Play,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { Channel } from '../../types';
import {
  fetchChannelById,
  createChannel,
  updateChannel,
} from '../../services/channelService';
import { CATEGORIES, COUNTRIES, LANGUAGES } from '../../data/demoChannels';
import { useToast } from '../../context/ToastContext';

const PRESET_SAMPLE_STREAMS = [
  {
    label: 'Big Buck Bunny (HLS Multirate)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    type: 'hls' as const,
  },
  {
    label: 'Akamai Live HLS Test Feed',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    type: 'hls' as const,
  },
  {
    label: 'Tears of Steel 4K (HLS)',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    type: 'hls' as const,
  },
  {
    label: 'Sintel Open Cinema (HLS)',
    url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    type: 'hls' as const,
  },
  {
    label: 'HD Sports Live',
    url: '/fifa26/HimalayaSportsFifa026/playlist.m3u8',
    type: 'hls' as const,
  },
];

export const AdminChannelFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Channel>>({
    name: '',
    category: 'News',
    country: 'United States',
    countryCode: 'US',
    language: 'English',
    languageCode: 'en',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&auto=format&fit=crop&q=80',
    description: '',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    streamType: 'hls',
    website: '',
    resolution: '1080p Full HD',
    active: true,
    featured: false,
    viewerCount: 1250,
  });

  useEffect(() => {
    if (id) {
      fetchChannelById(id).then((found) => {
        if (found) {
          setFormData(found);
        } else {
          showToast('Channel not found', 'error');
          navigate('/admin/channels');
        }
        setLoading(false);
      });
    }
  }, [id, navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.streamUrl?.trim()) {
      showToast('Channel name and stream URL are required', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await updateChannel(id, formData);
        showToast('Channel updated successfully!', 'success');
      } else {
        const generatedId =
          formData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || `channel-${Date.now()}`;

        const newChannel: Channel = {
          id: generatedId,
          slug: generatedId,
          name: formData.name,
          category: formData.category || 'General',
          country: formData.country || 'Global',
          countryCode: formData.countryCode || 'GL',
          language: formData.language || 'English',
          languageCode: formData.languageCode || 'en',
          logo:
            formData.logo ||
            'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&auto=format&fit=crop&q=80',
          description: formData.description || '',
          streamUrl: formData.streamUrl,
          streamType: formData.streamType || 'hls',
          website: formData.website || '',
          resolution: formData.resolution || '1080p Full HD',
          active: formData.active ?? true,
          featured: formData.featured ?? false,
          viewerCount: Math.floor(Math.random() * 2000) + 500,
          createdAt: new Date().toISOString(),
        };

        await createChannel(newChannel);
        showToast('New authorized channel created!', 'success');
      }
      navigate('/admin/channels');
    } catch (err) {
      console.error('Save channel error:', err);
      showToast('Failed to save channel', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const cty = COUNTRIES.find((c) => c.code === code);
    if (cty) {
      setFormData((prev) => ({
        ...prev,
        countryCode: cty.code,
        country: cty.name,
      }));
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const lang = LANGUAGES.find((l) => l.code === code);
    if (lang) {
      setFormData((prev) => ({
        ...prev,
        languageCode: lang.code,
        language: lang.name,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div id="channel-form-page" className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/admin/channels"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Channels</span>
      </Link>

      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          {isEditing ? `Edit "${formData.name}"` : 'Add New Authorized Channel'}
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Specify certified broadcast URLs, metadata, and transmission attributes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Metadata */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            1. Channel Identity & Metadata
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Channel Name *
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apex Sports HD"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Category / Genre *
              </label>
              <select
                value={formData.category || 'News'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Country of Origin
              </label>
              <select
                value={formData.countryCode || 'US'}
                onChange={handleCountryChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Broadcast Language
              </label>
              <select
                value={formData.languageCode || 'en'}
                onChange={handleLanguageChange}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Channel Logo URL
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                required
                value={formData.logo || ''}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://..."
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formData.logo && (
                <img
                  src={formData.logo}
                  alt="Preview"
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-950 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed overview of channel programming, editorial focus, or coverage..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        {/* Stream Configuration */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Transmission & Streaming Settings
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Authorized Endpoint
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Live Stream URL (HLS / m3u8 or MP4) *
            </label>
            <input
              type="url"
              required
              value={formData.streamUrl || ''}
              onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
              placeholder="https://domain.com/live/playlist.m3u8"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-indigo-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick preset sampler */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Or pick an authorized sample test feed:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SAMPLE_STREAMS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      streamUrl: preset.url,
                      streamType: preset.type,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Stream Protocol
              </label>
              <select
                value={formData.streamType || 'hls'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    streamType: e.target.value as 'hls' | 'dash' | 'mp4' | 'demo' | 'iframe' | 'embed',
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              >
                <option value="hls">HLS (.m3u8)</option>
                <option value="iframe">Web Embed / Iframe (.php / .html)</option>
                <option value="mp4">MP4 Video</option>
                <option value="dash">DASH (.mpd)</option>
                <option value="demo">Demo Loop</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Native Resolution
              </label>
              <select
                value={formData.resolution || '1080p Full HD'}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1080p Full HD">1080p Full HD</option>
                <option value="720p HD">720p HD</option>
                <option value="4K UHD">4K UHD</option>
                <option value="480p SD">480p SD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Official Website
              </label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Status and Flags */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            3. Visibility & Presentation
          </h3>

          <div className="flex flex-col sm:flex-row gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active ?? true}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
              <div>
                <div className="text-xs font-bold text-white">Channel Active</div>
                <div className="text-[11px] text-slate-400">Available to all viewers</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured ?? false}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
              <div>
                <div className="text-xs font-bold text-white">Featured Channel</div>
                <div className="text-[11px] text-slate-400">Highlighted in Home banner</div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/admin/channels"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Channel'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
