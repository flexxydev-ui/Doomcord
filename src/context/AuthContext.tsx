import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile, UserPresence } from '../types';
import {
  generateInitialsAvatar,
  INITIAL_NITRO_PLANS,
  INITIAL_COSMETICS_CATALOG,
  INITIAL_SYSTEM_CONFIG,
} from '../lib/dataService';

interface AuthContextType {
  profile: UserProfile | null;
  token: string | null;
  loading: boolean;
  mustChangePassword: boolean;
  presence: UserPresence;
  setPresence: (presence: UserPresence) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, username: string, displayName: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'doomcord_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [presence, setPresenceState] = useState<UserPresence>('online');

  // Bootstrap Owner record in Firestore & initialize store catalogs (clean of any fake users/communities)
  useEffect(() => {
    async function initializePlatformCatalogs() {
      try {
        // 1. Purge any legacy demo_* users if they existed in Firestore from earlier runs
        const usersSnap = await getDocs(collection(db, 'users'));
        for (const d of usersSnap.docs) {
          if (d.id.startsWith('demo_')) {
            await deleteDoc(doc(db, 'users', d.id));
          }
        }

        // 2. Ensure Owner account from server bootstrap is synced into Firestore /users/{ownerUid}
        const ownerRes = await fetch('/api/auth/owner-info');
        if (ownerRes.ok) {
          const ownerInfo = await ownerRes.json();
          const ownerRef = doc(db, 'users', ownerInfo.uid);
          const ownerSnap = await getDoc(ownerRef);
          if (!ownerSnap.exists()) {
            const ownerProfile: UserProfile = {
              uid: ownerInfo.uid,
              email: ownerInfo.email,
              username: ownerInfo.username,
              displayName: ownerInfo.displayName,
              role: 'owner',
              photoURL: generateInitialsAvatar(ownerInfo.displayName, '#b45309'),
              bio: 'Platform Owner & Super Administrator.',
              statusMessage: 'Managing Doomcord Infrastructure',
              presence: 'online',
              accentColor: 'oklch(0.84 0.14 85)',
              nitroTier: 'nitro',
              nitroBillingCycle: 'yearly',
              nitroAutoRenew: true,
              ownedCosmetics: INITIAL_COSMETICS_CATALOG.map((c) => c.id),
              equippedCosmetics: {
                avatarDecoration: 'cosm_frame_emerald_crystal',
                nameplate: 'cosm_nameplate_coral_flare',
                profileEffect: 'cosm_effect_aurora_canopy',
              },
              badges: ['owner', 'founder', 'verified', 'nitro'],
              createdAt: ownerInfo.createdAt,
            };
            await setDoc(ownerRef, ownerProfile);
          }
        }

        // 3. Initialize Nitro Plans in Firestore if empty
        const plansSnap = await getDocs(collection(db, 'nitro_plans'));
        if (plansSnap.empty) {
          for (const plan of INITIAL_NITRO_PLANS) {
            await setDoc(doc(db, 'nitro_plans', plan.id), plan);
          }
        }

        // 4. Initialize Cosmetics Catalog in Firestore if empty
        const cosmSnap = await getDocs(collection(db, 'cosmetics'));
        if (cosmSnap.empty) {
          for (const item of INITIAL_COSMETICS_CATALOG) {
            await setDoc(doc(db, 'cosmetics', item.id), item);
          }
        }

        // 5. Initialize System Config in Firestore if empty
        const sysRef = doc(db, 'system_config', 'global');
        const sysSnap = await getDoc(sysRef);
        if (!sysSnap.exists()) {
          await setDoc(sysRef, INITIAL_SYSTEM_CONFIG);
        }
      } catch (err) {
        console.warn('Catalog initialization warning:', err);
      }
    }

    initializePlatformCatalogs();
  }, []);

  // Restore session from token and attach real-time Firestore profile listener
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    async function verifyAndSubscribe() {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!savedToken) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (!res.ok) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const { user } = await res.json();
        setMustChangePassword(Boolean(user.mustChangePassword));

