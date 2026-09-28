import { Program } from '../types';
import { INITIAL_PROGRAMS, generateProgramsForChannels } from '../data/demoPrograms';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';

const EPG_STORAGE_KEY = 'streamlive_epg_cache';

let inMemoryPrograms: Record<string, Program[]> | null = null;
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function getStoredPrograms(): Record<string, Program[]> {
  if (inMemoryPrograms) {
    return inMemoryPrograms;
  }
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(EPG_STORAGE_KEY) : null;
    if (!raw) {
      inMemoryPrograms = { ...INITIAL_PROGRAMS };
      return inMemoryPrograms;
    }
    const parsed = JSON.parse(raw);
    inMemoryPrograms = parsed && typeof parsed === 'object' ? parsed : { ...INITIAL_PROGRAMS };
    return inMemoryPrograms;
  } catch (err) {
    console.error('Error loading EPG programs from storage:', err);
    inMemoryPrograms = { ...INITIAL_PROGRAMS };
    return inMemoryPrograms;
  }
}

function saveStoredPrograms(programs: Record<string, Program[]>) {
  inMemoryPrograms = programs;
  if (typeof window === 'undefined') return;
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    try {
      localStorage.setItem(EPG_STORAGE_KEY, JSON.stringify(programs));
    } catch (err) {
      console.error('Error saving EPG programs to storage:', err);
    }
  }, 2000);
}

export async function fetchProgramsForChannel(channelId: string): Promise<Program[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'programs'), where('channelId', '==', channelId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
      }
    } catch (err) {
      console.warn('Firestore EPG fetch failed, using local program schedule:', err);
    }
  }

  const all = getStoredPrograms();
  if (!all[channelId]) {
    // Generate dynamically for new or custom channel
    const generated = generateProgramsForChannels([channelId]);
    all[channelId] = generated[channelId];
    saveStoredPrograms(all);
  }
  return all[channelId] || [];
}

export function getCurrentAndNextProgram(programs: Program[], targetTime: Date = new Date()): {
  current: Program | null;
  next: Program | null;
  progressPercent: number;
} {
  if (!programs || programs.length === 0) {
    return { current: null, next: null, progressPercent: 0 };
  }

  const targetMs = targetTime.getTime();
  let current: Program | null = null;
  let next: Program | null = null;

  for (let i = 0; i < programs.length; i++) {
    const p = programs[i];
    const startMs = new Date(p.startTime).getTime();
    const endMs = new Date(p.endTime).getTime();

    if (targetMs >= startMs && targetMs < endMs) {
      current = p;
      next = programs[i + 1] || null;
      break;
    }
  }

  // If none matches exactly, pick the first upcoming or closest
  if (!current) {
    current = programs.find(p => new Date(p.endTime).getTime() > targetMs) || programs[0];
    const currIdx = programs.indexOf(current);
    next = currIdx >= 0 && currIdx < programs.length - 1 ? programs[currIdx + 1] : null;
  }

  let progressPercent = 0;
  if (current) {
    const start = new Date(current.startTime).getTime();
    const end = new Date(current.endTime).getTime();
    const total = end - start;
    if (total > 0) {
      const elapsed = targetMs - start;
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    }
  }

  return { current, next, progressPercent };
}

export async function saveProgram(program: Program): Promise<Program> {
  const all = getStoredPrograms();
  const channelProgs = all[program.channelId] || [];
  const existingIdx = channelProgs.findIndex(p => p.id === program.id);

  if (existingIdx >= 0) {
    channelProgs[existingIdx] = program;
  } else {
    channelProgs.push(program);
  }

  // Sort by startTime
  channelProgs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  all[program.channelId] = channelProgs;
  saveStoredPrograms(all);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'programs', program.id), program);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `programs/${program.id}`);
    }
  }

  return program;
}

export async function createProgram(program: Program): Promise<Program> {
  return saveProgram(program);
}

export function generate24HourGuide(channelId: string, channelName?: string, category?: string): Program[] {
  const map = generateProgramsForChannels([channelId]);
  return map[channelId] || [];
}

export async function deleteProgram(programIdOrChannelId: string, maybeProgramId?: string): Promise<void> {
  const all = getStoredPrograms();
  const programId = maybeProgramId || programIdOrChannelId;
  const channelId = maybeProgramId ? programIdOrChannelId : null;

  if (channelId && all[channelId]) {
    all[channelId] = all[channelId].filter(p => p.id !== programId);
  } else {
    // Search across all channels
    Object.keys(all).forEach(key => {
      all[key] = all[key].filter(p => p.id !== programId);
    });
  }
  saveStoredPrograms(all);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'programs', programId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `programs/${programId}`);
    }
  }
}
