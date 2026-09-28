import { Program } from '../types';
import { INITIAL_CHANNELS } from './demoChannels';

// Helper to generate dynamic continuous program schedules anchored to now
export function generateProgramsForChannels(channelIds: string[], baseDate: Date = new Date()): Record<string, Program[]> {
  const schedule: Record<string, Program[]> = {};

  // Standard schedule blocks (e.g., 30-min to 120-min shows spanning 24 hours)
  channelIds.forEach((channelId) => {
    const channel = INITIAL_CHANNELS.find(c => c.id === channelId) || INITIAL_CHANNELS[0];
    const programs: Program[] = [];

    // Start 6 hours in the past and extend 18 hours into the future
    const startWindow = new Date(baseDate.getTime() - 6 * 3600 * 1000);
    // Align to the top or half hour
    startWindow.setMinutes(startWindow.getMinutes() < 30 ? 0 : 30, 0, 0);

    let currentTime = new Date(startWindow);

    const showTitles = getCategoryShowTitles(channel.category, channel.name);

    for (let i = 0; i < 18; i++) {
      const durationMinutes = [30, 60, 90, 120][(i + channel.name.length) % 4];
      const endTime = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
      const titleTemplate = showTitles[i % showTitles.length];

      programs.push({
        id: `${channelId}-prog-${i}`,
        channelId,
        title: titleTemplate.title,
        description: titleTemplate.description,
        category: channel.category,
        startTime: currentTime.toISOString(),
        endTime: endTime.toISOString(),
        thumbnail: channel.logo,
        rating: ['TV-14', 'TV-PG', 'TV-G', 'TV-MA'][i % 4],
        seasonEpisode: i % 2 === 0 ? `S${(i % 5) + 1} E${(i % 12) + 1}` : undefined,
      });

      currentTime = new Date(endTime);
    }

    schedule[channelId] = programs;
  });

  return schedule;
}

function getCategoryShowTitles(category: string, channelName: string): Array<{ title: string; description: string }> {
  switch (category) {
    case 'News':
      return [
        { title: 'Global Morning Brief', description: 'Comprehensive opening coverage of overnight diplomatic and economic developments.' },
        { title: 'Market Pulse Live', description: 'Wall Street opening bell, foreign exchange volatility, and commodities deep dive.' },
        { title: 'World Forum Analysis', description: 'Foreign bureau correspondents discuss geopolitical stability and climate policy.' },
        { title: 'Prime Headline Hour', description: 'Investigative deep dives into top national stories with field reports.' },
        { title: 'Late Evening Ledger', description: 'Closing financial numbers, late-breaking domestic news, and tomorrow’s agenda.' },
      ];
    case 'Sports':
    case 'Athletics & Sports':
      return [
        { title: 'Championship Live Matchday', description: 'High-stakes clash between top-tier rivals with multi-angle commentary.' },
        { title: 'The Tactical Review', description: 'Pundits diagram player positioning, set pieces, and managerial masterclasses.' },
        { title: 'Motorsport Grand Prix Pole', description: 'Qualifying sessions and telemetry insights from the high-speed circuit.' },
        { title: 'Beyond the Whistle', description: 'Documentary profile examining the training regimes of Olympic contenders.' },
        { title: 'Late Night Sports Central', description: 'Highlights, scores, and dramatic game-winning buzzer beaters from around the globe.' },
      ];
    case 'Movies':
      return [
        { title: 'Cinema Showcase: Golden Era', description: 'Restored milestone films from visionary directors with original theatrical score.' },
        { title: 'Directors Cut: Neo-Noir', description: 'Critically acclaimed atmospheric crime mystery set in a dystopian sprawl.' },
        { title: 'Festival Spotlight: Sundance Pick', description: 'Intimate indie drama exploring human connection across divided borders.' },
        { title: 'Midnight Thriller Feature', description: 'Tense psychological cat-and-mouse game between an undercover investigator and syndicate.' },
      ];
    case 'Music':
      return [
        { title: 'Festival Mainstage Live', description: 'Headliner performances captured with multi-track spatial audio.' },
        { title: 'The Acoustic Vault Sessions', description: 'Intimate unplugged renditions recorded in historic converted studios.' },
        { title: 'Global Top 40 Countdown', description: 'The most streamed tracks worldwide analyzed with music video debuts.' },
        { title: 'Nightwave Modular Synth Soundscapes', description: 'Hypnotic electronic live improvisation and visual synthesizer textures.' },
      ];
    case 'Kids':
      return [
        { title: 'Starfarer Academy', description: 'Whimsical animated crew explores vibrant exoplanets and solves science puzzles.' },
        { title: 'The Forest Wonder Squad', description: 'Playful animal companions teach teamwork, conservation, and empathy.' },
        { title: 'Gizmo Builders Club', description: 'Young inventors create hilarious backyard contraptions with recycled gears.' },
        { title: 'Bedtime Stories in the Stars', description: 'Calming bedtime tales set to gentle orchestral lullabies.' },
      ];
    case 'Documentary':
      return [
        { title: 'Depths of the Abyss: Marianas', description: 'Bioluminescent wonders revealed in extreme oceanic trenches.' },
        { title: 'Supermassive: Galaxies at the Edge', description: 'Astrophysicists piece together the first epoch following the cosmic dawn.' },
        { title: 'The Serengeti Migration', description: 'Predator-prey balance across sweeping savannah river crossings in 4K.' },
        { title: 'Civilizations Rebuilt', description: 'LiDAR technology maps hidden subterranean temples and ancient trade routes.' },
      ];
    case 'Tech & Gaming':
      return [
        { title: 'Hardware Lab: Next-Gen Benchmarks', description: 'Silicon microarchitecture, thermal throttling stress tests, and GPU analysis.' },
        { title: 'Pro League Grand Finals', description: 'Best-of-seven esports showdown with tactical team audio feeds enabled.' },
        { title: 'Neural Frontiers: AI in 2026', description: 'Robotics engineers and researchers explore multimodal models and neural chips.' },
        { title: 'Speedrun Legends Live', description: 'Frame-perfect glitch exhibitions through classic adventure masterpieces.' },
      ];
    default:
      return [
        { title: `${channelName} Live Broadcast`, description: 'Special programming broadcasting live across digital networks.' },
        { title: 'Feature Presentation', description: 'Exclusive investigative and cultural stories curated for our audience.' },
        { title: 'Spotlight Hour', description: 'Roundtable perspectives and behind-the-scenes interviews.' },
      ];
  }
}

// Singleton cache of programs
export const ALL_CHANNEL_IDS = INITIAL_CHANNELS.map(c => c.id);
export const INITIAL_PROGRAMS = generateProgramsForChannels(ALL_CHANNEL_IDS);
