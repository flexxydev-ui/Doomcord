import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { Megaphone, ArrowLeft, Sparkles } from 'lucide-react';
import { AuthProvider, useAuth, sha256HexBrowser } from './context/AuthContext';
import { AuthView } from './components/auth/AuthView';
import { LeftNavRail } from './components/navigation/LeftNavRail';
import { ContextSidebar } from './components/navigation/ContextSidebar';
import { ContextualPanel } from './components/panels/ContextualPanel';
import { HomeDashboardView } from './components/home/HomeDashboardView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { UserProfileView } from './components/profile/UserProfileView';
import { ChatView } from './components/chat/ChatView';
import { FriendsHub } from './components/friends/FriendsHub';
import { OrbsSpatialCanvas } from './components/orbs/OrbsSpatialCanvas';
import { VoiceChannelDock } from './components/voice/VoiceChannelDock';
import { VoiceStageView } from './components/voice/VoiceStageView';
import { ExploreCommunitiesView } from './components/discovery/ExploreCommunitiesView';
import { NitroView } from './components/nitro/NitroView';
import { CosmeticsShopView } from './components/shop/CosmeticsShopView';
import { GiftRedemptionView } from './components/gifts/GiftRedemptionView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { SettingsModal } from './components/modals/SettingsModal';
import { CreateCommunityModal } from './components/modals/CreateCommunityModal';
import { CreateOrbModal } from './components/modals/CreateOrbModal';
import { CreateChannelModal } from './components/modals/CreateChannelModal';
import {
  RazorpayCheckoutModal,
  CheckoutPayload,
  GiftCheckoutOptions,
  CheckoutCompletionResult,
} from './components/modals/RazorpayCheckoutModal';
import { ForcePasswordChangeModal } from './components/modals/ForcePasswordChangeModal';
import { ReceiptDocumentModal } from './components/receipts/ReceiptDocumentModal';
import { QuickSwitcherModal } from './components/modals/QuickSwitcherModal';
import { CommunityStarterTemplate } from './lib/chatEnhancements';

import {
  INITIAL_NITRO_PLANS,
  INITIAL_COSMETICS_CATALOG,
  INITIAL_SYSTEM_CONFIG,
  generateInitialsAvatar,
  computeDurationExpiry,
  formatApexTierName,
  formatDurationLabel,
  isRootOwner,
  isAdminOrAbove,
  cleanFirestoreData,
} from './lib/dataService';
import { db, testConnection } from './lib/firebase';
import {
  Community,
  Channel,
  OrbData,
  ChatMessage,
  DirectMessageThread,
  FriendRequest,
  UserProfile,
  ActiveView,
  VoiceParticipant,
  MessageAttachment,
  PollData,
  NitroPlanConfig,
  CosmeticItem,
  CosmeticCategory,
  TransactionRecord,
  AuditLogEntry,
  SystemConfigData,
  PlatformRole,
  EquippedCosmetics,
  GiftRecord,
  GiftDuration,
  GiftRedemptionRecord,
  OwnerInvitationRecord,
  ReceiptRecord,
} from './types';

function generateSecureTokenString(prefix: string): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `${prefix}-${raw.slice(0, 8)}-${raw.slice(8, 16)}-${raw.slice(16, 24)}`;
}

