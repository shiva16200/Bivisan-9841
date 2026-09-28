import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import {
  auth,
  db,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isFirebaseActive: boolean;
  adminUser: { username: string; role: string } | null;
  adminLogin: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoUser: (asAdmin?: boolean) => void;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  'shivagadhi162@gmail.com',
  ...(import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase()),
];

const LOCAL_USER_KEY = 'streamlive_demo_auth_user';
const ADMIN_TOKEN_KEY = 'streamlive_admin_token';
const ADMIN_USER_KEY = 'streamlive_admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminUser, setAdminUser] = useState<{ username: string; role: string } | null>(null);
  const [isAdminTokenValid, setIsAdminTokenValid] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check admin status across JWT Admin session, Email list, and Firestore UserProfile
  const isAdmin = Boolean(
    isAdminTokenValid ||
    (adminUser && adminUser.role === 'admin') ||
    (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) ||
    userProfile?.role === 'admin'
  );

  // Verify stored admin token on startup
  useEffect(() => {
    const checkAdminSession = async () => {
      const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (savedToken) {
        try {
          const res = await fetch('/api/admin/verify', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          const data = await res.json();
          if (data.ok && data.authenticated && data.user) {
            setIsAdminTokenValid(true);
            setAdminUser(data.user);
          } else {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            localStorage.removeItem(ADMIN_USER_KEY);
            setIsAdminTokenValid(false);
            setAdminUser(null);
          }
        } catch {
          // Keep offline state if verified previously in this session
          const savedSession = localStorage.getItem(ADMIN_USER_KEY);
          if (savedSession) {
            try {
              const parsed = JSON.parse(savedSession);
              setAdminUser(parsed);
              setIsAdminTokenValid(true);
            } catch {
              // ignore
            }
          }
        }
      }
    };
    checkAdminSession();
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setUser(fbUser);
        if (fbUser) {
          await loadOrCreateUserProfile(fbUser);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local demo mode: check localStorage for saved demo user
      try {
        const saved = localStorage.getItem(LOCAL_USER_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed.user);
          setUserProfile(parsed.profile);
        }
      } catch (err) {
        console.error('Error loading demo user:', err);
      }
      setLoading(false);
    }
  }, []);

  const loadOrCreateUserProfile = async (fbUser: User) => {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);

      const isDefaultAdmin = Boolean(
        fbUser.email && ADMIN_EMAILS.includes(fbUser.email.toLowerCase())
      );

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile({
          ...data,
          role: isDefaultAdmin ? 'admin' : (data.role || 'user'),
        });
      } else {
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          favorites: [],
          preferredCountry: 'US',
          preferredLanguage: 'en',
          role: isDefaultAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Could not load user profile from Firestore:', err);
      setUserProfile({
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'User',
        email: fbUser.email,
        photoURL: fbUser.photoURL,
        favorites: [],
        preferredCountry: 'US',
        preferredLanguage: 'en',
        role: ADMIN_EMAILS.includes(fbUser.email?.toLowerCase() || '') ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      });
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isFirebaseConfigured && auth) {
      await signInWithEmailAndPassword(auth, email, pass);
    } else {
      // Local demo sign in
      const isAdm = ADMIN_EMAILS.includes(email.toLowerCase()) || email.includes('admin');
      const mockUser = {
        uid: `demo-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        photoURL: null,
      } as unknown as User;

      const mockProfile: UserProfile = {
        uid: mockUser.uid,
        displayName: mockUser.displayName,
        email: mockUser.email,
        photoURL: null,
        favorites: [],
        preferredCountry: 'US',
        preferredLanguage: 'en',
        role: isAdm ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      };

      setUser(mockUser);
      setUserProfile(mockProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify({ user: mockUser, profile: mockProfile }));
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    if (isFirebaseConfigured && auth) {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && res.user) {
        await firebaseUpdateProfile(res.user, { displayName: name });
      }
    } else {
      await signInWithEmail(email, pass);
      if (name) {
        await updateDisplayName(name);
      }
    }
  };

  const signInWithGoogle = async () => {
    if (isFirebaseConfigured && auth) {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } else {
      // Demo Google Sign-In with runtime user email
      const email = 'shivagadhi162@gmail.com';
      const mockUser = {
        uid: 'demo-google-uid-162',
        email,
        displayName: 'Shiva Gadhi (Admin)',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      } as unknown as User;

      const mockProfile: UserProfile = {
        uid: mockUser.uid,
        displayName: mockUser.displayName,
        email: mockUser.email,
        photoURL: mockUser.photoURL,
        favorites: [],
        preferredCountry: 'US',
        preferredLanguage: 'en',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      setUser(mockUser);
      setUserProfile(mockProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify({ user: mockUser, profile: mockProfile }));
    }
  };

  const signInAsDemoUser = (asAdmin: boolean = false) => {
    const email = asAdmin ? 'shivagadhi162@gmail.com' : 'viewer@streamlive.tv';
    const mockUser = {
      uid: asAdmin ? 'demo-admin-uid' : 'demo-viewer-uid',
      email,
      displayName: asAdmin ? 'Administrator' : 'Stream Viewer',
      photoURL: asAdmin
        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    } as unknown as User;

    const mockProfile: UserProfile = {
      uid: mockUser.uid,
      displayName: mockUser.displayName,
      email: mockUser.email,
      photoURL: mockUser.photoURL,
      favorites: ['pulse-news-24', 'apex-sports-hd'],
      preferredCountry: 'US',
      preferredLanguage: 'en',
      role: asAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };

    setUser(mockUser);
    setUserProfile(mockProfile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify({ user: mockUser, profile: mockProfile }));
  };

  const signOutUser = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    }
  };

  const updateDisplayName = async (name: string) => {
    if (user && isFirebaseConfigured && auth?.currentUser) {
      await firebaseUpdateProfile(auth.currentUser, { displayName: name });
      if (db) {
        try {
          await setDoc(doc(db, 'users', user.uid), { displayName: name }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
    }

    if (userProfile) {
      const updated = { ...userProfile, displayName: name };
      setUserProfile(updated);
      if (!isFirebaseConfigured) {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify({ user: { ...user, displayName: name }, profile: updated }));
      }
    }
  };

  const adminLogin = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
        setIsAdminTokenValid(true);
        setAdminUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid administrator credentials' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during admin login' };
    }
  };

  const adminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setIsAdminTokenValid(false);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        loading,
        isFirebaseActive: isFirebaseConfigured,
        adminUser,
        adminLogin,
        adminLogout,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsDemoUser,
        signOutUser,
        resetPassword,
        updateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
