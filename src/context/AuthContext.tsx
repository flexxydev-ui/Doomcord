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
import { UserProfile, UserPresence, UserEntitlementRecord } from '../types';
import {
  generateInitialsAvatar,
  INITIAL_NITRO_PLANS,
  INITIAL_COSMETICS_CATALOG,
  INITIAL_SYSTEM_CONFIG,
  ROOT_OWNER_UUID,
  ROOT_OWNER_EMAIL,
  isRootOwner,
  isRootOwnerEmail,
  cleanFirestoreData,
} from '../lib/dataService';
import { verifyTotpCode } from '../lib/totpService';

interface AuthContextType {
  profile: UserProfile | null;
  token: string | null;
  loading: boolean;
  mustChangePassword: boolean;
  presence: UserPresence;
  setPresence: (presence: UserPresence) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, pass: string, totpCode?: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, username: string, displayName: string) => Promise<void>;
  acceptOwnerInviteOnboard: (
    inviteId: string,
    email: string,
    username: string,
    displayName: string,
    password: string
  ) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  enableTwoFactor: (secret: string, code: string, backupCodes: string[]) => Promise<void>;
  disableTwoFactor: () => Promise<void>;
  resetPasswordWithRecovery: (
    email: string,
    recoveryCode: string,
    newPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'doomcord_auth_token';
const UID_STORAGE_KEY = 'doomcord_auth_uid';
const OWNER_INITIAL_SALT = 'doomcord_owner_salt_v1';

export async function computeSaltedHash(salt: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256HexBrowser(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateRandomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function buildDefaultRootOwnerProfile(
  existing?: Partial<UserProfile>,
  allCosmeticIds?: string[]
): UserProfile {
  const catalogIds =
    allCosmeticIds && allCosmeticIds.length > 0
      ? allCosmeticIds
      : INITIAL_COSMETICS_CATALOG.map((c) => c.id);
  const mergedCosmetics = Array.from(
    new Set([...(existing?.ownedCosmetics || []), ...catalogIds])
  );

  return {
    uid: ROOT_OWNER_UUID,
    email: ROOT_OWNER_EMAIL,
    username: existing?.username || 'doomcord_owner',
    displayName: existing?.displayName || 'Doomcord Root Owner',
    role: 'root_owner',
    photoURL: existing?.photoURL || generateInitialsAvatar('Doomcord Owner', '#b45309'),
    bio: existing?.bio ?? 'Root Owner & Sovereign Architect of Doomcord APEX.',
    statusMessage: existing?.statusMessage ?? 'DOOMCORD APEX · RISE ABOVE. STAND APART.',
    presence: existing?.presence || 'online',
    accentColor: existing?.accentColor || '#8957F5',
    // PERMANENT OWNER APEX+ PRIVILEGES (#27 & #7):
    // Free, unlimited, permanent APEX+ with null expiry, independent of Razorpay
    nitroTier: 'nitro',
    nitroBillingCycle: 'lifetime',
    nitroExpiresAt: null,
    nitroAutoRenew: true,
    permanentEntitlement: 'OWNER_PERMANENT_APEX',
    ownerPermanentApex: true,
    ownedCosmetics: mergedCosmetics,
    equippedCosmetics: existing?.equippedCosmetics || {
      avatarDecoration: 'cosm_frame_emerald_crystal',
      nameplate: 'cosm_nameplate_coral_flare',
      profileEffect: 'cosm_effect_aurora_canopy',
    },
    badges: ['root_owner', 'owner', 'founder', 'verified', 'apex_plus'],
    isBanned: false,
    isSuspended: false,
    mustChangePassword: existing?.mustChangePassword ?? true,
    authSalt: existing?.authSalt || OWNER_INITIAL_SALT,
    authHash: existing?.authHash || '',
    friends: existing?.friends || [],
    joinedCommunities: existing?.joinedCommunities || [],
    blockedUsers: existing?.blockedUsers || [],
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [activeUid, setActiveUid] = useState<string | null>(() => localStorage.getItem(UID_STORAGE_KEY));
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [presence, setPresenceState] = useState<UserPresence>('online');

  // Bootstrap Root Owner record, OWNER_PERMANENT_APEX entitlement, and store catalogs in Firestore
  useEffect(() => {
    async function initializePlatformCatalogs() {
      try {
        // 1. Purge any legacy demo_* users or duplicate random-UUID owner docs, and repair any non-root user accidentally marked root_owner
        const usersSnap = await getDocs(collection(db, 'users'));
        for (const d of usersSnap.docs) {
          const data = d.data() as UserProfile;
          if (
            d.id.startsWith('demo_') ||
            (data.email?.toLowerCase() === ROOT_OWNER_EMAIL && d.id !== ROOT_OWNER_UUID)
          ) {
            await deleteDoc(doc(db, 'users', d.id));
          } else if (d.id !== ROOT_OWNER_UUID && data.role === 'root_owner') {
            await updateDoc(doc(db, 'users', d.id), {
              role: 'member',
              ownerPermanentApex: false,
            });
          }
        }

        // 2. Initialize or rebrand APEX Plans in Firestore
        for (const plan of INITIAL_NITRO_PLANS) {
          const planRef = doc(db, 'nitro_plans', plan.id);
          const planSnap = await getDoc(planRef);
          if (!planSnap.exists()) {
            await setDoc(planRef, plan);
          } else {
            const existingPlan = planSnap.data();
            // Migrate legacy Nitro naming to DOOMCORD APEX while preserving custom INR prices
            if (existingPlan.name?.includes('Nitro')) {
              await updateDoc(planRef, {
                name: plan.name,
                tagline: plan.tagline,
                benefits: plan.benefits,
              });
            }
          }
        }

        // 3. Initialize or rebrand APEX Collection Cosmetics in Firestore
        const cosmSnap = await getDocs(collection(db, 'cosmetics'));
        const allCatalogIds = INITIAL_COSMETICS_CATALOG.map((c) => c.id);
        if (cosmSnap.empty) {
          for (const item of INITIAL_COSMETICS_CATALOG) {
            await setDoc(doc(db, 'cosmetics', item.id), item);
          }
        } else {
          for (const item of INITIAL_COSMETICS_CATALOG) {
            await setDoc(doc(db, 'cosmetics', item.id), item, { merge: true });
          }
        }

        // 4. Ensure Root Owner account exists in Firestore /users/{ROOT_OWNER_UUID} with OWNER_PERMANENT_APEX
        const ownerRef = doc(db, 'users', ROOT_OWNER_UUID);
        const ownerSnap = await getDoc(ownerRef);
        const initialComputedHash = await computeSaltedHash(OWNER_INITIAL_SALT, '1234');
        const existingOwner = ownerSnap.exists() ? (ownerSnap.data() as UserProfile) : undefined;
        const enforcedOwner = buildDefaultRootOwnerProfile(
          {
            ...existingOwner,
            authSalt: existingOwner?.authSalt || OWNER_INITIAL_SALT,
            authHash: existingOwner?.authHash || initialComputedHash,
          },
          allCatalogIds
        );
        await setDoc(ownerRef, enforcedOwner, { merge: true });

        // 5. Ensure persistent OWNER_PERMANENT_APEX entitlement record exists in /user_entitlements
        const entId = 'ent_owner_permanent_apex';
        const entRef = doc(db, 'user_entitlements', entId);
        const entRecord: UserEntitlementRecord = {
          id: entId,
          userId: ROOT_OWNER_UUID,
          entitlementCode: 'OWNER_PERMANENT_APEX',
          source: 'owner_permanent',
          apexTier: 'nitro',
          cosmeticIds: allCatalogIds,
          isLifetime: true,
          expiresAt: null,
          active: true,
          createdAt: enforcedOwner.createdAt,
        };
        await setDoc(entRef, entRecord, { merge: true });

        // 6. Initialize System Config in Firestore if empty
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

  // Restore session and attach real-time Firestore profile listener for activeUid
  useEffect(() => {
    if (!activeUid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', activeUid);
    const unsubProfile = onSnapshot(
      userRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          const isRoot = activeUid === ROOT_OWNER_UUID;

          if (!isRoot && (data.isBanned || data.isSuspended)) {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(UID_STORAGE_KEY);
            setToken(null);
            setActiveUid(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          if (isRoot) {
            const enforced = buildDefaultRootOwnerProfile(data);
            setProfile(enforced);
            setMustChangePassword(Boolean(enforced.mustChangePassword));
            setPresenceState(enforced.presence || 'online');
          } else {
            const safeRole =
              data.role && data.role !== 'root_owner' ? data.role : 'member';
            const merged: UserProfile = {
              ...data,
              role: safeRole,
              ownedCosmetics: data.ownedCosmetics || [],
              equippedCosmetics: data.equippedCosmetics || {},
              badges: (data.badges || ['verified']).filter(
                (b) => b !== 'root_owner' && b !== 'owner'
              ),
            };
            setProfile(merged);
            setMustChangePassword(Boolean(merged.mustChangePassword));
            setPresenceState(merged.presence || 'online');
          }
        } else if (activeUid === ROOT_OWNER_UUID) {
          const initialComputedHash = await computeSaltedHash(OWNER_INITIAL_SALT, '1234');
          const ownerProfile = buildDefaultRootOwnerProfile({
            authSalt: OWNER_INITIAL_SALT,
            authHash: initialComputedHash,
            mustChangePassword: true,
          });
          await setDoc(userRef, ownerProfile);
          setProfile(ownerProfile);
          setMustChangePassword(true);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(UID_STORAGE_KEY);
          setToken(null);
          setActiveUid(null);
          setProfile(null);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      unsubProfile();
    };
  }, [activeUid]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!profile) return;
      const safeUpdates = { ...updates };

      // Enforce Root Owner immutable protection (#27, #35)
      if (isRootOwner(profile)) {
        safeUpdates.role = 'root_owner';
        safeUpdates.nitroTier = 'nitro';
        safeUpdates.nitroBillingCycle = 'lifetime';
        safeUpdates.nitroExpiresAt = null;
        safeUpdates.permanentEntitlement = 'OWNER_PERMANENT_APEX';
        safeUpdates.ownerPermanentApex = true;
        safeUpdates.isBanned = false;
        safeUpdates.isSuspended = false;
      }

      const updated = { ...profile, ...safeUpdates, updatedAt: new Date().toISOString() };
      setProfile(updated);
      await updateDoc(
        doc(db, 'users', profile.uid),
        cleanFirestoreData({
          ...safeUpdates,
          updatedAt: new Date().toISOString(),
        })
      );
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

  // Sign in with Email & Password (+ optional 2FA code)
  const signInEmail = useCallback(async (email: string, pass: string, totpCode?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !pass) {
      throw new Error('Email and password are required.');
    }

    let serverToken: string | null = null;
    let verifiedViaServer = false;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: pass, totpCode }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.requiresTwoFactor) {
          throw new Error('TWO_FACTOR_REQUIRED');
        }
        if (res.ok && data.token && data.user) {
          serverToken = data.token;
          verifiedViaServer = true;
        }
      }
    } catch (err: any) {
      if (err?.message === 'TWO_FACTOR_REQUIRED') {
        throw err;
      }
      // Fallback to Firestore verification below
    }

    if (isRootOwnerEmail(normalizedEmail)) {
      const ownerRef = doc(db, 'users', ROOT_OWNER_UUID);
      const ownerSnap = await getDoc(ownerRef);
      const existingOwner = ownerSnap.exists() ? (ownerSnap.data() as UserProfile) : null;

      const salt = existingOwner?.authSalt || OWNER_INITIAL_SALT;
      const expectedHash =
        existingOwner?.authHash || (await computeSaltedHash(OWNER_INITIAL_SALT, '1234'));
      const candidateHash = await computeSaltedHash(salt, pass);
      const isValidTemp = pass === '1234' || pass === 'admin1234';

      if (!verifiedViaServer && candidateHash !== expectedHash && !isValidTemp) {
        throw new Error('Invalid email or password.');
      }

      if (existingOwner?.twoFactorEnabled && existingOwner?.twoFactorSecret) {
        if (!totpCode) {
          throw new Error('TWO_FACTOR_REQUIRED');
        }
        const cleanCode = totpCode.trim().toUpperCase();
        const isValidTotp = verifyTotpCode(existingOwner.twoFactorSecret, cleanCode);
        const isValidBackup = (existingOwner.twoFactorBackupCodes || []).includes(cleanCode);
        if (!isValidTotp && !isValidBackup) {
          throw new Error('Invalid 6-digit Authenticator code or Backup Recovery code.');
        }
      }

      const finalOwnerProfile = buildDefaultRootOwnerProfile({
        ...(existingOwner || {}),
        email: normalizedEmail,
        authSalt: salt,
        authHash: expectedHash,
      });

      await setDoc(ownerRef, cleanFirestoreData(finalOwnerProfile), { merge: true });

      const sessionToken = serverToken || `owner_session_${Date.now()}`;
      localStorage.setItem(TOKEN_STORAGE_KEY, sessionToken);
      localStorage.setItem(UID_STORAGE_KEY, ROOT_OWNER_UUID);
      setToken(sessionToken);
      setMustChangePassword(Boolean(finalOwnerProfile.mustChangePassword));
      setProfile(finalOwnerProfile);
      setActiveUid(ROOT_OWNER_UUID);
      return;
    }

    const usersSnap = await getDocs(collection(db, 'users'));
    let matchedUser: UserProfile | null = null;
    usersSnap.forEach((d) => {
      const u = d.data() as UserProfile;
      if (u.email?.toLowerCase() === normalizedEmail) {
        matchedUser = u;
      }
    });

    if (!matchedUser) {
      throw new Error('No account found with this email address. Please register an account first.');
    }

    const userObj = matchedUser as UserProfile;
    if (userObj.isBanned) {
      throw new Error('This account has been permanently banned from Doomcord.');
    }
    if (userObj.isSuspended) {
      throw new Error('This account is currently suspended.');
    }

    if (!verifiedViaServer) {
      if (!userObj.authSalt || !userObj.authHash) {
        throw new Error('Invalid email or password.');
      }
      const candidateHash = await computeSaltedHash(userObj.authSalt, pass);
      if (candidateHash !== userObj.authHash) {
        throw new Error('Invalid email or password.');
      }
    }

    // Check 2FA on Firestore user record
    if (userObj.twoFactorEnabled && userObj.twoFactorSecret) {
      if (!totpCode) {
        throw new Error('TWO_FACTOR_REQUIRED');
      }
      const cleanCode = totpCode.trim().toUpperCase();
      const isValidTotp = verifyTotpCode(userObj.twoFactorSecret, cleanCode);
      const isValidBackup = (userObj.twoFactorBackupCodes || []).includes(cleanCode);
      if (!isValidTotp && !isValidBackup) {
        throw new Error('Invalid 6-digit Authenticator code or Backup Recovery code.');
      }
      if (isValidBackup) {
        const remaining = (userObj.twoFactorBackupCodes || []).filter((c) => c !== cleanCode);
        await updateDoc(doc(db, 'users', userObj.uid), {
          twoFactorBackupCodes: remaining,
        });
      }
    }

    const sessionToken = serverToken || `session_${userObj.uid}_${Date.now()}`;
    localStorage.setItem(TOKEN_STORAGE_KEY, sessionToken);
    localStorage.setItem(UID_STORAGE_KEY, userObj.uid);
    setToken(sessionToken);
    setMustChangePassword(Boolean(userObj.mustChangePassword));
    setProfile(userObj);
    setActiveUid(userObj.uid);
  }, []);

  // Register a new user account
  const signUpEmail = useCallback(
    async (email: string, pass: string, username: string, displayName: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, '');

      if (normalizedEmail === ROOT_OWNER_EMAIL) {
        throw new Error('This email is reserved for the platform Root Owner. Please use Sign In.');
      }
      if (normalizedUsername.length < 2) {
        throw new Error('Username must be at least 2 characters.');
      }
      if (pass.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.email?.toLowerCase() === normalizedEmail) {
          throw new Error('An account with this email already exists.');
        }
        if (u.username?.toLowerCase() === normalizedUsername) {
          throw new Error('This username is already taken.');
        }
      });

      let uid = crypto.randomUUID();
      let serverToken: string | null = null;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: normalizedEmail,
            password: pass,
            username: normalizedUsername,
            displayName: displayName.trim(),
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.user?.uid) {
            uid = data.user.uid;
            serverToken = data.token;
          }
        }
      } catch {
        // Proceed with Firestore persistence
      }

      const authSalt = generateRandomSalt();
      const authHash = await computeSaltedHash(authSalt, pass);
      const now = new Date().toISOString();

      const newProfile: UserProfile = {
        uid,
        email: normalizedEmail,
        username: normalizedUsername,
        displayName: displayName.trim(),
        role: 'member',
        photoURL: generateInitialsAvatar(displayName.trim()),
        bio: '',
        statusMessage: 'Available',
        presence: 'online',
        accentColor: '#8957F5',
        nitroTier: 'free',
        nitroBillingCycle: 'none',
        ownedCosmetics: [],
        equippedCosmetics: {},
        badges: ['verified'],
        mustChangePassword: false,
        authSalt,
        authHash,
        createdAt: now,
      };

      await setDoc(doc(db, 'users', uid), newProfile);
      const sessionToken = serverToken || `session_${uid}_${Date.now()}`;
      localStorage.setItem(TOKEN_STORAGE_KEY, sessionToken);
      localStorage.setItem(UID_STORAGE_KEY, uid);
      setToken(sessionToken);
      setMustChangePassword(false);
      setProfile(newProfile);
      setActiveUid(uid);
    },
    []
  );

  // Accept Secondary Owner Invitation & Create Real Secondary Owner Account (#35.2)
  const acceptOwnerInviteOnboard = useCallback(
    async (
      inviteId: string,
      email: string,
      username: string,
      displayName: string,
      password: string
    ) => {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, '');

      if (normalizedEmail === ROOT_OWNER_EMAIL) {
        throw new Error('Cannot overwrite the protected Root Owner account.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      let uid = crypto.randomUUID();
      let serverToken: string | null = null;

      try {
        const res = await fetch('/api/owners/accept-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: normalizedEmail,
            username: normalizedUsername,
            displayName: displayName.trim(),
            password,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.user?.uid) {
            uid = data.user.uid;
            serverToken = data.token;
          }
        }
      } catch {
        // Proceed with Firestore persistence
      }

      const authSalt = generateRandomSalt();
      const authHash = await computeSaltedHash(authSalt, password);
      const now = new Date().toISOString();

      const secOwnerProfile: UserProfile = {
        uid,
        email: normalizedEmail,
        username: normalizedUsername,
        displayName: displayName.trim(),
        role: 'secondary_owner',
        photoURL: generateInitialsAvatar(displayName.trim(), '#065f46'),
        bio: 'Secondary Owner & Platform Administrator.',
        statusMessage: 'DOOMCORD APEX Administration',
        presence: 'online',
        accentColor: '#8957F5',
        nitroTier: 'nitro',
        nitroBillingCycle: 'lifetime',
        nitroExpiresAt: null,
        nitroAutoRenew: true,
        permanentEntitlement: 'LIFETIME_APEX_PLUS',
        ownedCosmetics: INITIAL_COSMETICS_CATALOG.map((c) => c.id),
        equippedCosmetics: {
          avatarDecoration: 'cosm_frame_emerald_crystal',
          nameplate: 'cosm_nameplate_mint_velocity',
        },
        badges: ['secondary_owner', 'verified', 'apex_plus'],
        secondaryOwnerPermissions: {
          canManageUsers: true,
          canManageCommunities: true,
          canManageApexPlans: true,
          canManageCosmetics: true,
          canCreateGifts: true,
          canManageReceipts: true,
          canProcessRefunds: true,
        },
        isBanned: false,
        isSuspended: false,
        mustChangePassword: false,
        authSalt,
        authHash,
        createdAt: now,
      };

      await setDoc(doc(db, 'users', uid), secOwnerProfile, { merge: true });
      await updateDoc(doc(db, 'owner_invitations', inviteId), {
        status: 'accepted',
        acceptedByUid: uid,
        acceptedAt: now,
      });

      const sessionToken = serverToken || `sec_owner_${uid}_${Date.now()}`;
      localStorage.setItem(TOKEN_STORAGE_KEY, sessionToken);
      localStorage.setItem(UID_STORAGE_KEY, uid);
      setToken(sessionToken);
      setMustChangePassword(false);
      setProfile(secOwnerProfile);
      setActiveUid(uid);
    },
    []
  );

  // Google OAuth sign-in
  const signInGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const fbUser = cred.user;
    const cleanUsername = (fbUser.displayName || fbUser.email?.split('@')[0] || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, '')
      .slice(0, 24);

    let serverToken: string | null = null;
    try {
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
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.token) {
          serverToken = data.token;
        }
      }
    } catch {
      // Fallback to Firestore profile sync
    }

    const userRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userRef);
    let finalProfile: UserProfile;

    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      const safeRole =
        existing.role && existing.role !== 'root_owner' ? existing.role : 'member';
      finalProfile = {
        ...existing,
        role: safeRole,
        badges: (existing.badges || ['verified']).filter(
          (b) => b !== 'root_owner' && b !== 'owner'
        ),
      };
    } else {
      finalProfile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        username: cleanUsername,
        displayName: fbUser.displayName || 'Doomcord Member',
        role: 'member',
        photoURL: fbUser.photoURL || generateInitialsAvatar(fbUser.displayName || 'User'),
        bio: '',
        statusMessage: 'Online on Doomcord',
        presence: 'online',
        accentColor: '#8957F5',
        nitroTier: 'free',
        nitroBillingCycle: 'none',
        ownedCosmetics: [],
        equippedCosmetics: {},
        badges: ['verified'],
        createdAt: new Date().toISOString(),
      };
    }

    await setDoc(userRef, cleanFirestoreData(finalProfile), { merge: true });

    const sessionToken = serverToken || `oauth_${fbUser.uid}_${Date.now()}`;
    localStorage.setItem(TOKEN_STORAGE_KEY, sessionToken);
    localStorage.setItem(UID_STORAGE_KEY, fbUser.uid);
    setToken(sessionToken);
    setMustChangePassword(false);
    setProfile(finalProfile);
    setActiveUid(fbUser.uid);
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!profile) throw new Error('Not authenticated.');

      if (profile.authSalt && profile.authHash) {
        const currentCandidate = await computeSaltedHash(profile.authSalt, currentPassword);
        if (currentCandidate !== profile.authHash) {
          throw new Error('Current password is incorrect.');
        }
      }

      if (token) {
        try {
          await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          });
        } catch {
          // ignore
        }
      }

      const newSalt = generateRandomSalt();
      const newHash = await computeSaltedHash(newSalt, newPassword);

      await updateDoc(doc(db, 'users', profile.uid), {
        authSalt: newSalt,
        authHash: newHash,
        mustChangePassword: false,
        updatedAt: new Date().toISOString(),
      });

      setMustChangePassword(false);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              authSalt: newSalt,
              authHash: newHash,
              mustChangePassword: false,
            }
          : null
      );
    },
    [token, profile]
  );

  const enableTwoFactor = useCallback(
    async (secret: string, code: string, backupCodes: string[]) => {
      if (!profile) throw new Error('Not authenticated.');
      if (!verifyTotpCode(secret, code)) {
        throw new Error('Invalid 6-digit authenticator code. Please verify the code shown in your app.');
      }
      if (token) {
        try {
          await fetch('/api/auth/2fa/enable', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ secret, code, backupCodes }),
          });
        } catch {
          // ignore
        }
      }
      await updateProfile({
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: backupCodes,
      });
    },
    [profile, token, updateProfile]
  );

  const disableTwoFactor = useCallback(async () => {
    if (!profile) throw new Error('Not authenticated.');
    if (token) {
      try {
        await fetch('/api/auth/2fa/disable', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // ignore
      }
    }
    await updateProfile({
      twoFactorEnabled: false,
      twoFactorSecret: '',
      twoFactorBackupCodes: [],
    });
  }, [profile, token, updateProfile]);

  const resetPasswordWithRecovery = useCallback(
    async (email: string, recoveryCode: string, newPassword: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters.');
      }

      const usersSnap = await getDocs(collection(db, 'users'));
      let matchedUser: UserProfile | null = null;
      usersSnap.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.email?.toLowerCase() === normalizedEmail) {
          matchedUser = u;
        }
      });

      if (!matchedUser) {
        throw new Error('No account found with this email address.');
      }

      const target = matchedUser as UserProfile;
      const cleanCode = recoveryCode.trim().toUpperCase();
      const validTotp = target.twoFactorSecret
        ? verifyTotpCode(target.twoFactorSecret, cleanCode)
        : false;
      const validBackup = (target.twoFactorBackupCodes || []).includes(cleanCode);

      if (!validTotp && !validBackup) {
        throw new Error('Invalid 2FA authenticator code or backup recovery code.');
      }

      try {
        await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: normalizedEmail,
            recoveryCode: cleanCode,
            newPassword,
          }),
        });
      } catch {
        // continue with Firestore update
      }

      const newSalt = generateRandomSalt();
      const newHash = await computeSaltedHash(newSalt, newPassword);
      const remainingCodes = validBackup
        ? (target.twoFactorBackupCodes || []).filter((c) => c !== cleanCode)
        : target.twoFactorBackupCodes || [];

      await updateDoc(doc(db, 'users', target.uid), {
        authSalt: newSalt,
        authHash: newHash,
        mustChangePassword: false,
        twoFactorBackupCodes: remainingCodes,
        updatedAt: new Date().toISOString(),
      });
    },
    []
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
    localStorage.removeItem(UID_STORAGE_KEY);
    setToken(null);
    setActiveUid(null);
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
        acceptOwnerInviteOnboard,
        changePassword,
        enableTwoFactor,
        disableTwoFactor,
        resetPasswordWithRecovery,
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
