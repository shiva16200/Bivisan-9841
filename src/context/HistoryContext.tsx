import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WatchHistoryItem, Channel } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../services/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

interface HistoryContextType {
  history: WatchHistoryItem[];
  addToHistory: (channel: Channel) => Promise<void>;
  removeFromHistory: (channelId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const GUEST_HISTORY_KEY = 'streamlive_guest_watch_history';

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  const loadLocalHistory = (): WatchHistoryItem[] => {
    try {
      const raw = localStorage.getItem(GUEST_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalHistory = (items: WatchHistoryItem[]) => {
    try {
      localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Error saving local watch history:', err);
    }
  };

  useEffect(() => {
    if (user && isFirebaseConfigured && db) {
      const fetchUserHistory = async () => {
        try {
          const q = query(
            collection(db, `users/${user.uid}/history`),
            orderBy('watchedAt', 'desc'),
            limit(30)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const items = snap.docs.map((d) => d.data() as WatchHistoryItem);
            setHistory(items);
          } else {
            setHistory(loadLocalHistory());
          }
        } catch (err) {
          console.warn('Firestore history fetch error, using local:', err);
          setHistory(loadLocalHistory());
        }
      };
      fetchUserHistory();
    } else {
      setHistory(loadLocalHistory());
    }
  }, [user]);

  const addToHistory = useCallback(
    async (channel: Channel) => {
      const newItem: WatchHistoryItem = {
        id: `${channel.id}-${Date.now()}`,
        userId: user?.uid,
        channelId: channel.id,
        channelName: channel.name,
        channelLogo: channel.logo,
        category: channel.category,
        watchedAt: new Date().toISOString(),
      };

      setHistory((prev) => {
        // Remove older occurrence of the same channel and prepend newest
        const filtered = prev.filter((item) => item.channelId !== channel.id);
        const updated = [newItem, ...filtered].slice(0, 30);
        saveLocalHistory(updated);
        return updated;
      });

      if (user && isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, `users/${user.uid}/history`, channel.id), newItem);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/history/${channel.id}`);
        }
      }
    },
    [user]
  );

  const removeFromHistory = useCallback(
    async (channelId: string) => {
      setHistory((prev) => {
        const updated = prev.filter((item) => item.channelId !== channelId);
        saveLocalHistory(updated);
        return updated;
      });

      if (user && isFirebaseConfigured && db) {
        try {
          await deleteDoc(doc(db, `users/${user.uid}/history`, channelId));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/history/${channelId}`);
        }
      }
      showToast('Removed from history', 'info');
    },
    [user, showToast]
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);
    localStorage.removeItem(GUEST_HISTORY_KEY);

    if (user && isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, `users/${user.uid}/history`));
        const deletions = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletions);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/history`);
      }
    }
    showToast('Watch history cleared', 'info');
  }, [user, showToast]);

  return (
    <HistoryContext.Provider value={{ history, addToHistory, removeFromHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export function useHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