        const userRef = doc(db, 'users', user.uid);
        unsubProfile = onSnapshot(
          userRef,
          async (snap) => {
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              // Always keep server-authoritative role
              const merged: UserProfile = {
                ...data,
                role: user.role || data.role || 'member',
                ownedCosmetics: data.ownedCosmetics || [],
                equippedCosmetics: data.equippedCosmetics || {},
                badges: data.badges || (user.role === 'owner' ? ['owner', 'founder', 'verified'] : []),
              };
              setProfile(merged);
              setPresenceState(merged.presence || 'online');
            } else {
              const initialBadges =
                user.role === 'owner' ? ['owner', 'founder', 'verified', 'nitro'] : ['verified'];
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                role: user.role || 'member',
                photoURL: generateInitialsAvatar(user.displayName),
                bio: '',
                statusMessage: 'Online on Doomcord',
                presence: 'online',
                accentColor: 'oklch(0.85 0.12 165)',
                nitroTier: user.role === 'owner' ? 'nitro' : 'free',
                nitroBillingCycle: user.role === 'owner' ? 'yearly' : 'none',
                ownedCosmetics: [],
                equippedCosmetics: {},
                badges: initialBadges,
                createdAt: user.createdAt || new Date().toISOString(),
              };
              await setDoc(userRef, newProfile);
              setProfile(newProfile);
            }
            setLoading(false);
          },
          () => {
            setLoading(false);
          }
        );
      } catch {
        setLoading(false);
      }
    }

    verifyAndSubscribe();

    return () => {
      if (unsubProfile) unsubProfile();
    };
  }, [token]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!profile) return;
      const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() };
      setProfile(updated);
      await updateDoc(doc(db, 'users', profile.uid), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    },
    [profile]
  );

  const setPresence = useCallback(
    async (newPresence: UserPresence) => {
      setPresenceState(newPresence);
      await updateProfile({ presence: newPresence });
    },
    [updateProfile]
  );

  const signInEmail = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setMustChangePassword(Boolean(data.user.mustChangePassword));
      setToken(data.token);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpEmail = useCallback(
    async (email: string, pass: string, username: string, displayName: string) => {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass, username, displayName }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed.');
        }

        const newProfile: UserProfile = {
          uid: data.user.uid,
          email: data.user.email,
          username: data.user.username,
          displayName: data.user.displayName,
          role: data.user.role,
          photoURL: generateInitialsAvatar(data.user.displayName),
          bio: '',
          statusMessage: 'Available',
          presence: 'online',
          accentColor: 'oklch(0.85 0.12 165)',
          nitroTier: 'free',
          nitroBillingCycle: 'none',
          ownedCosmetics: [],
          equippedCosmetics: {},
          badges: ['verified'],
          createdAt: data.user.createdAt,
        };

        await setDoc(doc(db, 'users', data.user.uid), newProfile);
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setMustChangePassword(false);
        setToken(data.token);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signInGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const cleanUsername = (fbUser.displayName || fbUser.email?.split('@')[0] || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, '')
        .slice(0, 24);

      const res = await fetch('/api/auth/sync-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: fbUser.uid,
          email: fbUser.email,
          username: cleanUsername,
          displayName: fbUser.displayName || 'Doomcord Member',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google authentication sync failed.');
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setMustChangePassword(false);
      setToken(data.token);
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!token) throw new Error('Not authenticated.');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password change failed.');
      }
      setMustChangePassword(false);
      if (profile) {
        await updateDoc(doc(db, 'users', profile.uid), {
          mustChangePassword: false,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [token, profile]
  );

  const logout = useCallback(async () => {
    if (profile) {
      try {
        await updateDoc(doc(db, 'users', profile.uid), { presence: 'invisible' });
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setProfile(null);
    setMustChangePassword(false);
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        profile,
        token,
        loading,
        mustChangePassword,
        presence,
        setPresence,
        updateProfile,
        signInGoogle,
        signInEmail,
        signUpEmail,
        changePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
