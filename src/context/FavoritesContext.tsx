import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (channelId: string) => boolean;
  toggleFavorite: (channelId: string, channelName?: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
}

const GUEST_FAVORITES_KEY = 'streamlive_guest_favorites';

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load guest favorites initially
  const loadGuestFavorites = (): string[] => {
    try {
      const raw = localStorage.getItem(GUEST_FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  // Sync favorites on auth state changes
  useEffect(() => {
    if (user && userProfile) {
      // Migrate guest favorites to user profile
      const guestFavs = loadGuestFavorites();
      const existingUserFavs = userProfile.favorites || [];
      const merged = Array.from(new Set([...existingUserFavs, ...guestFavs]));

      setFavorites(merged);

      // If guest had favorites, clear local and save merged to user profile
      if (guestFavs.length > 0) {
        localStorage.removeItem(GUEST_FAVORITES_KEY);
        if (isFirebaseConfigured && db) {
          setDoc(doc(db, 'users', user.uid), { favorites: merged }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
          });
        }
      }
    } else {
      // Guest mode
      setFavorites(loadGuestFavorites());
    }
  }, [user, userProfile]);

  const toggleFavorite = useCallback(
    async (channelId: string, channelName?: string) => {
      let updated: string[];
      const exists = favorites.includes(channelId);

      if (exists) {
        updated = favorites.filter((id) => id !== channelId);
        showToast(`Removed ${channelName || 'channel'} from favorites`, 'info');
      } else {
        updated = [...favorites, channelId];
        showToast(`Added ${channelName || 'channel'} to favorites`, 'success');
      }

      setFavorites(updated);

      if (user) {
        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, 'users', user.uid), { favorites: updated }, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
          }
        }
      } else {
        localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(updated));
      }
    },
    [favorites, user, showToast]
  );

  const isFavorite = useCallback(
    (channelId: string) => favorites.includes(channelId),
    [favorites]
  );

  const clearFavorites = useCallback(async () => {
    setFavorites([]);
    if (user) {
      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'users', user.uid), { favorites: [] }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
    } else {
      localStorage.removeItem(GUEST_FAVORITES_KEY);
    }
    showToast('All favorites cleared', 'info');
  }, [user, showToast]);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
