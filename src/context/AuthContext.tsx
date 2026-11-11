import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserPresence } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  presence: UserPresence;
  setPresence: (presence: UserPresence) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, username: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loginDemoUser: (personaIndex: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Preset test avatars & profiles for instant multi-user test driving
const DEMO_PERSONAS: UserProfile[] = [
  {
    uid: 'demo_alex_shadow',
    email: 'alex.shadow@doomcord.io',
    username: 'shadow_weaver',
    displayName: 'Alex Thorne',
    bio: 'Exploring procedurally generated worlds and synthetic beats.',
    statusMessage: 'Vibing in the Obsidian Lounge',
    presence: 'online' as UserPresence,
    accentColor: 'oklch(0.72 0.16 32)', // Coral
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlexThorne&backgroundColor=0d382e',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    uid: 'demo_seraph_mint',
    email: 'seraphina@doomcord.io',
    username: 'seraph_mint',
    displayName: 'Seraphina Vale',
    bio: 'Spatial UI researcher & ambient music producer. Orb enthusiast.',
    statusMessage: 'Crafting glowing geometry',
    presence: 'online' as UserPresence,
    accentColor: 'oklch(0.85 0.12 165)', // Mint
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=SeraphMint&backgroundColor=154338',
    createdAt: '2026-01-05T00:00:00Z'
  },
  {
    uid: 'demo_cipher_gold',
    email: 'cipher@doomcord.io',
    username: 'cipher_zero',
    displayName: 'Cipher',
    bio: 'Distributed systems & cryptographic protocols.',
    statusMessage: 'Do Not Disturb // Deep in code',
    presence: 'dnd' as UserPresence,
    accentColor: 'oklch(0.84 0.14 85)', // Gold
    photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=CipherZero&backgroundColor=2e3a1f',
    createdAt: '2026-01-10T00:00:00Z'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [presence, setPresenceState] = useState<UserPresence>('online');

  // Load or sync profile from Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        const userDocRef = doc(db, 'users', fbUser.uid);

        // Subscribe to real-time profile updates
        const unsubProfile = onSnapshot(userDocRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setProfile(data);
            setPresenceState(data.presence || 'online');
          } else {
            // Initialize new profile document
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              username: (fbUser.displayName || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || `user_${fbUser.uid.slice(0, 5)}`,
              displayName: fbUser.displayName || 'Traveler',
              photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}&backgroundColor=0d382e`,
              bio: 'New explorer in the Doomcord realm.',
              statusMessage: 'Exploring Orbs',
              presence: 'online',
              accentColor: 'oklch(0.85 0.12 165)',
              createdAt: new Date().toISOString()
            };

            try {
              await setDoc(userDocRef, {
                ...newProfile,
                updatedAt: serverTimestamp()
              });
              setProfile(newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
            }
          }
          setLoading(false);
        }, (err) => {
          console.error("Profile snapshot error:", err);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        // Check if demo user is stored in session
        const savedDemo = sessionStorage.getItem('doomcord_demo_user');
        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo) as UserProfile;
            setProfile(parsed);
            setPresenceState(parsed.presence);
            // Mock synthetic firebase user
            setUser({
              uid: parsed.uid,
              email: parsed.email,
              displayName: parsed.displayName,
              photoURL: parsed.photoURL,
              emailVerified: true
            } as any);
          } catch {
            sessionStorage.removeItem('doomcord_demo_user');
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() };
    setProfile(updated);

    if (user && !user.uid.startsWith('demo_')) {
      try {
        await updateDoc(doc(db, 'users', user.uid), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    } else {
      sessionStorage.setItem('doomcord_demo_user', JSON.stringify(updated));
    }
  }, [profile, user]);

  const setPresence = useCallback(async (newPresence: UserPresence) => {
    setPresenceState(newPresence);
    await updateProfile({ presence: newPresence });
  }, [updateProfile]);

  const signInGoogle = useCallback(async () => {
    setLoading(true);
    try {
      sessionStorage.removeItem('doomcord_demo_user');
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Google sign in error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInEmail = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    try {
      sessionStorage.removeItem('doomcord_demo_user');
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.error("Email sign in error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpEmail = useCallback(async (email: string, pass: string, username: string, displayName: string) => {
    setLoading(true);
    try {
      sessionStorage.removeItem('doomcord_demo_user');
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await fbUpdateProfile(cred.user, { displayName });
      
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        displayName,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${cred.user.uid}&backgroundColor=0d382e`,
        bio: 'Explorer in the Doomcord realm.',
        statusMessage: 'Ready to connect',
        presence: 'online',
        accentColor: 'oklch(0.85 0.12 165)',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setProfile(newProfile);
    } catch (err) {
      console.error("Sign up error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const logout = useCallback(async () => {
    sessionStorage.removeItem('doomcord_demo_user');
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  }, []);

  const loginDemoUser = useCallback(async (index: number) => {
    const persona = DEMO_PERSONAS[index % DEMO_PERSONAS.length];
    sessionStorage.setItem('doomcord_demo_user', JSON.stringify(persona));
    setUser({
      uid: persona.uid,
      email: persona.email,
      displayName: persona.displayName,
      photoURL: persona.photoURL,
      emailVerified: true
    } as any);
    setProfile(persona);
    setPresenceState(persona.presence);

    // Ensure persona exists in Firestore so other real or demo users can see & chat with it
    try {
      await setDoc(doc(db, 'users', persona.uid), persona, { merge: true });
    } catch (err) {
      console.warn("Could not sync demo persona to firestore (offline fallback active):", err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      presence,
      setPresence,
      updateProfile,
      signInGoogle,
      signInEmail,
      signUpEmail,
      resetPassword,
      logout,
      loginDemoUser
    }}>
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