function MainApp() {
  const {
    profile,
    token,
    loading,
    mustChangePassword,
    setPresence,
    updateProfile,
    acceptOwnerInviteOnboard,
    changePassword,
    logout,
  } = useAuth();

  // Real Firestore-synchronized collections
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [orbs, setOrbs] = useState<OrbData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [dmDocs, setDmDocs] = useState<DirectMessageThread[]>([]);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [nitroPlans, setNitroPlans] = useState<NitroPlanConfig[]>(INITIAL_NITRO_PLANS);
  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>(INITIAL_COSMETICS_CATALOG);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [ownerInvitations, setOwnerInvitations] = useState<OwnerInvitationRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfigData>(INITIAL_SYSTEM_CONFIG);

  // Active navigation view state
  const [activeView, setActiveView] = useState<ActiveView>({
    type: 'home',
  });

  // Right contextual panel visibility toggle
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Selected Orb for 3D inspection or lounge room
  const [selectedOrb, setSelectedOrb] = useState<OrbData | null>(null);

  // Active Voice/Stage room state
  const [activeVoice, setActiveVoice] = useState<{
    channel: Channel;
    communityName: string;
  } | null>(null);
  const [voiceIsMuted, setVoiceIsMuted] = useState(false);

  // Modals & Checkout states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [isCreateOrbOpen, setIsCreateOrbOpen] = useState(false);
  const [createChannelCommunityId, setCreateChannelCommunityId] = useState<string | null>(null);
  const [checkoutPayload, setCheckoutPayload] = useState<CheckoutPayload | null>(null);
  const [passwordModalDismissed, setPasswordModalDismissed] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<ReceiptRecord | null>(null);
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);

  // Global Ctrl+K / Cmd+K Quick Switcher keyboard shortcut
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSwitcherOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Verify Firebase Firestore connection on initial boot
  useEffect(() => {
    testConnection();
  }, []);

  // Check URL query params for direct gift or owner invitation links (?gift=... or ?owner_invite=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const giftToken = params.get('gift');
    const inviteToken = params.get('owner_invite');
    if (giftToken) {
      setActiveView({ type: 'gift_redeem', token: giftToken });
    } else if (inviteToken) {
      setActiveView({ type: 'owner_invite_accept', token: inviteToken });
    }
  }, []);

  // Helper to record an immutable audit log entry
  const recordAuditLog = useCallback(
    async (
      action: string,
      details: string,
      targetUid?: string,
      targetEmail?: string
    ) => {
      if (!profile) return;
      const logId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const entry: Record<string, any> = {
        id: logId,
        actorUid: profile.uid,
        actorEmail: profile.email,
        action,
        details: targetEmail ? `[${targetEmail}] ${details}` : details,
        createdAt: new Date().toISOString(),
      };
      if (targetUid) {
        entry.targetId = targetUid;
      }
      try {
        await setDoc(doc(db, 'audit_logs', logId), cleanFirestoreData(entry));
      } catch (e) {
        console.warn('Audit log write skipped:', e);
      }
    },
    [profile]
  );

  // Real-time Firestore listeners
  useEffect(() => {
    if (!profile) return;

    // 1. Users directory
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        if (!d.id.startsWith('demo_')) {
          list.push(d.data() as UserProfile);
        }
      });
      setAllUsers(list);
    });

    // 2. Communities & their channels
    const unsubCommunities = onSnapshot(collection(db, 'communities'), async (snap) => {
      const commList: Community[] = [];
      for (const d of snap.docs) {
        const comm = d.data() as Community;
        try {
          const chSnap = await getDocs(collection(db, 'communities', d.id, 'channels'));
          const chList: Channel[] = [];
          chSnap.forEach((chDoc) => chList.push(chDoc.data() as Channel));
          chList.sort((a, b) => (a.position || 0) - (b.position || 0));
          comm.channels = chList.length > 0 ? chList : comm.channels || [];
        } catch {
          comm.channels = comm.channels || [];
        }
        commList.push(comm);
      }
      setCommunities(commList);
    });

    // 3. Orbs
    const unsubOrbs = onSnapshot(collection(db, 'orbs'), (snap) => {
      const list: OrbData[] = [];
      snap.forEach((d) => list.push(d.data() as OrbData));
      setOrbs(list);
    });

    // 4. Friend Requests
    const unsubReqs = onSnapshot(collection(db, 'friend_requests'), (snap) => {
      const list: FriendRequest[] = [];
      snap.forEach((d) => {
        const req = d.data() as FriendRequest;
        if (
          req.status === 'pending' &&
          (req.fromUid === profile.uid || req.toUid === profile.uid)
        ) {
          list.push(req);
        }
      });
      setPendingRequests(list);
    });

    // 5. Direct Message threads
    const unsubDms = onSnapshot(collection(db, 'direct_messages'), (snap) => {
      const list: DirectMessageThread[] = [];
      snap.forEach((d) => {
        const dm = d.data() as DirectMessageThread;
        if (dm.participants && dm.participants.includes(profile.uid)) {
          list.push(dm);
        }
      });
      setDmDocs(list);
    });

    // 6. APEX plans
    const unsubPlans = onSnapshot(collection(db, 'nitro_plans'), (snap) => {
      if (!snap.empty) {
        const list: NitroPlanConfig[] = [];
        snap.forEach((d) => list.push(d.data() as NitroPlanConfig));
        const order: Record<string, number> = { free: 0, basic: 1, nitro: 2 };
        list.sort((a, b) => (order[a.id] ?? 9) - (order[b.id] ?? 9));
        setNitroPlans(list);
      }
    });

    // 7. Cosmetics catalog
    const unsubCosmetics = onSnapshot(collection(db, 'cosmetics'), (snap) => {
      if (!snap.empty) {
        const list: CosmeticItem[] = [];
        snap.forEach((d) => list.push(d.data() as CosmeticItem));
        setCosmetics(list);
      }
    });

    // 8. Transactions
    const unsubTx = onSnapshot(collection(db, 'transactions'), (snap) => {
      const list: TransactionRecord[] = [];
      snap.forEach((d) => list.push(d.data() as TransactionRecord));
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTransactions(list);
    });

    // 9. Gifts
    const unsubGifts = onSnapshot(collection(db, 'gifts'), (snap) => {
      const list: GiftRecord[] = [];
      snap.forEach((d) => list.push(d.data() as GiftRecord));
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setGifts(list);
    });

    // 10. Owner Invitations
    const unsubInvites = onSnapshot(collection(db, 'owner_invitations'), (snap) => {
      const list: OwnerInvitationRecord[] = [];
      snap.forEach((d) => list.push(d.data() as OwnerInvitationRecord));
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOwnerInvitations(list);
    });

    // 11. Official Receipts
    const unsubReceipts = onSnapshot(collection(db, 'receipts'), (snap) => {
      const list: ReceiptRecord[] = [];
      snap.forEach((d) => list.push(d.data() as ReceiptRecord));
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReceipts(list);
    });

    // 12. Audit Logs
    const unsubLogs = onSnapshot(collection(db, 'audit_logs'), (snap) => {
      const list: AuditLogEntry[] = [];
      snap.forEach((d) => list.push(d.data() as AuditLogEntry));
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAuditLogs(list);
    });

    // 13. Global System Config
    const unsubSys = onSnapshot(doc(db, 'system_config', 'global'), (snap) => {
      if (snap.exists()) {
        setSystemConfig(snap.data() as SystemConfigData);
      }
    });

    return () => {
      unsubUsers();
      unsubCommunities();
      unsubOrbs();
      unsubReqs();
      unsubDms();
      unsubPlans();
      unsubCosmetics();
      unsubTx();
      unsubGifts();
      unsubInvites();
      unsubReceipts();
      unsubLogs();
      unsubSys();
    };
  }, [profile?.uid]);

  // Helper to get the Firestore collection reference path for the active conversation's messages
  const getActiveMessagesCollectionRef = useCallback(() => {
    if (activeView.type === 'dm' && activeView.dmId) {
      return collection(db, 'direct_messages', activeView.dmId, 'messages');
    }
    if (
      activeView.type === 'community' &&
      activeView.communityId &&
      activeView.channelId
    ) {
      return collection(
        db,
        'communities',
        activeView.communityId,
        'channels',
        activeView.channelId,
        'messages'
      );
    }
    if (
      activeView.type === 'orbs' &&
      activeView.viewMode === 'detail' &&
      activeView.orbId
    ) {
      return collection(db, 'orbs', activeView.orbId, 'messages');
    }
    return null;
  }, [activeView]);

  // Subscribe to real-time messages in the active conversation
  useEffect(() => {
    const colRef = getActiveMessagesCollectionRef();
    if (!colRef) {
      setActiveMessages([]);
      return;
    }

    const q = query(colRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: ChatMessage[] = [];
      snap.forEach((d) => list.push(d.data() as ChatMessage));
      setActiveMessages(list);
    });

    return () => unsub();
  }, [getActiveMessagesCollectionRef]);

  // Derive current user's real friends from profile.friends UIDs
  const friends: UserProfile[] = useMemo(() => {
    if (!profile) return [];
    const friendIds = profile.friends || [];
    return allUsers.filter((u) => friendIds.includes(u.uid));
  }, [profile, allUsers]);

  // Enrich Direct Message threads with recipient profile
  const directMessages: DirectMessageThread[] = useMemo(() => {
    if (!profile) return [];
    return dmDocs.map((dm) => {
      const otherUid =
        dm.participants.find((id) => id !== profile.uid) || profile.uid;
      const recipientProfile = allUsers.find((u) => u.uid === otherUid);
      return {
        ...dm,
        recipientProfile,
      };
    });
  }, [dmDocs, allUsers, profile]);

  const unreadDmCount = directMessages.reduce(
    (acc, dm) => acc + (dm.unreadCount || 0),
    0
  );

  // Unclaimed gifts targeted at current user + incoming friend requests for notification badge
  const unreadNotificationCount = useMemo(() => {
    if (!profile) return 0;
    const incomingReqs = pendingRequests.filter((r) => r.toUid === profile.uid).length;
    const myUnclaimedGifts = gifts.filter(
      (g) =>
        g.status === 'unclaimed' &&
        ((g.restrictedRecipientEmail &&
          g.restrictedRecipientEmail.toLowerCase() === profile.email.toLowerCase()) ||
          (g.restrictedRecipientUsername &&
            g.restrictedRecipientUsername.toLowerCase() === profile.username.toLowerCase()))
    ).length;
    return incomingReqs + myUnclaimedGifts;
  }, [profile, pendingRequests, gifts]);

  // Real voice participants
  const voiceParticipants: VoiceParticipant[] = useMemo(() => {
    if (!profile) return [];
    return [
      {
        uid: profile.uid,
        displayName: profile.displayName,
        photoURL:
          profile.photoURL ||
          generateInitialsAvatar(profile.displayName || profile.username),
        isMuted: voiceIsMuted,
        isDeafened: false,
        isSpeaking: false,
        volumeLevel: 0,
        isStageSpeaker: true,
        joinedAt: new Date().toISOString(),
      },
    ];
  }, [profile, voiceIsMuted]);

  // Mark messages in conversation as read in Firestore
  const handleMarkAsRead = useCallback(
    async (_convId: string) => {
      if (!profile) return;
      const colRef = getActiveMessagesCollectionRef();
      if (!colRef) return;

      const unread = activeMessages.filter(
        (m) => !m.readBy || !m.readBy.includes(profile.uid)
      );
      for (const msg of unread) {
        try {
          const nextReadBy = Array.from(
            new Set([...(msg.readBy || [msg.senderId]), profile.uid])
          );
          await updateDoc(doc(colRef, msg.id), { readBy: nextReadBy });
        } catch {
          // ignore transient permission or missing doc
        }
      }
    },
    [profile, getActiveMessagesCollectionRef, activeMessages]
  );

  // Send a new chat message to Firestore
  const handleSendMessage = useCallback(
    async (
      content: string,
      attachments?: MessageAttachment[],
      replyTo?: { id: string; senderName: string; content: string },
      poll?: PollData
    ) => {
      if (!profile) return;
      const colRef = getActiveMessagesCollectionRef();
      if (!colRef) return;

      let convId = '';
      if (activeView.type === 'dm') convId = activeView.dmId;
      else if (activeView.type === 'community') convId = activeView.channelId;
      else if (activeView.type === 'orbs' && activeView.orbId)
        convId = activeView.orbId;

      const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();

      const newMessage: ChatMessage = {
        id: msgId,
        conversationId: convId,
        senderId: profile.uid,
        senderName: profile.displayName,
        senderAvatar:
          profile.photoURL ||
          generateInitialsAvatar(profile.displayName || profile.username),
        senderRole: profile.role,
        senderNitroTier: profile.nitroTier,
        content,
        attachments: attachments || [],
        replyTo,
        poll,
        readBy: [profile.uid],
        createdAt: now,
      };

      await setDoc(doc(colRef, msgId), cleanFirestoreData(newMessage));

      if (activeView.type === 'dm') {
        try {
          await updateDoc(doc(db, 'direct_messages', activeView.dmId), {
            lastMessageText: content,
            lastMessageSenderId: profile.uid,
            lastMessageAt: now,
          });
        } catch {
          // ignore
        }
      }
    },
    [profile, activeView, getActiveMessagesCollectionRef]
  );

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const colRef = getActiveMessagesCollectionRef();
      if (!colRef) return;
      await updateDoc(doc(colRef, messageId), {
        content: newContent,
        isEdited: true,
        updatedAt: new Date().toISOString(),
      });
    },
    [getActiveMessagesCollectionRef]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      const colRef = getActiveMessagesCollectionRef();
      if (!colRef) return;
      await deleteDoc(doc(colRef, messageId));
    },
    [getActiveMessagesCollectionRef]
  );

  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!profile) return;
      const colRef = getActiveMessagesCollectionRef();
      if (!colRef) return;

      const msg = activeMessages.find((m) => m.id === messageId);
      if (!msg) return;

      const currentReactions = msg.reactions || {};
      const userList = currentReactions[emoji] || [];
      const hasReacted = userList.includes(profile.uid);

      const updatedUsers = hasReacted
        ? userList.filter((id) => id !== profile.uid)
        : [...userList, profile.uid];

      const nextReactions = { ...currentReactions };
      if (updatedUsers.length === 0) {
        delete nextReactions[emoji];
      } else {
        nextReactions[emoji] = updatedUsers;
      }

      await updateDoc(doc(colRef, messageId), { reactions: nextReactions });
    },
    [profile, activeMessages, getActiveMessagesCollectionRef]
  );

  const handleTogglePin = useCallback(
    async (messageId: string) => {
      const colRef = getActiveMessagesCollectionRef();
      if (!colRef) return;
      const msg = activeMessages.find((m) => m.id === messageId);
      if (!msg) return;
      await updateDoc(doc(colRef, messageId), { isPinned: !msg.isPinned });
    },
    [activeMessages, getActiveMessagesCollectionRef]
  );

  const handleVotePoll = useCallback(
    async (messageId: string, optionId: string) => {
      if (!profile) return;
      const colRef = getActiveMessagesCollectionRef();
      if (!colRef) return;
      const msg = activeMessages.find((m) => m.id === messageId);
      if (!msg || !msg.poll) return;

      const updatedOptions = msg.poll.options.map((opt) => {
        const voters = opt.voterIds || [];
        const hasVoted = voters.includes(profile.uid);
        if (opt.id === optionId) {
          return {
            ...opt,
            voterIds: hasVoted
              ? voters.filter((id) => id !== profile.uid)
              : [...voters, profile.uid],
          };
        }
        return {
          ...opt,
          voterIds: voters.filter((id) => id !== profile.uid),
        };
      });

      await updateDoc(doc(colRef, messageId), {
        poll: {
          ...msg.poll,
          options: updatedOptions,
        },
      });
    },
    [profile, activeMessages, getActiveMessagesCollectionRef]
  );

  const handleToggleBookmark = useCallback(
    async (messageId: string) => {
      if (!profile) return;
      const currentSaved = profile.savedMessages || [];
      const nextSaved = currentSaved.includes(messageId)
        ? currentSaved.filter((id) => id !== messageId)
        : [...currentSaved, messageId];
      await updateProfile({ savedMessages: nextSaved });
    },
    [profile, updateProfile]
  );

  // Real Social Friendship actions
  const handleSendFriendRequest = useCallback(
    async (targetUser: UserProfile) => {
      if (!profile) return;
      const reqId = `req_${profile.uid}_${targetUser.uid}`;
      const newReq: FriendRequest = {
        id: reqId,
        fromUid: profile.uid,
        toUid: targetUser.uid,
        fromUsername: profile.username,
        fromDisplayName: profile.displayName,
        fromPhotoURL: profile.photoURL,
        toUsername: targetUser.username,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'friend_requests', reqId), cleanFirestoreData(newReq));
    },
    [profile]
  );

  const handleAcceptRequest = useCallback(
    async (req: FriendRequest) => {
      if (!profile) return;
      await updateDoc(doc(db, 'friend_requests', req.id), {
        status: 'accepted',
      });

      const myFriends = Array.from(
        new Set([...(profile.friends || []), req.fromUid])
      );
      await updateProfile({ friends: myFriends });

      const senderProfile = allUsers.find((u) => u.uid === req.fromUid);
      if (senderProfile) {
        const senderFriends = Array.from(
          new Set([...(senderProfile.friends || []), profile.uid])
        );
        await updateDoc(doc(db, 'users', senderProfile.uid), {
          friends: senderFriends,
        });
      }
    },
    [profile, allUsers, updateProfile]
  );

  const handleRejectRequest = useCallback(async (reqId: string) => {
    await deleteDoc(doc(db, 'friend_requests', reqId));
  }, []);

  const handleRemoveFriend = useCallback(
    async (uid: string) => {
      if (!profile) return;
      const nextFriends = (profile.friends || []).filter((id) => id !== uid);
      await updateProfile({ friends: nextFriends });

      const otherUser = allUsers.find((u) => u.uid === uid);
      if (otherUser) {
        const otherFriends = (otherUser.friends || []).filter(
          (id) => id !== profile.uid
        );
        await updateDoc(doc(db, 'users', uid), { friends: otherFriends });
      }
    },
    [profile, allUsers, updateProfile]
  );

  const handleBlockUser = useCallback(
    async (uid: string) => {
      if (!profile) return;
      await updateProfile({
        blockedUsers: Array.from(new Set([...(profile.blockedUsers || []), uid])),
      });
    },
    [profile, updateProfile]
  );

  const handleUnblockUser = useCallback(
    async (uid: string) => {
      if (!profile) return;
      await updateProfile({
        blockedUsers: (profile.blockedUsers || []).filter((id) => id !== uid),
      });
    },
    [profile, updateProfile]
  );

  // Open or create a real Direct Message thread in Firestore
  const handleOpenDmWithUser = useCallback(
    async (targetUser: UserProfile) => {
      if (!profile) return;
      const existing = dmDocs.find(
        (d) =>
          d.participants.includes(profile.uid) &&
          d.participants.includes(targetUser.uid)
      );
      if (existing) {
        setActiveView({ type: 'dm', dmId: existing.id });
        return;
      }

      const pair = [profile.uid, targetUser.uid].sort();
      const dmId = `dm_${pair[0]}_${pair[1]}`;
      const now = new Date().toISOString();
      const newDm: DirectMessageThread = {
        id: dmId,
        participants: [profile.uid, targetUser.uid],
        lastMessageText: 'Conversation started',
        lastMessageSenderId: profile.uid,
        lastMessageAt: now,
        unreadCount: 0,
        createdAt: now,
      };
      await setDoc(doc(db, 'direct_messages', dmId), cleanFirestoreData(newDm), { merge: true });
      setActiveView({ type: 'dm', dmId });
    },
    [profile, dmDocs]
  );

  // Community & Channels creation in Firestore (supports 1-click multi-channel starter templates)
  const handleCreateCommunity = useCallback(
    async (
      commData: Partial<Community>,
      template?: CommunityStarterTemplate
    ) => {
      if (!profile) return;
      const commId = `comm_${Date.now()}`;
      const now = new Date().toISOString();

      const channelDefinitions = template?.channels || [
        {
          name: 'announcements',
          topic: 'Official community updates and broadcasts',
          type: 'announcement' as const,
        },
        {
          name: 'general',
          topic: 'Main community discussion',
          type: 'text' as const,
        },
        {
          name: 'Voice Lounge',
          topic: 'Live WebRTC audio room',
          type: 'voice' as const,
        },
      ];

      const createdChannels: Channel[] = channelDefinitions.map((def, idx) => ({
        id: `ch_${Date.now()}_${idx + 1}`,
        communityId: commId,
        name: def.name,
        topic: def.topic,
        type: def.type,
        position: idx + 1,
        createdAt: now,
      }));

      const newComm: Community = {
        id: commId,
        name: commData.name || 'New Community',
        description: commData.description || 'A real Doomcord community server.',
        iconUrl:
          commData.iconUrl ||
          generateInitialsAvatar(commData.name || 'Community', '#8957F5'),
        themeColor: commData.themeColor || '#8957F5',
        ownerId: profile.uid,
        isPublic: true,
        members: [profile.uid],
        channels: createdChannels,
        memberCount: 1,
        boostCount: 0,
        boostedBy: [],
        createdAt: now,
      };

      for (const ch of createdChannels) {
        await setDoc(
          doc(db, 'communities', commId, 'channels', ch.id),
          cleanFirestoreData(ch)
        );
      }
      await setDoc(doc(db, 'communities', commId), cleanFirestoreData(newComm));

      const nextJoined = Array.from(
        new Set([...(profile.joinedCommunities || []), commId])
      );
      await updateProfile({ joinedCommunities: nextJoined });

      const defaultTextChannel =
        createdChannels.find((c) => c.type === 'text') || createdChannels[0];
      setActiveView({
        type: 'community',
        communityId: commId,
        channelId: defaultTextChannel.id,
      });
    },
    [profile, updateProfile]
  );

  const handleBoostCommunity = useCallback(
    async (communityId: string) => {
      if (!profile) return;
      const comm = communities.find((c) => c.id === communityId);
      if (!comm) return;
      const nextBoostCount = (comm.boostCount || 0) + 1;
      const nextBoostedBy = Array.from(
        new Set([...(comm.boostedBy || []), profile.uid])
      );
      await updateDoc(doc(db, 'communities', communityId), {
        boostCount: nextBoostCount,
        boostedBy: nextBoostedBy,
      });
      await recordAuditLog(
        'SERVER_BOOST_APPLIED',
        `User @${profile.username} boosted community "${comm.name}" (Total Boosts: ${nextBoostCount})`,
        profile.uid,
        profile.email
      );
    },
    [profile, communities, recordAuditLog]
  );

  const handleJoinCommunity = useCallback(
    async (comm: Community) => {
      if (!profile) return;
      const isAlreadyJoined = (profile.joinedCommunities || []).includes(comm.id);
      if (!isAlreadyJoined) {
        const nextJoined = Array.from(
          new Set([...(profile.joinedCommunities || []), comm.id])
        );
        await updateProfile({ joinedCommunities: nextJoined });
        await updateDoc(doc(db, 'communities', comm.id), {
          members: Array.from(new Set([...(comm.members || []), profile.uid])),
          memberCount: (comm.memberCount || 1) + 1,
        });
      }
      const firstTextChannel =
        comm.channels?.find((c) => c.type === 'text') || comm.channels?.[0];
      if (firstTextChannel) {
        setActiveView({
          type: 'community',
          communityId: comm.id,
          channelId: firstTextChannel.id,
        });
      }
    },
    [profile, updateProfile]
  );

  const handleCreateChannel = useCallback(
    async (channelData: Partial<Channel>) => {
      if (!createChannelCommunityId) return;
      const chId = `ch_${Date.now()}`;
      const existingComm = communities.find(
        (c) => c.id === createChannelCommunityId
      );
      const newChannel: Channel = {
        id: chId,
        communityId: createChannelCommunityId,
        name: channelData.name || 'new-channel',
        topic: channelData.topic || '',
        type: channelData.type || 'text',
        position: (existingComm?.channels?.length || 0) + 1,
        createdAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, 'communities', createChannelCommunityId, 'channels', chId),
        cleanFirestoreData(newChannel)
      );

      if (existingComm) {
        await updateDoc(doc(db, 'communities', createChannelCommunityId), {
          channels: [...(existingComm.channels || []), cleanFirestoreData(newChannel)],
        });
      }

      setActiveView({
        type: 'community',
        communityId: createChannelCommunityId,
        channelId: chId,
      });
      setCreateChannelCommunityId(null);
    },
    [createChannelCommunityId, communities]
  );

  // Create Orb in Firestore
  const handleCreateOrb = useCallback(
    async (orbData: Partial<OrbData>) => {
      if (!profile) return;
      const orbId = `orb_${Date.now()}`;
      const newOrb: OrbData = {
        id: orbId,
        name: orbData.name || 'New Orb',
        description: orbData.description || 'Spatial realm in Doomcord.',
        category: orbData.category || 'Gaming',
        icon: 'Sparkles',
        primaryColor: orbData.primaryColor || '#8957F5',
        secondaryColor: orbData.secondaryColor || '#10b981',
        visibility: orbData.visibility || 'public',
        creatorId: profile.uid,
        creatorName: profile.displayName,
        memberCount: 1,
        activityScore: 100,
        tags: orbData.tags || ['Community'],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'orbs', orbId), cleanFirestoreData(newOrb));
      setSelectedOrb(newOrb);
    },
    [profile]
  );

  // Channel Selection router
  const handleSelectChannel = (commId: string, channelId: string) => {
    const comm = communities.find((c) => c.id === commId);
    const channel = comm?.channels?.find((ch) => ch.id === channelId);

    if (channel?.type === 'voice' || channel?.type === 'stage') {
      setActiveVoice({
        channel,
        communityName: comm?.name || 'Community',
      });
    }

    setActiveView({
      type: 'community',
      communityId: commId,
      channelId,
    });
  };

  // Equip or unequip cosmetic item
  const handleEquipCosmetic = useCallback(
    async (category: CosmeticCategory, itemId: string | undefined) => {
      if (!profile) return;
      const currentEquipped: EquippedCosmetics = {
        ...(profile.equippedCosmetics || {}),
      };

      const setOrDelete = (key: keyof EquippedCosmetics, val: string | undefined) => {
        if (val) {
          currentEquipped[key] = val;
        } else {
          delete currentEquipped[key];
        }
      };

      switch (category) {
        case 'Avatar Decorations':
          setOrDelete('avatarDecoration', itemId);
          break;
        case 'Profile Effects':
          setOrDelete('profileEffect', itemId);
          break;
        case 'Profile Themes':
          setOrDelete('profileTheme', itemId);
          break;
        case 'Nameplates':
          setOrDelete('nameplate', itemId);
          break;
        case 'Banners':
          setOrDelete('banner', itemId);
          break;
        case 'App Themes and Icons':
          setOrDelete('appTheme', itemId);
          break;
        case 'Chat Cosmetics':
          setOrDelete('chatCosmetic', itemId);
          break;
        case 'Sound Effects':
          setOrDelete('soundEffect', itemId);
          break;
        default:
          setOrDelete('profileEffect', itemId);
          break;
      }

      await updateProfile({ equippedCosmetics: currentEquipped });
    },
    [profile, updateProfile]
  );

  // Verified Razorpay payment fulfillment (supports Personal Purchase AND Send as a Gift)
  const handleVerifiedCheckoutSuccess = useCallback(
    async (
      payload: CheckoutPayload,
      paymentDetails: { orderId: string; paymentId: string; signature: string },
      modalGiftOptions?: GiftCheckoutOptions
    ): Promise<CheckoutCompletionResult | void> => {
      if (!profile) return;
      const now = new Date();
      const nowIso = now.toISOString();
      const txId = `tx_${Date.now()}`;
      const receiptId = `rcp_${Date.now()}`;
      const receiptNumber = `DC-RCP-${new Date().getFullYear()}-${String(
        Math.floor(100000 + Math.random() * 900000)
      )}`;
      const accessToken = generateSecureTokenString('RCP');

      const effectiveGiftOptions =
        modalGiftOptions || payload.prefilledGiftOptions;
      const isGiftPurchase = Boolean(
        effectiveGiftOptions?.isGift || payload.initialGiftMode
      );

      // CASE A: Paid APEX / APEX+ Gift Purchase (#37)
      // Strictly does NOT activate membership on the purchaser's account.
      if (isGiftPurchase && payload.type === 'nitro_subscription' && payload.tier) {
        const claimToken = generateSecureTokenString('APEX');
        const tokenHash = await sha256HexBrowser(claimToken);
        const giftId = `gift_${Date.now()}`;
        const giftDuration: GiftDuration =
          payload.billingCycle === 'yearly' ? '1y' : '1m';
        const giftBillingCycle: 'monthly' | 'yearly' =
          payload.billingCycle === 'yearly' ? 'yearly' : 'monthly';
        const serviceExpiryIso = computeDurationExpiry(
          giftDuration,
          now,
          giftBillingCycle
        );
        const durationLabel = formatDurationLabel(giftDuration, giftBillingCycle);

        const recipientMode = effectiveGiftOptions?.recipientMode || 'anyone';
        const recipientUsername = effectiveGiftOptions?.recipientUsername?.trim();
        const recipientEmail = effectiveGiftOptions?.recipientEmail?.trim();

        const giftRecordData: any = {
          id: giftId,
          claimToken,
          tokenHash,
          tokenPreview: `${claimToken.slice(0, 9)}...`,
          creatorUid: profile.uid,
          creatorName: profile.displayName,
          apexTier: payload.tier,
          cosmeticIds: [],
          duration: giftDuration,
          billingCycle: giftBillingCycle,
          personalMessage:
            effectiveGiftOptions?.personalMessage ||
            `Enjoy your DOOMCORD ${formatApexTierName(payload.tier)} membership gift!`,
          isPaidGift: true,
          purchaserUid: profile.uid,
          amountPaidINR: payload.amountINR,
          razorpayOrderId: paymentDetails.orderId,
          razorpayPaymentId: paymentDetails.paymentId,
          receiptId,
          status: 'unclaimed',
          createdAt: nowIso,
        };

        if (effectiveGiftOptions?.recipientUid) {
          giftRecordData.restrictedRecipientUid = effectiveGiftOptions.recipientUid;
        }
        if (recipientMode === 'username' && recipientUsername?.trim()) {
          giftRecordData.restrictedRecipientUsername = recipientUsername.trim().replace(/^@/, '');
        }
        if (recipientMode === 'email' && recipientEmail) {
          giftRecordData.restrictedRecipientEmail = recipientEmail.toLowerCase();
        }

        const giftRecord: GiftRecord = cleanFirestoreData(giftRecordData);

        const recipientInfoLabel =
          recipientMode === 'username' && recipientUsername
            ? `@${recipientUsername.replace(/^@/, '')}`
            : recipientMode === 'email' && recipientEmail
            ? recipientEmail.toLowerCase()
            : 'Anyone with the single-use gift link';

        const giftReceipt: ReceiptRecord = {
          id: receiptId,
          receiptNumber,
          accessToken,
          receiptType: 'APEX Gift Receipt',
          title: 'APEX Gift Receipt',
          description: `${payload.itemName} purchased as a gift (${durationLabel})`,
          customerUid: profile.uid,
          customerUsername: profile.username,
          customerDisplayName: profile.displayName,
          customerEmail: profile.email,
          items: [
            {
              id: `item_${Date.now()}`,
              productName: `${payload.itemName} (Gift Link)`,
              category: 'APEX Gift Membership',
              quantity: 1,
              unitPriceINR: payload.amountINR,
              discountINR: 0,
              finalAmountINR: payload.amountINR,
              durationPreset: payload.billingCycle === 'yearly' ? '1y' : '30d',
              durationLabel,
              serviceStartDate: nowIso,
              serviceExpiryDate: serviceExpiryIso,
            },
          ],
          subtotalINR: payload.amountINR,
          discountTotalINR: 0,
          taxINR: 0,
          totalAmountINR: payload.amountINR,
          currency: 'INR',
          paymentMethod:
            effectiveGiftOptions?.paymentMethodLabel ||
            'Razorpay Verified Checkout',
          paymentStatus: 'Paid',
          transactionId: paymentDetails.paymentId,
          issueDate: nowIso,
          serviceStartDate: nowIso,
          serviceExpiryDate: serviceExpiryIso,
          serviceDurationLabel: durationLabel,
          notes: `Gift Recipient: ${recipientInfoLabel}. Gift ID: ${giftId}.`,
          purchaseNature: 'gift_purchase',
          giftRecipientInfo: recipientInfoLabel,
          linkedGiftId: giftId,
          giftRedemptionStatus: 'unclaimed',
          issuerUid: profile.uid,
          issuerName: 'Doomcord Automated Billing',
          issuerEmail: profile.email,
          issuerRole: profile.role,
          auditHistory: [
            {
              id: `rev_${Date.now()}`,
              receiptId,
              actorUid: profile.uid,
              actorEmail: profile.email,
              action: 'ISSUED',
              reason: `Automated receipt issued for ${payload.itemName} gift purchase (${paymentDetails.paymentId})`,
              timestamp: nowIso,
            },
          ],
          createdAt: nowIso,
        };

        const txRecord: TransactionRecord = {
          id: txId,
          userId: profile.uid,
          userEmail: profile.email,
          type: 'apex_gift_purchase',
          itemId: payload.itemId,
          itemName: `${payload.itemName} (Gift)`,
          amountINR: payload.amountINR,
          currency: 'INR',
          billingCycle: giftBillingCycle,
          status: 'captured',
          razorpayOrderId: paymentDetails.orderId,
          razorpayPaymentId: paymentDetails.paymentId,
          razorpaySignature: paymentDetails.signature,
          isGiftPurchase: true,
          giftId,
          receiptId,
          createdAt: nowIso,
        };

        await setDoc(doc(db, 'gifts', giftId), cleanFirestoreData(giftRecord));
        await setDoc(doc(db, 'receipts', receiptId), cleanFirestoreData(giftReceipt));
        await setDoc(doc(db, 'transactions', txId), cleanFirestoreData(txRecord));

        await recordAuditLog(
          'APEX_GIFT_PURCHASE_CAPTURED',
          `Verified Razorpay gift purchase ${paymentDetails.paymentId} for ${payload.itemName} (₹${payload.amountINR} INR) -> Gift ${giftId}`,
          profile.uid,
          profile.email
        );

        const claimUrl = `${window.location.origin}/?gift=${encodeURIComponent(
          claimToken
        )}`;
        const canonicalGiftUrl = `https://doomcord.com/gift/${claimToken}`;
        return {
          gift: giftRecord,
          claimUrl,
          canonicalGiftUrl,
          receipt: giftReceipt,
        };
      }

      // CASE B: Standard Personal Purchase (APEX / APEX+ or Cosmetic)
      const txRecord: TransactionRecord = {
        id: txId,
        userId: profile.uid,
        userEmail: profile.email,
        type: payload.type,
        itemId: payload.itemId,
        itemName: payload.itemName,
        amountINR: payload.amountINR,
        currency: 'INR',
        billingCycle: payload.billingCycle || 'none',
        status: 'captured',
        razorpayOrderId: paymentDetails.orderId,
        razorpayPaymentId: paymentDetails.paymentId,
        razorpaySignature: paymentDetails.signature,
        receiptId,
        createdAt: nowIso,
      };

      await setDoc(doc(db, 'transactions', txId), txRecord);

      if (payload.type === 'nitro_subscription' && payload.tier) {
        const cycle = payload.billingCycle === 'yearly' ? 'yearly' : 'monthly';
        const durationCode: GiftDuration = cycle === 'yearly' ? '1y' : '1m';
        const renewIso = computeDurationExpiry(durationCode, now, cycle);
        const durationLabel = formatDurationLabel(durationCode, cycle);

        const badgeToGrant = payload.tier === 'nitro' ? 'apex_plus' : 'apex';
        const updatedBadges = Array.from(
          new Set([...(profile.badges || ['verified']), badgeToGrant])
        );

        await updateProfile({
          nitroTier: payload.tier,
          nitroBillingCycle: cycle,
          nitroAutoRenew: true,
          nitroExpiresAt: renewIso,
          badges: updatedBadges,
        });

        const membershipReceipt: ReceiptRecord = {
          id: receiptId,
          receiptNumber,
          accessToken,
          receiptType:
            payload.tier === 'nitro'
              ? 'APEX+ Membership Receipt'
              : 'APEX Membership Receipt',
          title:
            payload.tier === 'nitro'
              ? 'APEX+ Membership Receipt'
              : 'APEX Membership Receipt',
          description: `${payload.itemName} personal membership activation (${durationLabel})`,
          customerUid: profile.uid,
          customerUsername: profile.username,
          customerDisplayName: profile.displayName,
          customerEmail: profile.email,
          items: [
            {
              id: `item_${Date.now()}`,
              productName: payload.itemName,
              category: 'APEX Membership',
              quantity: 1,
              unitPriceINR: payload.amountINR,
              discountINR: 0,
              finalAmountINR: payload.amountINR,
              durationPreset: cycle === 'yearly' ? '1y' : '30d',
              durationLabel,
              serviceStartDate: nowIso,
              serviceExpiryDate: renewIso,
            },
          ],
          subtotalINR: payload.amountINR,
          discountTotalINR: 0,
          taxINR: 0,
          totalAmountINR: payload.amountINR,
          currency: 'INR',
          paymentMethod: 'Razorpay Verified Checkout',
          paymentStatus: 'Paid',
          transactionId: paymentDetails.paymentId,
          issueDate: nowIso,
          serviceStartDate: nowIso,
          serviceExpiryDate: renewIso,
          serviceDurationLabel: durationLabel,
          notes: `Activated ${formatApexTierName(payload.tier)} (${cycle}) on @${profile.username}.`,
          purchaseNature: 'self_purchase',
          issuerUid: profile.uid,
          issuerName: 'Doomcord Automated Billing',
          issuerEmail: profile.email,
          issuerRole: profile.role,
          auditHistory: [
            {
              id: `rev_${Date.now()}`,
              receiptId,
              actorUid: profile.uid,
              actorEmail: profile.email,
              action: 'ISSUED',
              reason: `Automated receipt issued for ${payload.itemName} (${paymentDetails.paymentId})`,
              timestamp: nowIso,
            },
          ],
          createdAt: nowIso,
        };

        await setDoc(doc(db, 'receipts', receiptId), cleanFirestoreData(membershipReceipt));

        await recordAuditLog(
          'APEX_SUBSCRIPTION_CAPTURED',
          `Verified Razorpay payment ${paymentDetails.paymentId} for ${payload.itemName} (₹${payload.amountINR} INR)`,
          profile.uid,
          profile.email
        );

        return { receipt: membershipReceipt };
      } else if (payload.type === 'cosmetic_purchase') {
        const nextOwned = Array.from(
          new Set([...(profile.ownedCosmetics || []), payload.itemId])
        );
        await updateProfile({ ownedCosmetics: nextOwned });

        const cosmeticReceipt: ReceiptRecord = {
          id: receiptId,
          receiptNumber,
          accessToken,
          receiptType: 'Cosmetic Purchase Receipt',
          title: 'Cosmetic Purchase Receipt',
          description: `Permanent unlock of ${payload.itemName} from the APEX Collection`,
          customerUid: profile.uid,
          customerUsername: profile.username,
          customerDisplayName: profile.displayName,
          customerEmail: profile.email,
          items: [
            {
              id: `item_${Date.now()}`,
              productName: payload.itemName,
              category: 'APEX Collection Cosmetic',
              quantity: 1,
              unitPriceINR: payload.amountINR,
              discountINR: 0,
              finalAmountINR: payload.amountINR,
              durationPreset: 'lifetime',
              durationLabel: 'LIFETIME — NO EXPIRATION',
              serviceStartDate: nowIso,
              serviceExpiryDate: null,
            },
          ],
          subtotalINR: payload.amountINR,
          discountTotalINR: 0,
          taxINR: 0,
          totalAmountINR: payload.amountINR,
          currency: 'INR',
          paymentMethod: 'Razorpay Verified Checkout',
          paymentStatus: 'Paid',
          transactionId: paymentDetails.paymentId,
          issueDate: nowIso,
          serviceStartDate: nowIso,
          serviceExpiryDate: null,
          serviceDurationLabel: 'LIFETIME — NO EXPIRATION',
          notes: `Permanent cosmetic entitlement added to @${profile.username}.`,
          purchaseNature: 'self_purchase',
          issuerUid: profile.uid,
          issuerName: 'Doomcord Automated Billing',
          issuerEmail: profile.email,
          issuerRole: profile.role,
          auditHistory: [
            {
              id: `rev_${Date.now()}`,
              receiptId,
              actorUid: profile.uid,
              actorEmail: profile.email,
              action: 'ISSUED',
              reason: `Automated receipt issued for cosmetic ${payload.itemName} (${paymentDetails.paymentId})`,
              timestamp: nowIso,
            },
          ],
          createdAt: nowIso,
        };

        await setDoc(doc(db, 'receipts', receiptId), cleanFirestoreData(cosmeticReceipt));

        await recordAuditLog(
          'COSMETIC_PURCHASE_CAPTURED',
          `Verified Razorpay payment ${paymentDetails.paymentId} for ${payload.itemName} (₹${payload.amountINR} INR)`,
          profile.uid,
          profile.email
        );

        return { receipt: cosmeticReceipt };
      }
    },
    [profile, updateProfile, recordAuditLog]
  );

  // Atomic single-use gift redemption handler (#29, #37)
  const handleRedeemGift = useCallback(
    async (gift: GiftRecord, _rawToken: string) => {
      if (!profile) {
        throw new Error('Please sign in first to redeem this gift.');
      }

      const now = new Date();
      const nowIso = now.toISOString();
      const giftRef = doc(db, 'gifts', gift.id);

      await runTransaction(db, async (transaction) => {
        const freshGiftSnap = await transaction.get(giftRef);
        if (!freshGiftSnap.exists()) {
          throw new Error('Gift record does not exist.');
        }
        const liveGift = freshGiftSnap.data() as GiftRecord;

        if (liveGift.status === 'redeemed') {
          throw new Error('This single-use gift link has already been redeemed.');
        }
        if (liveGift.status === 'revoked') {
          throw new Error('This gift link was revoked and can no longer be claimed.');
        }

        if (
          liveGift.restrictedRecipientEmail &&
          liveGift.restrictedRecipientEmail.toLowerCase() !==
            profile.email.toLowerCase()
        ) {
          throw new Error(
            `This gift is restricted to ${liveGift.restrictedRecipientEmail}.`
          );
        }

        if (
          liveGift.restrictedRecipientUsername &&
          liveGift.restrictedRecipientUsername.toLowerCase() !==
            profile.username.toLowerCase()
        ) {
          throw new Error(
            `This gift is restricted to @${liveGift.restrictedRecipientUsername}.`
          );
        }

        transaction.update(giftRef, {
          status: 'redeemed',
          redeemedByUid: profile.uid,
          redeemedByEmail: profile.email,
          redeemedByUsername: profile.username,
          redeemedAt: nowIso,
        });
      });

      const expiryIso = computeDurationExpiry(
        gift.duration,
        now,
        gift.billingCycle
      );

      const userUpdates: Partial<UserProfile> = {};

      if (gift.apexTier && gift.apexTier !== 'none' && !isRootOwner(profile)) {
        const resolvedCycle =
          gift.duration === 'lifetime' || gift.billingCycle === 'lifetime'
            ? 'lifetime'
            : gift.billingCycle === 'yearly' || gift.duration === '1y'
            ? 'yearly'
            : 'monthly';

        userUpdates.nitroTier = gift.apexTier;
        userUpdates.nitroBillingCycle = resolvedCycle;
        userUpdates.nitroExpiresAt = expiryIso;
        userUpdates.nitroAutoRenew = false;

        if (resolvedCycle === 'lifetime') {
          userUpdates.permanentEntitlement =
            gift.apexTier === 'nitro' ? 'LIFETIME_APEX_PLUS' : 'LIFETIME_APEX';
        }

        const badgeToGrant = gift.apexTier === 'nitro' ? 'apex_plus' : 'apex';
        userUpdates.badges = Array.from(
          new Set([...(profile.badges || ['verified']), badgeToGrant])
        );
      }

      if (gift.cosmeticIds && gift.cosmeticIds.length > 0) {
        userUpdates.ownedCosmetics = Array.from(
          new Set([...(profile.ownedCosmetics || []), ...gift.cosmeticIds])
        );
      }

      if (Object.keys(userUpdates).length > 0) {
        await updateProfile(userUpdates);
      }

      // Record immutable GiftRedemptionRecord
      const redId = `red_${Date.now()}`;
      const redRecord: GiftRedemptionRecord = {
        id: redId,
        giftId: gift.id,
        recipientUid: profile.uid,
        recipientEmail: profile.email,
        apexTierGranted: gift.apexTier,
        cosmeticsGranted: gift.cosmeticIds || [],
        duration: gift.duration,
        entitlementExpiresAt: expiryIso,
        redeemedAt: nowIso,
      };
      await setDoc(doc(db, 'gift_redemptions', redId), cleanFirestoreData(redRecord));

      // Update linked purchaser receipt's giftRedemptionStatus if present
      if (gift.receiptId) {
        try {
          await updateDoc(doc(db, 'receipts', gift.receiptId), {
            giftRedemptionStatus: 'redeemed',
            updatedAt: nowIso,
          });
        } catch {
          // ignore
        }
      }

      await recordAuditLog(
        'REDEEM_APEX_GIFT',
        `User @${profile.username} redeemed gift ${gift.id} (${formatApexTierName(
          gift.apexTier
        )}, ${formatDurationLabel(gift.duration, gift.billingCycle)})`,
        profile.uid,
        profile.email
      );
    },
    [profile, updateProfile, recordAuditLog]
  );

  // Accept Secondary Owner Invitation (#35)
  const handleAcceptOwnerInvite = useCallback(
    async (
      invite: OwnerInvitationRecord,
      username: string,
      displayName: string,
      password: string
    ) => {
      await acceptOwnerInviteOnboard(
        invite.id,
        invite.email,
        username,
        displayName,
        password
      );
      setActiveView({ type: 'home' });
    },
    [acceptOwnerInviteOnboard]
  );

  // APEX membership self-management handlers
  const handleCancelAutoRenew = useCallback(async () => {
    if (!profile) return;
    await updateProfile({ nitroAutoRenew: false });
    await recordAuditLog(
      'APEX_AUTO_RENEW_CANCELLED',
      'User disabled automatic renewal for DOOMCORD APEX membership.',
      profile.uid,
      profile.email
    );
  }, [profile, updateProfile, recordAuditLog]);

  const handleReactivateAutoRenew = useCallback(async () => {
    if (!profile) return;
    await updateProfile({ nitroAutoRenew: true });
    await recordAuditLog(
      'APEX_AUTO_RENEW_REACTIVATED',
      'User re-enabled automatic renewal for DOOMCORD APEX membership.',
      profile.uid,
      profile.email
    );
  }, [profile, updateProfile, recordAuditLog]);

  const handleDowngradeToFree = useCallback(async () => {
    if (!profile || isRootOwner(profile)) return;
    await updateProfile({
      nitroTier: 'free',
      nitroBillingCycle: 'none',
      nitroAutoRenew: false,
    });
    await recordAuditLog(
      'APEX_DOWNGRADED_TO_FREE',
      'User switched membership tier to Doomcord Free (₹0).',
      profile.uid,
      profile.email
    );
  }, [profile, updateProfile, recordAuditLog]);

  // Admin & Monetization Dashboard handlers
  const handleUpdateNitroPlan = useCallback(
    async (plan: NitroPlanConfig) => {
      await setDoc(doc(db, 'nitro_plans', plan.id), plan, { merge: true });
      await recordAuditLog(
        'UPDATE_APEX_PLAN',
        `Updated ${plan.name} pricing: ₹${plan.monthlyPriceINR}/mo, ₹${plan.yearlyPriceINR}/yr`
      );
    },
    [recordAuditLog]
  );

  const handleSaveCosmetic = useCallback(
    async (item: CosmeticItem) => {
      await setDoc(doc(db, 'cosmetics', item.id), item, { merge: true });
      await recordAuditLog(
        'SAVE_COSMETIC_ITEM',
        `Saved cosmetic "${item.name}" (${item.category}) at ₹${item.priceINR} INR`
      );
    },
    [recordAuditLog]
  );

  const handleDeleteCommunity = useCallback(
    async (communityId: string) => {
      await deleteDoc(doc(db, 'communities', communityId));
      await recordAuditLog('DELETE_COMMUNITY', `Deleted community ${communityId}`);
    },
    [recordAuditLog]
  );

  const handleDeleteOrb = useCallback(
    async (orbId: string) => {
      await deleteDoc(doc(db, 'orbs', orbId));
      await recordAuditLog('DELETE_ORB', `Deleted Orb ${orbId}`);
    },
    [recordAuditLog]
  );

  const handleUpdateUserRole = useCallback(
    async (targetUid: string, newRole: PlatformRole) => {
      if (isRootOwner(targetUid)) {
        throw new Error('The Main Root Owner role cannot be modified.');
      }
      if (token) {
        try {
          await fetch('/api/admin/user-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ targetUid, newRole }),
          });
        } catch {
          // continue with Firestore update
        }
      }
      await updateDoc(doc(db, 'users', targetUid), { role: newRole });
      const targetUser = allUsers.find((u) => u.uid === targetUid);
      await recordAuditLog(
        'UPDATE_USER_ROLE',
        `Assigned role "${newRole}" to ${targetUser?.email || targetUid}`,
        targetUid,
        targetUser?.email
      );
    },
    [token, allUsers, recordAuditLog]
  );

  const handleUpdateSecondaryOwnerPermissions = useCallback(
    async (
      targetUid: string,
      perms: NonNullable<UserProfile['secondaryOwnerPermissions']>
    ) => {
      await updateDoc(doc(db, 'users', targetUid), {
        secondaryOwnerPermissions: perms,
      });
      const targetUser = allUsers.find((u) => u.uid === targetUid);
      await recordAuditLog(
        'UPDATE_SECONDARY_OWNER_PERMISSIONS',
        `Updated granular permissions for Secondary Owner ${targetUser?.email || targetUid}`,
        targetUid,
        targetUser?.email
      );
    },
    [allUsers, recordAuditLog]
  );

  const handleModerateUser = useCallback(
    async (
      targetUid: string,
      action: 'ban' | 'unban' | 'suspend' | 'unsuspend'
    ) => {
      if (isRootOwner(targetUid)) {
        throw new Error('The Main Root Owner account is permanently protected.');
      }
      if (token) {
        try {
          await fetch('/api/admin/user-moderation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ targetUid, action }),
          });
        } catch {
          // continue with Firestore update
        }
      }
      const updates: Partial<UserProfile> = {};
      if (action === 'ban') updates.isBanned = true;
      if (action === 'unban') updates.isBanned = false;
      if (action === 'suspend') updates.isSuspended = true;
      if (action === 'unsuspend') updates.isSuspended = false;

      await updateDoc(doc(db, 'users', targetUid), updates);
      const targetUser = allUsers.find((u) => u.uid === targetUid);
      await recordAuditLog(
        `USER_MODERATION_${action.toUpperCase()}`,
        `Executed "${action}" on account ${targetUser?.email || targetUid}`,
        targetUid,
        targetUser?.email
      );
    },
    [token, allUsers, recordAuditLog]
  );

  const handleGrantOrRevokeNitro = useCallback(
    async (targetUid: string, tier: 'free' | 'basic' | 'nitro') => {
      if (isRootOwner(targetUid)) return;
      const targetUser = allUsers.find((u) => u.uid === targetUid);
      const now = new Date();
      const expiresAt =
        tier === 'free' ? null : computeDurationExpiry('1m', now, 'monthly');

      await updateDoc(doc(db, 'users', targetUid), {
        nitroTier: tier,
        nitroBillingCycle: tier === 'free' ? 'none' : 'monthly',
        nitroAutoRenew: false,
        nitroExpiresAt: expiresAt,
      });

      if (tier !== 'free') {
        const txId = `tx_grant_${Date.now()}`;
        const grantTx: TransactionRecord = {
          id: txId,
          userId: targetUid,
          userEmail: targetUser?.email || '',
          type: 'admin_grant',
          itemId: tier,
          itemName:
            tier === 'nitro'
              ? 'DOOMCORD APEX+ (Promotional Admin Grant)'
              : 'DOOMCORD APEX (Promotional Admin Grant)',
          amountINR: 0,
          currency: 'INR',
          billingCycle: 'monthly',
          status: 'verified',
          createdAt: now.toISOString(),
        };
        await setDoc(doc(db, 'transactions', txId), grantTx);
      }

      await recordAuditLog(
        tier === 'free' ? 'REVOKE_APEX_ENTITLEMENT' : 'GRANT_APEX_ENTITLEMENT',
        `Set DOOMCORD APEX tier to "${formatApexTierName(tier)}" for ${
          targetUser?.email || targetUid
        }`,
        targetUid,
        targetUser?.email
      );
    },
    [allUsers, recordAuditLog]
  );

  const handleGrantOrRevokeCosmetic = useCallback(
    async (
      targetUid: string,
      cosmeticId: string,
      mode: 'grant' | 'revoke'
    ) => {
      const targetUser = allUsers.find((u) => u.uid === targetUid);
      if (!targetUser) return;
      const item = cosmetics.find((c) => c.id === cosmeticId);

      const currentOwned = targetUser.ownedCosmetics || [];
      const nextOwned =
        mode === 'grant'
          ? Array.from(new Set([...currentOwned, cosmeticId]))
          : currentOwned.filter((id) => id !== cosmeticId);

      await updateDoc(doc(db, 'users', targetUid), {
        ownedCosmetics: nextOwned,
      });

      await recordAuditLog(
        mode === 'grant' ? 'GRANT_COSMETIC_ITEM' : 'REVOKE_COSMETIC_ITEM',
        `${mode === 'grant' ? 'Granted' : 'Revoked'} cosmetic "${item?.name || cosmeticId}" for ${targetUser.email}`,
        targetUid,
        targetUser.email
      );
    },
    [allUsers, cosmetics, recordAuditLog]
  );

  // Create Complimentary Owner Gift Link (#28)
  const handleCreateOwnerGift = useCallback(
    async (params: {
      apexTier: 'none' | 'basic' | 'nitro';
      cosmeticIds: string[];
      duration: GiftDuration;
      personalMessage: string;
      restrictedRecipientUsername?: string;
      restrictedRecipientEmail?: string;
    }): Promise<GiftRecord> => {
      if (!profile) throw new Error('Not authenticated');
      const now = new Date();
      const nowIso = now.toISOString();
      const claimToken = generateSecureTokenString('APEX');
      const tokenHash = await sha256HexBrowser(claimToken);
      const giftId = `gift_${Date.now()}`;
      const receiptId = `rcp_${Date.now()}`;
      const receiptNumber = `DC-RCP-${now.getFullYear()}-${String(
        Math.floor(100000 + Math.random() * 900000)
      )}`;
      const accessToken = generateSecureTokenString('RCP');

      const billingCycle =
        params.duration === 'lifetime'
          ? 'lifetime'
          : params.duration === '1y'
          ? 'yearly'
          : 'monthly';
      const expiryIso = computeDurationExpiry(params.duration, now, billingCycle);
      const durationLabel = formatDurationLabel(params.duration, billingCycle);

      const cleanUsername = params.restrictedRecipientUsername?.trim()?.replace(/^@/, '') || undefined;
      const cleanEmail = params.restrictedRecipientEmail?.trim()?.toLowerCase() || undefined;

      const newGiftData: any = {
        id: giftId,
        claimToken,
        tokenHash,
        tokenPreview: `${claimToken.slice(0, 9)}...`,
        creatorUid: profile.uid,
        creatorName: profile.displayName,
        apexTier: params.apexTier,
        cosmeticIds: params.cosmeticIds,
        duration: params.duration,
        billingCycle,
        personalMessage: params.personalMessage,
        isPaidGift: false,
        amountPaidINR: 0,
        receiptId,
        status: 'unclaimed',
        createdAt: nowIso,
      };

      if (cleanUsername) {
        newGiftData.restrictedRecipientUsername = cleanUsername;
      }
      if (cleanEmail) {
        newGiftData.restrictedRecipientEmail = cleanEmail;
      }

      const newGift: GiftRecord = cleanFirestoreData(newGiftData);

      const recipientInfo = cleanUsername
        ? `@${cleanUsername}`
        : cleanEmail || 'Unrestricted single-use link';

      const complimentaryReceipt: ReceiptRecord = cleanFirestoreData({
        id: receiptId,
        receiptNumber,
        accessToken,
        receiptType: 'Complimentary Gift Receipt',
        title: 'Complimentary Owner Grant Receipt',
        description: `Complimentary DOOMCORD ${formatApexTierName(
          params.apexTier
        )} & Cosmetics Gift Link (${durationLabel})`,
        customerUid: profile.uid,
        customerUsername: profile.username,
        customerDisplayName: profile.displayName,
        customerEmail: profile.email,
        items: [
          {
            id: `item_${Date.now()}`,
            productName:
              params.apexTier !== 'none'
                ? `DOOMCORD ${formatApexTierName(params.apexTier)} Gift (${durationLabel})`
                : `APEX Collection Cosmetics Gift (${params.cosmeticIds.length} items)`,
            category: 'Complimentary Owner Gift',
            quantity: 1,
            unitPriceINR: 0,
            discountINR: 0,
            finalAmountINR: 0,
            durationPreset: params.duration === 'lifetime' ? 'lifetime' : '30d',
            durationLabel,
            serviceStartDate: nowIso,
            serviceExpiryDate: expiryIso,
          },
        ],
        subtotalINR: 0,
        discountTotalINR: 0,
        taxINR: 0,
        totalAmountINR: 0,
        currency: 'INR',
        paymentMethod: 'Owner Sovereign Grant (₹0)',
        paymentStatus: 'Complimentary',
        transactionId: `OWN-GIFT-${giftId}`,
        issueDate: nowIso,
        serviceStartDate: nowIso,
        serviceExpiryDate: expiryIso,
        serviceDurationLabel: durationLabel,
        notes: params.personalMessage || 'Complimentary Owner Gift Link',
        purchaseNature: 'complimentary_owner_gift',
        giftRecipientInfo: recipientInfo,
        linkedGiftId: giftId,
        giftRedemptionStatus: 'unclaimed',
        issuerUid: profile.uid,
        issuerName: profile.displayName,
        issuerEmail: profile.email,
        issuerRole: profile.role,
        auditHistory: [
          {
            id: `rev_${Date.now()}`,
            receiptId,
            actorUid: profile.uid,
            actorEmail: profile.email,
            action: 'ISSUED',
            reason: 'Complimentary Owner Gift issued at ₹0 INR',
            timestamp: nowIso,
          },
        ],
        createdAt: nowIso,
      });

      await setDoc(doc(db, 'gifts', giftId), cleanFirestoreData(newGift));
      await setDoc(doc(db, 'receipts', receiptId), cleanFirestoreData(complimentaryReceipt));

      await recordAuditLog(
        'CREATE_OWNER_GIFT',
        `Created complimentary gift ${giftId} (${formatApexTierName(
          params.apexTier
        )}, ${durationLabel}, ${params.cosmeticIds.length} cosmetics)`
      );

      return newGift;
    },
    [profile, recordAuditLog]
  );

  const handleRevokeGift = useCallback(
    async (giftId: string) => {
      await updateDoc(doc(db, 'gifts', giftId), { status: 'revoked' });
      await recordAuditLog('REVOKE_GIFT_LINK', `Revoked unclaimed gift ${giftId}`);
    },
    [recordAuditLog]
  );

  const handleCreateOwnerInvite = useCallback(
    async (
      email: string,
      invitedDisplayName?: string
    ): Promise<OwnerInvitationRecord> => {
      if (!profile || !isRootOwner(profile)) {
        throw new Error('Only the Main Root Owner can invite Secondary Owners.');
      }
      const now = new Date();
      const inviteToken = generateSecureTokenString('OWN');
      const tokenHash = await sha256HexBrowser(inviteToken);
      const inviteId = `inv_${Date.now()}`;

      const record: OwnerInvitationRecord = {
        id: inviteId,
        email: email.trim().toLowerCase(),
        invitedDisplayName: invitedDisplayName?.trim() || 'Secondary Owner',
        inviteToken,
        tokenHash,
        tokenPreview: `${inviteToken.slice(0, 9)}...`,
        createdByUid: profile.uid,
        createdByEmail: profile.email,
        status: 'pending',
        createdAt: now.toISOString(),
      };

      await setDoc(doc(db, 'owner_invitations', inviteId), cleanFirestoreData(record));
      await recordAuditLog(
        'CREATE_SECONDARY_OWNER_INVITE',
        `Created Secondary Owner invitation for ${record.email}`,
        undefined,
        record.email
      );
      return record;
    },
    [profile, recordAuditLog]
  );

  const handleRevokeOwnerInvite = useCallback(
    async (inviteId: string) => {
      await updateDoc(doc(db, 'owner_invitations', inviteId), {
        status: 'revoked',
      });
      await recordAuditLog(
        'REVOKE_SECONDARY_OWNER_INVITE',
        `Revoked Secondary Owner invitation ${inviteId}`
      );
    },
    [recordAuditLog]
  );

  const handleCreateManualReceipt = useCallback(
    async (
      receiptData: Omit<
        ReceiptRecord,
        'id' | 'receiptNumber' | 'accessToken' | 'auditHistory' | 'createdAt'
      >
    ): Promise<ReceiptRecord> => {
      if (!profile) throw new Error('Not authenticated');
      const nowIso = new Date().toISOString();
      const id = `rcp_${Date.now()}`;
      const receiptNumber = `DC-RCP-${new Date().getFullYear()}-${String(
        Math.floor(100000 + Math.random() * 900000)
      )}`;
      const accessToken = generateSecureTokenString('RCP');

      const newReceipt: ReceiptRecord = {
        ...receiptData,
        id,
        receiptNumber,
        accessToken,
        auditHistory: [
          {
            id: `rev_${Date.now()}`,
            receiptId: id,
            actorUid: profile.uid,
            actorEmail: profile.email,
            action: 'ISSUED',
            reason: 'Manual official receipt generated via Admin Finance Module',
            timestamp: nowIso,
          },
        ],
        createdAt: nowIso,
      };

      await setDoc(doc(db, 'receipts', id), cleanFirestoreData(newReceipt));
      await recordAuditLog(
        'CREATE_OFFICIAL_RECEIPT',
        `Issued receipt ${receiptNumber} (${newReceipt.receiptType}) for ${newReceipt.customerEmail}`,
        newReceipt.customerUid,
        newReceipt.customerEmail
      );
      return newReceipt;
    },
    [profile, recordAuditLog]
  );

  const handleCorrectReceiptMetadata = useCallback(
    async (receiptId: string, newNotes: string, reason: string) => {
      if (!profile) return;
      const existing = receipts.find((r) => r.id === receiptId);
      if (!existing) return;
      const nowIso = new Date().toISOString();
      const updatedHistory = [
        ...(existing.auditHistory || []),
        {
          id: `rev_${Date.now()}`,
          receiptId,
          actorUid: profile.uid,
          actorEmail: profile.email,
          action: 'METADATA_CORRECTED' as const,
          reason,
          timestamp: nowIso,
        },
      ];
      await updateDoc(doc(db, 'receipts', receiptId), {
        notes: newNotes,
        auditHistory: updatedHistory,
        updatedAt: nowIso,
      });
      await recordAuditLog(
        'CORRECT_RECEIPT_METADATA',
        `Updated metadata on receipt ${existing.receiptNumber}: ${reason}`
      );
    },
    [profile, receipts, recordAuditLog]
  );

  const handleModalCorrectReceipt = useCallback(
    async (
      receipt: ReceiptRecord,
      updatedTitle: string,
      updatedDescription: string,
      updatedNotes: string,
      correctionReason: string
    ) => {
      if (!profile) return;
      const nowIso = new Date().toISOString();
      const updatedHistory = [
        ...(receipt.auditHistory || []),
        {
          id: `rev_${Date.now()}`,
          receiptId: receipt.id,
          actorUid: profile.uid,
          actorEmail: profile.email,
          action: 'METADATA_CORRECTED' as const,
          reason: correctionReason,
          timestamp: nowIso,
        },
      ];
      const updatedReceipt: ReceiptRecord = {
        ...receipt,
        title: updatedTitle,
        description: updatedDescription,
        notes: updatedNotes,
        auditHistory: updatedHistory,
        updatedAt: nowIso,
      };
      await updateDoc(doc(db, 'receipts', receipt.id), {
        title: updatedTitle,
        description: updatedDescription,
        notes: updatedNotes,
        auditHistory: updatedHistory,
        updatedAt: nowIso,
      });
      setActiveReceiptModal(updatedReceipt);
      await recordAuditLog(
        'CORRECT_RECEIPT_METADATA',
        `Corrected receipt ${receipt.receiptNumber}: ${correctionReason}`
      );
    },
    [profile, recordAuditLog]
  );

  const handleRefundTransaction = useCallback(
    async (tx: TransactionRecord) => {
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'refunded',
      });

      const targetUser = allUsers.find((u) => u.uid === tx.userId);
      if (targetUser && !isRootOwner(targetUser)) {
        if (tx.type === 'nitro_subscription') {
          await updateDoc(doc(db, 'users', tx.userId), {
            nitroTier: 'free',
            nitroBillingCycle: 'none',
            nitroAutoRenew: false,
          });
        } else if (tx.type === 'cosmetic_purchase') {
          const nextOwned = (targetUser.ownedCosmetics || []).filter(
            (id) => id !== tx.itemId
          );
          await updateDoc(doc(db, 'users', tx.userId), {
            ownedCosmetics: nextOwned,
          });
        }
      }

      if (tx.receiptId) {
        try {
          await updateDoc(doc(db, 'receipts', tx.receiptId), {
            paymentStatus: 'Refunded',
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }

      await recordAuditLog(
        'REFUND_TRANSACTION',
        `Refunded transaction ${tx.id} (₹${tx.amountINR} INR) and revoked "${tx.itemName}"`,
        tx.userId,
        tx.userEmail
      );
    },
    [allUsers, recordAuditLog]
  );

  const handleUpdateSystemConfig = useCallback(
    async (cfg: Partial<SystemConfigData>) => {
      const merged: SystemConfigData = {
        ...systemConfig,
        ...cfg,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'system_config', 'global'), merged, { merge: true });
      await recordAuditLog(
        'UPDATE_SYSTEM_CONFIG',
        `Updated platform configuration (Global discount: ${merged.globalDiscountPercent}%, Announcement: "${merged.globalAnnouncement || 'None'}")`
      );
    },
    [systemConfig, recordAuditLog]
  );

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#09090D] text-[#F5F3FA]">
        <img
          src="/assets/aistudio/doomcord-icon_378efdf9.png"
          alt="Doomcord"
          className="w-14 h-14 object-contain mb-4 animate-pulse"
        />
        <h2 className="text-sm font-bold tracking-tight text-[#F5F3FA]">
          Initializing Doomcord Workspace...
        </h2>
        <span className="text-xs text-[#A19DAD] mt-1">
          Synchronizing real-time channels & APEX entitlements
        </span>
      </div>
    );
  }

  if (!profile) {
    return <AuthView />;
  }

  // Derive current conversation / channel details
  const activeCommunity =
    activeView.type === 'community'
      ? communities.find((c) => c.id === activeView.communityId) || null
      : null;

  const activeChannel =
    activeView.type === 'community'
      ? activeCommunity?.channels?.find((c) => c.id === activeView.channelId)
      : undefined;

  const activeDm =
    activeView.type === 'dm'
      ? directMessages.find((d) => d.id === activeView.dmId) || null
      : null;

  const userTransactions = transactions.filter((t) => t.userId === profile.uid);

  const hideContextSidebar =
    activeView.type === 'orbs' ||
    activeView.type === 'explore_communities' ||
    activeView.type === 'nitro' ||
    activeView.type === 'shop' ||
    activeView.type === 'admin' ||
    activeView.type === 'gift_redeem' ||
    activeView.type === 'owner_invite_accept';

  const canShowContextualPanel =
    activeView.type === 'dm' ||
    activeView.type === 'community' ||
    (activeView.type === 'orbs' && !!selectedOrb);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090D] text-[#F5F3FA]">
      {/* 1. Primary Left Navigation Rail (60px) */}
      <LeftNavRail
        communities={communities}
        activeView={activeView}
        currentUser={profile}
        unreadDmCount={unreadDmCount}
        notificationCount={unreadNotificationCount}
        onNavigateDashboard={() => setActiveView({ type: 'home' })}
        onNavigateHome={() => setActiveView({ type: 'friends', subTab: 'online' })}
        onNavigateNotifications={() => setActiveView({ type: 'notifications' })}
        onNavigateOrbs={() => setActiveView({ type: 'orbs', viewMode: 'explore' })}
        onNavigateNitro={() => setActiveView({ type: 'nitro' })}
        onNavigateShop={() => setActiveView({ type: 'shop' })}
        onNavigateAdmin={() => setActiveView({ type: 'admin' })}
        onNavigateExplore={() => setActiveView({ type: 'explore_communities' })}
        onNavigateProfile={() => setActiveView({ type: 'profile', userId: profile.uid })}
        onSelectCommunity={(commId) => {
          const comm = communities.find((c) => c.id === commId);
          const firstCh = comm?.channels?.[0];
          if (firstCh) {
            handleSelectChannel(commId, firstCh.id);
          }
        }}
        onCreateCommunity={() => setIsCreateCommunityOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Contextual Channel or DM Sidebar (240px) */}
      {!hideContextSidebar && (
        <ContextSidebar
          activeView={activeView}
          communities={communities}
          directMessages={directMessages}
          orbs={orbs}
          currentUser={profile}
          notificationCount={unreadNotificationCount}
          onNavigateDashboard={() => setActiveView({ type: 'home' })}
          onNavigateFriends={(subTab) =>
            setActiveView({ type: 'friends', subTab: subTab || 'online' })
          }
          onNavigateNotifications={() => setActiveView({ type: 'notifications' })}
          onNavigateProfile={() => setActiveView({ type: 'profile', userId: profile.uid })}
          onNavigateNitro={() => setActiveView({ type: 'nitro' })}
          onNavigateShop={() => setActiveView({ type: 'shop' })}
          onNavigateAdmin={() => setActiveView({ type: 'admin' })}
          onSelectDm={(dmId) => setActiveView({ type: 'dm', dmId })}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={(commId) => setCreateChannelCommunityId(commId)}
          onBoostCommunity={handleBoostCommunity}
          onOpenQuickSwitcher={() => setIsQuickSwitcherOpen(true)}
          onSelectOrbView={(view) => setActiveView(view)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onChangePresence={setPresence}
        />
      )}

      {/* 3. Central Main Workspace View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#09090D]">
        {/* Global Platform Announcement Banner */}
        {systemConfig.globalAnnouncement && (
          <div className="px-6 py-2 bg-[#17171F] border-b border-[#282631] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#F5F3FA]">
              <Megaphone className="w-3.5 h-3.5 text-[#8957F5] shrink-0" />
              <span className="font-semibold">{systemConfig.globalAnnouncement}</span>
            </div>
            <span className="text-[10px] font-mono text-[#A47BFF] uppercase tracking-wider">
              System Broadcast
            </span>
          </div>
        )}

        {activeView.type === 'home' ? (
          <HomeDashboardView
            profile={profile}
            allUsers={allUsers}
            dmThreads={directMessages}
            communities={communities}
            orbs={orbs}
            friendRequests={pendingRequests}
            gifts={gifts}
            receipts={receipts.filter((r) => r.customerUid === profile.uid)}
            onSelectView={(view) => setActiveView(view)}
            onStartDM={handleOpenDmWithUser}
            onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
            onOpenCreateOrb={() => setIsCreateOrbOpen(true)}
            onOpenReceipt={(rcp) => setActiveReceiptModal(rcp)}
          />
        ) : activeView.type === 'notifications' ? (
          <NotificationsView
            profile={profile}
            allUsers={allUsers}
            friendRequests={pendingRequests}
            dmThreads={directMessages}
            gifts={gifts}
            receipts={receipts.filter((r) => r.customerUid === profile.uid)}
            communities={communities}
            orbs={orbs}
            onAcceptFriendRequest={handleAcceptRequest}
            onRejectFriendRequest={handleRejectRequest}
            onSelectView={(view) => setActiveView(view)}
            onOpenReceipt={(rcp) => setActiveReceiptModal(rcp)}
          />
        ) : activeView.type === 'profile' ? (
          <UserProfileView
            currentUser={profile}
            targetUser={
              allUsers.find((u) => u.uid === activeView.userId) || profile
            }
            communities={communities}
            orbs={orbs}
            cosmeticsCatalog={cosmetics}
            onStartDM={handleOpenDmWithUser}
            onSendFriendRequest={async (username) => {
              const target = allUsers.find(
                (u) => u.username.toLowerCase() === username.toLowerCase()
              );
              if (target) await handleSendFriendRequest(target);
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSelectView={(view) => setActiveView(view)}
          />
        ) : activeView.type === 'friends' ? (
          <FriendsHub
            currentUser={profile}
            allUsers={allUsers}
            friends={friends}
            pendingRequests={pendingRequests}
            subTab={activeView.subTab}
            onSubTabChange={(tab) => setActiveView({ type: 'friends', subTab: tab })}
            onOpenDmWithUser={handleOpenDmWithUser}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onRemoveFriend={handleRemoveFriend}
            onBlockUser={handleBlockUser}
            onUnblockUser={handleUnblockUser}
          />
        ) : activeView.type === 'dm' ? (
          <ChatView
            title={
              activeDm?.recipientProfile?.displayName || 'Direct Message'
            }
            subtitle={
              activeDm?.recipientProfile?.statusMessage ||
              `@${activeDm?.recipientProfile?.username || 'user'}`
            }
            conversationId={activeView.dmId}
            currentUser={profile}
            recipientProfile={activeDm?.recipientProfile}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onToggleReaction={handleToggleReaction}
            onTogglePin={handleTogglePin}
            onVotePoll={handleVotePoll}
            onToggleBookmark={handleToggleBookmark}
            onMarkAsRead={handleMarkAsRead}
            showRightPanel={isRightPanelOpen}
            onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
          />
        ) : activeView.type === 'community' && activeChannel ? (
          activeChannel.type === 'voice' || activeChannel.type === 'stage' ? (
            <VoiceStageView
              channel={activeChannel}
              communityName={activeCommunity?.name || 'Community'}
              currentUser={profile}
              participants={voiceParticipants}
              onToggleMute={() => setVoiceIsMuted(!voiceIsMuted)}
              isMuted={voiceIsMuted}
              onLeave={() => setActiveVoice(null)}
            />
          ) : (
            <ChatView
              title={`# ${activeChannel.name}`}
              subtitle={
                activeChannel.topic ||
                `${activeCommunity?.name || 'Server'} · Text channel`
              }
              conversationId={activeChannel.id}
              currentUser={profile}
              messages={activeMessages}
              onSendMessage={handleSendMessage}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onToggleReaction={handleToggleReaction}
              onTogglePin={handleTogglePin}
              onVotePoll={handleVotePoll}
              onToggleBookmark={handleToggleBookmark}
              onMarkAsRead={handleMarkAsRead}
              showRightPanel={isRightPanelOpen}
              onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
            />
          )
        ) : activeView.type === 'orbs' ? (
          activeView.viewMode === 'detail' && selectedOrb ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="px-6 py-2.5 bg-[#101014] border-b border-[#282631] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#8957F5]" />
                  <span className="text-xs font-bold text-[#F5F3FA]">
                    {selectedOrb.name} · Spatial Orb Lounge
                  </span>
                  <span className="text-[11px] font-mono text-[#A19DAD]">
                    · {selectedOrb.category}
                  </span>
                </div>
                <button
                  onClick={() => setActiveView({ type: 'orbs', viewMode: 'explore' })}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#17171F] hover:bg-[#22212C] text-xs font-semibold text-[#F5F3FA] border border-[#282631]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Orbs Hub</span>
                </button>
              </div>
              <ChatView
                title={`${selectedOrb.name} Lounge`}
                subtitle={selectedOrb.description}
                conversationId={selectedOrb.id}
                currentUser={profile}
                messages={activeMessages}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onToggleReaction={handleToggleReaction}
                onTogglePin={handleTogglePin}
                onVotePoll={handleVotePoll}
                onToggleBookmark={handleToggleBookmark}
                onMarkAsRead={handleMarkAsRead}
                showRightPanel={isRightPanelOpen}
                onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
              />
            </div>
          ) : (
            <OrbsSpatialCanvas
              orbs={orbs}
              selectedOrb={selectedOrb}
              onSelectOrb={(orb) => setSelectedOrb(orb)}
              onEnterOrbRoom={(orb) => {
                setSelectedOrb(orb);
                setActiveView({
                  type: 'orbs',
                  orbId: orb.id,
                  viewMode: 'detail',
                });
              }}
              onCreateOrb={() => setIsCreateOrbOpen(true)}
            />
          )
        ) : activeView.type === 'explore_communities' ? (
          <ExploreCommunitiesView
            communities={communities}
            joinedCommunityIds={profile.joinedCommunities || []}
            onJoinCommunity={handleJoinCommunity}
            onCreateCommunity={() => setIsCreateCommunityOpen(true)}
            onLaunchTemplate={(tpl) =>
              handleCreateCommunity(
                {
                  name: tpl.name,
                  description: tpl.description,
                  themeColor: tpl.themeColor,
                  isPublic: true,
                },
                tpl
              )
            }
          />
        ) : activeView.type === 'nitro' ? (
          <NitroView
            currentUser={profile}
            plans={nitroPlans}
            userTransactions={userTransactions}
            userReceipts={receipts.filter((r) => r.customerUid === profile.uid)}
            allUsers={allUsers}
            onStartCheckout={(payload) => setCheckoutPayload(payload)}
            onCancelAutoRenew={handleCancelAutoRenew}
            onReactivateAutoRenew={handleReactivateAutoRenew}
            onDowngradeToFree={handleDowngradeToFree}
            onOpenShop={() => setActiveView({ type: 'shop' })}
            onOpenGiftVault={(tok) => setActiveView({ type: 'gift_redeem', token: tok })}
            onOpenOwnerGiftingAdmin={() => setActiveView({ type: 'admin' })}
            onSelectReceipt={(rcp) => setActiveReceiptModal(rcp)}
          />
        ) : activeView.type === 'shop' ? (
          <CosmeticsShopView
            currentUser={profile}
            cosmetics={cosmetics}
            globalDiscountPercent={systemConfig.globalDiscountPercent || 0}
            onStartCheckout={(payload) => setCheckoutPayload(payload)}
            onEquipCosmetic={handleEquipCosmetic}
            onOpenNitro={() => setActiveView({ type: 'nitro' })}
          />
        ) : activeView.type === 'gift_redeem' || activeView.type === 'owner_invite_accept' ? (
          <GiftRedemptionView
            initialToken={activeView.token || ''}
            mode={activeView.type === 'owner_invite_accept' ? 'owner_invite' : 'gift'}
            currentUser={profile}
            gifts={gifts}
            ownerInvitations={ownerInvitations}
            cosmetics={cosmetics}
            onRedeemGift={handleRedeemGift}
            onAcceptOwnerInvite={handleAcceptOwnerInvite}
            onBackToApp={() => setActiveView({ type: 'home' })}
          />
        ) : activeView.type === 'admin' ? (
          <AdminDashboardView
            currentUser={profile}
            authToken={token}
            users={allUsers}
            communities={communities}
            orbs={orbs}
            nitroPlans={nitroPlans}
            cosmetics={cosmetics}
            transactions={transactions}
            gifts={gifts}
            ownerInvitations={ownerInvitations}
            receipts={receipts}
            auditLogs={auditLogs}
            systemConfig={systemConfig}
            onUpdateNitroPlan={handleUpdateNitroPlan}
            onSaveCosmetic={handleSaveCosmetic}
            onDeleteCommunity={handleDeleteCommunity}
            onDeleteOrb={handleDeleteOrb}
            onUpdateUserRole={handleUpdateUserRole}
            onUpdateSecondaryOwnerPermissions={handleUpdateSecondaryOwnerPermissions}
            onModerateUser={handleModerateUser}
            onGrantOrRevokeNitro={handleGrantOrRevokeNitro}
            onGrantOrRevokeCosmetic={handleGrantOrRevokeCosmetic}
            onCreateOwnerGift={handleCreateOwnerGift}
            onRevokeGift={handleRevokeGift}
            onCreateOwnerInvite={handleCreateOwnerInvite}
            onRevokeOwnerInvite={handleRevokeOwnerInvite}
            onCreateManualReceipt={handleCreateManualReceipt}
            onCorrectReceiptMetadata={handleCorrectReceiptMetadata}
            onOpenReceiptModal={(rcp) => setActiveReceiptModal(rcp)}
            onRefundTransaction={handleRefundTransaction}
            onUpdateSystemConfig={handleUpdateSystemConfig}
          />
        ) : null}

        {/* Persistent Voice Channel Dock at Bottom (When connected to voice) */}
        {activeVoice && (
          <VoiceChannelDock
            channelName={activeVoice.channel.name}
            communityName={activeVoice.communityName}
            currentUser={profile}
            participants={voiceParticipants}
            onDisconnect={() => setActiveVoice(null)}
          />
        )}
      </div>

      {/* 4. Collapsible Right Contextual Panel (300px) */}
      {canShowContextualPanel && isRightPanelOpen && (
        <ContextualPanel
          activeView={activeView}
          activeCommunity={activeCommunity}
          recipientProfile={activeDm?.recipientProfile}
          activeOrb={selectedOrb}
          members={allUsers}
          onSelectMember={handleOpenDmWithUser}
          onViewProfile={(userId) => setActiveView({ type: 'profile', userId })}
          onBoostCommunity={handleBoostCommunity}
        />
      )}

      {/* Modals */}
      <QuickSwitcherModal
        isOpen={isQuickSwitcherOpen}
        onClose={() => setIsQuickSwitcherOpen(false)}
        communities={communities}
        directMessages={directMessages}
        orbs={orbs}
        allUsers={allUsers}
        currentUser={profile}
        onSelectChannel={handleSelectChannel}
        onSelectDm={(dmId) => setActiveView({ type: 'dm', dmId })}
        onStartDmWithUser={handleOpenDmWithUser}
        onSelectView={(view) => setActiveView(view)}
        onOpenCreateCommunity={() => setIsCreateCommunityOpen(true)}
        onOpenCreateOrb={() => setIsCreateOrbOpen(true)}
      />

      <SettingsModal
        currentUser={profile}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateProfile={updateProfile}
        onChangePassword={changePassword}
        onOpenNitro={() => setActiveView({ type: 'nitro' })}
        onOpenShop={() => setActiveView({ type: 'shop' })}
        onLogout={logout}
      />

      <CreateCommunityModal
        isOpen={isCreateCommunityOpen}
        onClose={() => setIsCreateCommunityOpen(false)}
        onCreate={handleCreateCommunity}
      />

      <CreateOrbModal
        isOpen={isCreateOrbOpen}
        onClose={() => setIsCreateOrbOpen(false)}
        onCreateOrb={handleCreateOrb}
      />

      <CreateChannelModal
        isOpen={!!createChannelCommunityId}
        communityId={createChannelCommunityId || ''}
        onClose={() => setCreateChannelCommunityId(null)}
        onCreateChannel={handleCreateChannel}
      />

      <RazorpayCheckoutModal
        isOpen={!!checkoutPayload}
        payload={checkoutPayload}
        currentUser={profile}
        authToken={token}
        allUsers={allUsers}
        onClose={() => setCheckoutPayload(null)}
        onVerifiedSuccess={handleVerifiedCheckoutSuccess}
        onOpenAdminPaymentSettings={
          isAdminOrAbove(profile)
            ? () => {
                setCheckoutPayload(null);
                setActiveView({ type: 'admin' });
              }
            : undefined
        }
      />

      <ReceiptDocumentModal
        receipt={activeReceiptModal}
        currentUser={profile}
        onClose={() => setActiveReceiptModal(null)}
        onCorrectReceiptMetadata={handleModalCorrectReceipt}
      />

      <ForcePasswordChangeModal
        isOpen={mustChangePassword && !passwordModalDismissed}
        userEmail={profile.email}
        onChangePassword={changePassword}
        onDeferForSession={() => setPasswordModalDismissed(true)}
        onLogout={logout}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
