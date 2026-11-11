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
} from 'firebase/firestore';
import { Megaphone, ArrowLeft, Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './components/auth/AuthView';
import { LeftNavRail } from './components/navigation/LeftNavRail';
import { ContextSidebar } from './components/navigation/ContextSidebar';
import { ContextualPanel } from './components/panels/ContextualPanel';
import { ChatView } from './components/chat/ChatView';
import { FriendsHub } from './components/friends/FriendsHub';
import { OrbsSpatialCanvas } from './components/orbs/OrbsSpatialCanvas';
import { VoiceChannelDock } from './components/voice/VoiceChannelDock';
import { VoiceStageView } from './components/voice/VoiceStageView';
import { ExploreCommunitiesView } from './components/discovery/ExploreCommunitiesView';
import { NitroView } from './components/nitro/NitroView';
import { CosmeticsShopView } from './components/shop/CosmeticsShopView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { SettingsModal } from './components/modals/SettingsModal';
import { CreateCommunityModal } from './components/modals/CreateCommunityModal';
import { CreateOrbModal } from './components/modals/CreateOrbModal';
import { CreateChannelModal } from './components/modals/CreateChannelModal';
import {
  RazorpayCheckoutModal,
  CheckoutPayload,
} from './components/modals/RazorpayCheckoutModal';
import { ForcePasswordChangeModal } from './components/modals/ForcePasswordChangeModal';

import {
  INITIAL_NITRO_PLANS,
  INITIAL_COSMETICS_CATALOG,
  INITIAL_SYSTEM_CONFIG,
  generateInitialsAvatar,
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
  NitroPlanConfig,
  CosmeticItem,
  CosmeticCategory,
  TransactionRecord,
  AuditLogEntry,
  SystemConfigData,
  PlatformRole,
  EquippedCosmetics,
} from './types';

function MainApp() {
  const {
    profile,
    token,
    loading,
    mustChangePassword,
    setPresence,
    updateProfile,
    changePassword,
    logout,
  } = useAuth();

  // Real Firestore-synchronized collections (strictly zero fake demo data)
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [orbs, setOrbs] = useState<OrbData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [dmDocs, setDmDocs] = useState<DirectMessageThread[]>([]);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [nitroPlans, setNitroPlans] = useState<NitroPlanConfig[]>(INITIAL_NITRO_PLANS);
  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>(INITIAL_COSMETICS_CATALOG);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfigData>(INITIAL_SYSTEM_CONFIG);

  // Active navigation view state
  const [activeView, setActiveView] = useState<ActiveView>({
    type: 'friends',
    subTab: 'online',
  });

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

  // Verify Firebase Firestore connection on initial boot
  useEffect(() => {
    testConnection();
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
      const entry: AuditLogEntry = {
        id: logId,
        actorUid: profile.uid,
        actorEmail: profile.email,
        action,
        targetId: targetUid,
        details: targetEmail ? `[${targetEmail}] ${details}` : details,
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'audit_logs', logId), entry);
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
          comm.channels = chList;
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

    // 6. Nitro plans
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

    // 9. Audit Logs
    const unsubLogs = onSnapshot(collection(db, 'audit_logs'), (snap) => {
      const list: AuditLogEntry[] = [];
      snap.forEach((d) => list.push(d.data() as AuditLogEntry));
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAuditLogs(list);
    });

    // 10. Global System Config
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

  // Real voice participants (only the currently connected real user)
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
      replyTo?: { id: string; senderName: string; content: string }
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
        content,
        attachments: attachments || [],
        replyTo,
        readBy: [profile.uid],
        createdAt: now,
      };

      await setDoc(doc(colRef, msgId), newMessage);

      // Update DM thread summary if in a DM
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
      await setDoc(doc(db, 'friend_requests', reqId), newReq);
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
      await setDoc(doc(db, 'direct_messages', dmId), newDm, { merge: true });
      setActiveView({ type: 'dm', dmId });
    },
    [profile, dmDocs]
  );

  // Community & Channels creation in Firestore
  const handleCreateCommunity = useCallback(
    async (commData: Partial<Community>) => {
      if (!profile) return;
      const commId = `comm_${Date.now()}`;
      const ch1Id = `ch_${Date.now()}_1`;
      const ch2Id = `ch_${Date.now()}_2`;
      const now = new Date().toISOString();

      const ch1: Channel = {
        id: ch1Id,
        communityId: commId,
        name: 'general',
        topic: 'Main community discussion',
        type: 'text',
        position: 1,
        createdAt: now,
      };
      const ch2: Channel = {
        id: ch2Id,
        communityId: commId,
        name: 'Voice Lounge',
        topic: 'Live WebRTC audio room',
        type: 'voice',
        position: 2,
        createdAt: now,
      };

      const newComm: Community = {
        id: commId,
        name: commData.name || 'New Community',
        description: commData.description || 'A real Doomcord community server.',
        iconUrl:
          commData.iconUrl ||
          generateInitialsAvatar(commData.name || 'Community', '#065f46'),
        themeColor: commData.themeColor || 'oklch(0.85 0.12 165)',
        ownerId: profile.uid,
        isPublic: true,
        members: [profile.uid],
        memberCount: 1,
        createdAt: now,
      };

      await setDoc(doc(db, 'communities', commId), newComm);
      await setDoc(doc(db, 'communities', commId, 'channels', ch1Id), ch1);
      await setDoc(doc(db, 'communities', commId, 'channels', ch2Id), ch2);

      const nextJoined = Array.from(
        new Set([...(profile.joinedCommunities || []), commId])
      );
      await updateProfile({ joinedCommunities: nextJoined });

      setActiveView({
        type: 'community',
        communityId: commId,
        channelId: ch1Id,
      });
    },
    [profile, updateProfile]
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
      const newChannel: Channel = {
        id: chId,
        communityId: createChannelCommunityId,
        name: channelData.name || 'new-channel',
        topic: channelData.topic || '',
        type: channelData.type || 'text',
        position: 10,
        createdAt: new Date().toISOString(),
      };

      await setDoc(
        doc(db, 'communities', createChannelCommunityId, 'channels', chId),
        newChannel
      );

      setActiveView({
        type: 'community',
        communityId: createChannelCommunityId,
        channelId: chId,
      });
      setCreateChannelCommunityId(null);
    },
    [createChannelCommunityId]
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
        primaryColor: orbData.primaryColor || '#10b981',
        secondaryColor: orbData.secondaryColor || '#06b6d4',
        visibility: orbData.visibility || 'public',
        creatorId: profile.uid,
        creatorName: profile.displayName,
        memberCount: 1,
        activityScore: 100,
        tags: orbData.tags || ['Community'],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'orbs', orbId), newOrb);
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

  // Verified Razorpay payment fulfillment
  const handleVerifiedCheckoutSuccess = useCallback(
    async (
      payload: CheckoutPayload,
      paymentDetails: { orderId: string; paymentId: string; signature: string }
    ) => {
      if (!profile) return;
      const now = new Date();
      const txId = `tx_${Date.now()}`;

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
        createdAt: now.toISOString(),
      };

      await setDoc(doc(db, 'transactions', txId), txRecord);

      if (payload.type === 'nitro_subscription' && payload.tier) {
        const renewDate = new Date(now);
        if (payload.billingCycle === 'yearly') {
          renewDate.setFullYear(renewDate.getFullYear() + 1);
        } else {
          renewDate.setMonth(renewDate.getMonth() + 1);
        }

        await updateProfile({
          nitroTier: payload.tier,
          nitroBillingCycle: payload.billingCycle || 'monthly',
          nitroAutoRenew: true,
          nitroExpiresAt: renewDate.toISOString(),
        });

        await recordAuditLog(
          'NITRO_SUBSCRIPTION_CAPTURED',
          `Verified Razorpay payment ${paymentDetails.paymentId} for ${payload.itemName} (₹${payload.amountINR} INR)`,
          profile.uid,
          profile.email
        );
      } else if (payload.type === 'cosmetic_purchase') {
        const nextOwned = Array.from(
          new Set([...(profile.ownedCosmetics || []), payload.itemId])
        );
        await updateProfile({ ownedCosmetics: nextOwned });

        await recordAuditLog(
          'COSMETIC_PURCHASE_CAPTURED',
          `Verified Razorpay payment ${paymentDetails.paymentId} for ${payload.itemName} (₹${payload.amountINR} INR)`,
          profile.uid,
          profile.email
        );
      }
    },
    [profile, updateProfile, recordAuditLog]
  );

  // Nitro subscription self-management handlers
  const handleCancelAutoRenew = useCallback(async () => {
    if (!profile) return;
    await updateProfile({ nitroAutoRenew: false });
    await recordAuditLog(
      'NITRO_AUTO_RENEW_CANCELLED',
      'User disabled automatic renewal for Nitro membership.',
      profile.uid,
      profile.email
    );
  }, [profile, updateProfile, recordAuditLog]);

  const handleReactivateAutoRenew = useCallback(async () => {
    if (!profile) return;
    await updateProfile({ nitroAutoRenew: true });
    await recordAuditLog(
      'NITRO_AUTO_RENEW_REACTIVATED',
      'User re-enabled automatic renewal for Nitro membership.',
      profile.uid,
      profile.email
    );
  }, [profile, updateProfile, recordAuditLog]);

  const handleDowngradeToFree = useCallback(async () => {
    if (!profile) return;
    await updateProfile({
      nitroTier: 'free',
      nitroBillingCycle: 'none',
      nitroAutoRenew: false,
    });
    await recordAuditLog(
      'NITRO_DOWNGRADED_TO_FREE',
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
        'UPDATE_NITRO_PLAN',
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
      await recordAuditLog(
        'DELETE_COMMUNITY',
        `Deleted community ${communityId}`
      );
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
      if (token) {
        const res = await fetch('/api/admin/user-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ targetUid, newRole }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update role on server.');
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

  const handleModerateUser = useCallback(
    async (
      targetUid: string,
      action: 'ban' | 'unban' | 'suspend' | 'unsuspend'
    ) => {
      if (token) {
        const res = await fetch('/api/admin/user-moderation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ targetUid, action }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to moderate user.');
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
      const targetUser = allUsers.find((u) => u.uid === targetUid);
      const expiresAt =
        tier === 'free'
          ? ''
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

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
              ? 'Doomcord Nitro (Promotional Admin Grant)'
              : 'Doomcord Nitro Basic (Promotional Admin Grant)',
          amountINR: 0,
          currency: 'INR',
          billingCycle: 'monthly',
          status: 'verified',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'transactions', txId), grantTx);
      }

      await recordAuditLog(
        tier === 'free' ? 'REVOKE_NITRO_ENTITLEMENT' : 'GRANT_NITRO_ENTITLEMENT',
        `Set Nitro tier to "${tier.toUpperCase()}" for ${targetUser?.email || targetUid}`,
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

  const handleRefundTransaction = useCallback(
    async (tx: TransactionRecord) => {
      await updateDoc(doc(db, 'transactions', tx.id), {
        status: 'refunded',
      });

      const targetUser = allUsers.find((u) => u.uid === tx.userId);
      if (targetUser) {
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[oklch(0.2_0.03_160)] text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] animate-spin mb-4" />
        <h2 className="text-base font-bold tracking-wide">
          Initializing Doomcord...
        </h2>
        <span className="text-xs text-[oklch(0.7_0.03_155)] mt-1">
          Connecting to real-time spatial network
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
    activeView.type === 'admin';

  const showContextualPanel =
    activeView.type === 'dm' ||
    activeView.type === 'community' ||
    (activeView.type === 'orbs' && !!selectedOrb);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[oklch(0.2_0.03_160)] text-[oklch(0.95_0.015_150)]">
      {/* 1. Leftmost Navigation Rail */}
      <LeftNavRail
        communities={communities}
        activeView={activeView}
        currentUser={profile}
        unreadDmCount={unreadDmCount}
        onNavigateHome={() => setActiveView({ type: 'friends', subTab: 'online' })}
        onNavigateOrbs={() => setActiveView({ type: 'orbs', viewMode: 'explore' })}
        onNavigateNitro={() => setActiveView({ type: 'nitro' })}
        onNavigateShop={() => setActiveView({ type: 'shop' })}
        onNavigateAdmin={() => setActiveView({ type: 'admin' })}
        onNavigateExplore={() => setActiveView({ type: 'explore_communities' })}
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

      {/* 2. Contextual Channel or DM Sidebar */}
      {!hideContextSidebar && (
        <ContextSidebar
          activeView={activeView}
          communities={communities}
          directMessages={directMessages}
          currentUser={profile}
          onNavigateFriends={(subTab) =>
            setActiveView({ type: 'friends', subTab: subTab || 'online' })
          }
          onNavigateNitro={() => setActiveView({ type: 'nitro' })}
          onNavigateShop={() => setActiveView({ type: 'shop' })}
          onNavigateAdmin={() => setActiveView({ type: 'admin' })}
          onSelectDm={(dmId) => setActiveView({ type: 'dm', dmId })}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={(commId) => setCreateChannelCommunityId(commId)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onChangePresence={setPresence}
        />
      )}

      {/* 3. Central Main Workspace View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Global Platform Announcement Banner */}
        {systemConfig.globalAnnouncement && (
          <div className="px-6 py-2 bg-gradient-to-r from-[oklch(0.72_0.16_32)]/20 via-[oklch(0.85_0.12_165)]/20 to-[oklch(0.72_0.16_32)]/20 border-b border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white">
              <Megaphone className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)] shrink-0" />
              <span className="font-semibold">{systemConfig.globalAnnouncement}</span>
            </div>
            <span className="text-[10px] font-mono text-[oklch(0.85_0.12_165)] uppercase tracking-wider">
              System Broadcast
            </span>
          </div>
        )}

        {activeView.type === 'friends' ? (
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
            onMarkAsRead={handleMarkAsRead}
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
              onMarkAsRead={handleMarkAsRead}
            />
          )
        ) : activeView.type === 'orbs' ? (
          activeView.viewMode === 'detail' && selectedOrb ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="px-6 py-2.5 bg-[oklch(0.14_0.025_162)] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
                  <span className="text-xs font-bold text-white">
                    {selectedOrb.name} · Spatial Orb Lounge
                  </span>
                  <span className="text-[11px] font-mono text-[oklch(0.7_0.03_155)]">
                    · {selectedOrb.category}
                  </span>
                </div>
                <button
                  onClick={() => setActiveView({ type: 'orbs', viewMode: 'explore' })}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[oklch(0.235_0.032_158)] hover:bg-white/10 text-xs font-semibold text-white border border-white/10"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to 3D Cosmos</span>
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
                onMarkAsRead={handleMarkAsRead}
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
          />
        ) : activeView.type === 'nitro' ? (
          <NitroView
            currentUser={profile}
            plans={nitroPlans}
            userTransactions={userTransactions}
            onStartCheckout={(payload) => setCheckoutPayload(payload)}
            onCancelAutoRenew={handleCancelAutoRenew}
            onReactivateAutoRenew={handleReactivateAutoRenew}
            onDowngradeToFree={handleDowngradeToFree}
            onOpenShop={() => setActiveView({ type: 'shop' })}
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
            auditLogs={auditLogs}
            systemConfig={systemConfig}
            onUpdateNitroPlan={handleUpdateNitroPlan}
            onSaveCosmetic={handleSaveCosmetic}
            onDeleteCommunity={handleDeleteCommunity}
            onDeleteOrb={handleDeleteOrb}
            onUpdateUserRole={handleUpdateUserRole}
            onModerateUser={handleModerateUser}
            onGrantOrRevokeNitro={handleGrantOrRevokeNitro}
            onGrantOrRevokeCosmetic={handleGrantOrRevokeCosmetic}
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

      {/* 4. Contextual Side Panel */}
      {showContextualPanel && (
        <ContextualPanel
          activeView={activeView}
          activeCommunity={activeCommunity}
          recipientProfile={activeDm?.recipientProfile}
          activeOrb={selectedOrb}
          members={allUsers}
          onSelectMember={handleOpenDmWithUser}
        />
      )}

      {/* Modals */}
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
        onClose={() => setCheckoutPayload(null)}
        onVerifiedSuccess={handleVerifiedCheckoutSuccess}
        onOpenAdminPaymentSettings={
          profile.role === 'owner' || profile.role === 'admin'
            ? () => {
                setCheckoutPayload(null);
                setActiveView({ type: 'admin' });
              }
            : undefined
        }
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
