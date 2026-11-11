import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { SettingsModal } from './components/modals/SettingsModal';
import { CreateCommunityModal } from './components/modals/CreateCommunityModal';
import { CreateOrbModal } from './components/modals/CreateOrbModal';
import { CreateChannelModal } from './components/modals/CreateChannelModal';

import { 
  DEFAULT_COMMUNITIES, DEFAULT_ORBS, SEED_MESSAGES, 
  DEMO_FRIENDS, DEMO_PENDING_REQUESTS 
} from './lib/dataService';
import { testConnection } from './lib/firebase';
import { 
  Community, Channel, OrbData, ChatMessage, 
  DirectMessageThread, FriendRequest, UserProfile, 
  ActiveView, VoiceParticipant, MessageAttachment 
} from './types';

function MainApp() {
  const { user, profile, loading, presence, setPresence, updateProfile, logout, loginDemoUser } = useAuth();

  // Primary application state
  const [communities, setCommunities] = useState<Community[]>(DEFAULT_COMMUNITIES);
  const [orbs, setOrbs] = useState<OrbData[]>(DEFAULT_ORBS);
  const [friends, setFriends] = useState<UserProfile[]>(DEMO_FRIENDS);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>(DEMO_PENDING_REQUESTS);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(SEED_MESSAGES);

  // Active navigation view state
  const [activeView, setActiveView] = useState<ActiveView>({
    type: 'dm',
    dmId: 'dm-seraphina'
  });

  // Selected Orb for 3D inspection
  const [selectedOrb, setSelectedOrb] = useState<OrbData | null>(null);

  // Active Voice/Stage room state
  const [activeVoice, setActiveVoice] = useState<{
    channel: Channel;
    communityName: string;
  } | null>(null);

  const [voiceIsMuted, setVoiceIsMuted] = useState(false);

  // Modal open states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [isCreateOrbOpen, setIsCreateOrbOpen] = useState(false);
  const [createChannelCommunityId, setCreateChannelCommunityId] = useState<string | null>(null);

  // Verify Firebase Firestore connection on initial boot
  useEffect(() => {
    testConnection();
  }, []);

  // Direct Message threads list derived from friends and conversation history
  const directMessages: DirectMessageThread[] = useMemo(() => {
    return [
      {
        id: 'dm-seraphina',
        participants: [profile?.uid || 'user', 'demo_seraph_mint'],
        recipientProfile: friends.find(f => f.uid === 'demo_seraph_mint'),
        lastMessageText: messagesMap['dm-seraphina']?.slice(-1)[0]?.content || 'Shared an image',
        lastMessageSenderId: messagesMap['dm-seraphina']?.slice(-1)[0]?.senderId,
        lastMessageAt: messagesMap['dm-seraphina']?.slice(-1)[0]?.createdAt || new Date().toISOString(),
        unreadCount: 0,
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'dm-cipher',
        participants: [profile?.uid || 'user', 'demo_cipher_gold'],
        recipientProfile: friends.find(f => f.uid === 'demo_cipher_gold'),
        lastMessageText: messagesMap['dm-cipher']?.slice(-1)[0]?.content || 'WebRTC audio pipeline verified.',
        lastMessageSenderId: messagesMap['dm-cipher']?.slice(-1)[0]?.senderId,
        lastMessageAt: messagesMap['dm-cipher']?.slice(-1)[0]?.createdAt || new Date().toISOString(),
        unreadCount: 0,
        createdAt: '2026-01-05T00:00:00Z'
      }
    ];
  }, [profile?.uid, friends, messagesMap]);

  // Total unread count
  const unreadDmCount = directMessages.reduce((acc, dm) => acc + (dm.unreadCount || 0), 0);

  // Voice room participants
  const voiceParticipants: VoiceParticipant[] = useMemo(() => {
    if (!profile) return [];
    return [
      {
        uid: profile.uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.uid}&backgroundColor=0d382e`,
        isMuted: voiceIsMuted,
        isDeafened: false,
        isSpeaking: false,
        volumeLevel: 0,
        isStageSpeaker: true,
        joinedAt: new Date().toISOString()
      },
      {
        uid: 'demo_seraph_mint',
        displayName: 'Seraphina Vale',
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=SeraphMint&backgroundColor=154338',
        isMuted: false,
        isDeafened: false,
        isSpeaking: true,
        volumeLevel: 45,
        isStageSpeaker: true,
        joinedAt: '2026-11-11T07:00:00Z'
      },
      {
        uid: 'demo_cipher_gold',
        displayName: 'Cipher',
        photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=CipherZero&backgroundColor=2e3a1f',
        isMuted: true,
        isDeafened: false,
        isSpeaking: false,
        volumeLevel: 0,
        isStageSpeaker: false,
        joinedAt: '2026-11-11T07:05:00Z'
      }
    ];
  }, [profile, voiceIsMuted]);

  // CRITICAL REQUIREMENT: Mark messages in conversation as read
  // When a user opens a conversation, mark messages as read and visually update UI with checkmarks
  const handleMarkAsRead = useCallback((convId: string) => {
    if (!profile) return;
    const currentUserId = profile.uid;

    setMessagesMap(prev => {
      const convMessages = prev[convId];
      if (!convMessages || convMessages.length === 0) return prev;

      let changed = false;
      const updated = convMessages.map(msg => {
        // If current user is not in readBy array, add them
        if (!msg.readBy || !msg.readBy.includes(currentUserId)) {
          changed = true;
          return {
            ...msg,
            readBy: [...(msg.readBy || [msg.senderId]), currentUserId]
          };
        }
        return msg;
      });

      if (!changed) return prev;
      return {
        ...prev,
        [convId]: updated
      };
    });
  }, [profile]);

  // Send a new chat message
  const handleSendMessage = useCallback((
    content: string, 
    attachments?: MessageAttachment[], 
    replyTo?: any
  ) => {
    if (!profile) return;

    let convId = '';
    if (activeView.type === 'dm') {
      convId = activeView.dmId;
    } else if (activeView.type === 'community') {
      convId = activeView.channelId;
    } else if (activeView.type === 'orbs' && selectedOrb) {
      convId = selectedOrb.id;
    }

    if (!convId) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      conversationId: convId,
      senderId: profile.uid,
      senderName: profile.displayName,
      senderAvatar: profile.photoURL,
      content,
      attachments,
      replyTo,
      readBy: [profile.uid], // initially read only by sender
      createdAt: new Date().toISOString()
    };

    setMessagesMap(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMessage]
    }));

    // In demo mode: simulate recipient reading the message after 2.5 seconds
    // to visibly show the single checkmark flipping to dual mint checkmark!
    if (activeView.type === 'dm') {
      const activeDm = directMessages.find(d => d.id === activeView.dmId);
      const recipientId = activeDm?.recipientProfile?.uid;

      if (recipientId) {
        setTimeout(() => {
          setMessagesMap(prev => {
            const list = prev[convId] || [];
            return {
              ...prev,
              [convId]: list.map(m => {
                if (m.id === newMessage.id) {
                  return {
                    ...m,
                    readBy: Array.from(new Set([...(m.readBy || []), recipientId]))
                  };
                }
                return m;
              })
            };
          });
        }, 2200);
      }
    }
  }, [profile, activeView, selectedOrb, directMessages]);

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    let convId = '';
    if (activeView.type === 'dm') convId = activeView.dmId;
    else if (activeView.type === 'community') convId = activeView.channelId;
    else if (activeView.type === 'orbs' && selectedOrb) convId = selectedOrb.id;
    if (!convId) return;

    setMessagesMap(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).map(m => 
        m.id === messageId ? { ...m, content: newContent, isEdited: true, updatedAt: new Date().toISOString() } : m
      )
    }));
  }, [activeView, selectedOrb]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    let convId = '';
    if (activeView.type === 'dm') convId = activeView.dmId;
    else if (activeView.type === 'community') convId = activeView.channelId;
    else if (activeView.type === 'orbs' && selectedOrb) convId = selectedOrb.id;
    if (!convId) return;

    setMessagesMap(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).filter(m => m.id !== messageId)
    }));
  }, [activeView, selectedOrb]);

  const handleToggleReaction = useCallback((messageId: string, emoji: string) => {
    if (!profile) return;
    let convId = '';
    if (activeView.type === 'dm') convId = activeView.dmId;
    else if (activeView.type === 'community') convId = activeView.channelId;
    else if (activeView.type === 'orbs' && selectedOrb) convId = selectedOrb.id;
    if (!convId) return;

    setMessagesMap(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).map(m => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions || {};
        const userList = currentReactions[emoji] || [];
        const hasReacted = userList.includes(profile.uid);

        const updatedUsers = hasReacted
          ? userList.filter(id => id !== profile.uid)
          : [...userList, profile.uid];

        const nextReactions = { ...currentReactions };
        if (updatedUsers.length === 0) {
          delete nextReactions[emoji];
        } else {
          nextReactions[emoji] = updatedUsers;
        }

        return { ...m, reactions: nextReactions };
      })
    }));
  }, [profile, activeView, selectedOrb]);

  const handleTogglePin = useCallback((messageId: string) => {
    let convId = '';
    if (activeView.type === 'dm') convId = activeView.dmId;
    else if (activeView.type === 'community') convId = activeView.channelId;
    else if (activeView.type === 'orbs' && selectedOrb) convId = selectedOrb.id;
    if (!convId) return;

    setMessagesMap(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).map(m => 
        m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
      )
    }));
  }, [activeView, selectedOrb]);

  // Social Friendship actions
  const handleSendFriendRequest = useCallback((targetUsername: string) => {
    if (!profile) return;
    const newReq: FriendRequest = {
      id: `req_${Date.now()}`,
      fromUid: profile.uid,
      toUid: `user_${targetUsername}`,
      fromUsername: profile.username,
      fromDisplayName: profile.displayName,
      fromPhotoURL: profile.photoURL,
      toUsername: targetUsername,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setPendingRequests(prev => [...prev, newReq]);
  }, [profile]);

  const handleAcceptRequest = useCallback((reqId: string) => {
    const req = pendingRequests.find(r => r.id === reqId);
    if (!req) return;

    const newFriend: UserProfile = {
      uid: req.fromUid,
      email: `${req.fromUsername}@doomcord.io`,
      username: req.fromUsername,
      displayName: req.fromDisplayName || req.fromUsername,
      photoURL: req.fromPhotoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.fromUid}&backgroundColor=0d382e`,
      presence: 'online',
      statusMessage: 'Connected on Doomcord',
      createdAt: new Date().toISOString()
    };

    setFriends(prev => [...prev, newFriend]);
    setPendingRequests(prev => prev.filter(r => r.id !== reqId));
  }, [pendingRequests]);

  const handleRejectRequest = useCallback((reqId: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== reqId));
  }, []);

  const handleRemoveFriend = useCallback((uid: string) => {
    setFriends(prev => prev.filter(f => f.uid !== uid));
  }, []);

  const handleBlockUser = useCallback((uid: string) => {
    updateProfile({
      blockedUsers: [...(profile?.blockedUsers || []), uid]
    });
  }, [profile, updateProfile]);

  const handleUnblockUser = useCallback((uid: string) => {
    updateProfile({
      blockedUsers: (profile?.blockedUsers || []).filter(id => id !== uid)
    });
  }, [profile, updateProfile]);

  // Community & Channels actions
  const handleCreateCommunity = useCallback((commData: Partial<Community>) => {
    if (!profile) return;
    const newComm: Community = {
      id: `comm_${Date.now()}`,
      name: commData.name || 'New Community',
      description: commData.description || 'A welcoming Doomcord server.',
      iconUrl: commData.iconUrl,
      themeColor: commData.themeColor || 'oklch(0.85 0.12 165)',
      ownerId: profile.uid,
      isPublic: true,
      memberCount: 1,
      createdAt: new Date().toISOString(),
      channels: [
        { id: `ch_${Date.now()}_1`, communityId: `comm_${Date.now()}`, name: 'general', topic: 'Main server chat', type: 'text', position: 1 },
        { id: `ch_${Date.now()}_2`, communityId: `comm_${Date.now()}`, name: 'Voice Lounge', topic: 'Open voice room', type: 'voice', position: 2 }
      ]
    };
    setCommunities(prev => [...prev, newComm]);
    setActiveView({ type: 'community', communityId: newComm.id, channelId: newComm.channels![0].id });
  }, [profile]);

  const handleJoinCommunity = useCallback((comm: Community) => {
    if (!communities.some(c => c.id === comm.id)) {
      setCommunities(prev => [...prev, comm]);
    }
    const firstTextChannel = comm.channels?.find(c => c.type === 'text') || comm.channels?.[0];
    if (firstTextChannel) {
      setActiveView({ type: 'community', communityId: comm.id, channelId: firstTextChannel.id });
    }
  }, [communities]);

  const handleCreateChannel = useCallback((channelData: Partial<Channel>) => {
    if (!createChannelCommunityId) return;

    const newChannel: Channel = {
      id: `ch_${Date.now()}`,
      communityId: createChannelCommunityId,
      name: channelData.name || 'new-channel',
      topic: channelData.topic,
      type: channelData.type || 'text',
      position: 10,
      createdAt: new Date().toISOString()
    };

    setCommunities(prev => prev.map(comm => {
      if (comm.id !== createChannelCommunityId) return comm;
      return {
        ...comm,
        channels: [...(comm.channels || []), newChannel]
      };
    }));

    setActiveView({
      type: 'community',
      communityId: createChannelCommunityId,
      channelId: newChannel.id
    });
  }, [createChannelCommunityId]);

  // Orb actions
  const handleCreateOrb = useCallback((orbData: Partial<OrbData>) => {
    if (!profile) return;
    const newOrb: OrbData = {
      id: `orb_${Date.now()}`,
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
      activityScore: 90,
      tags: orbData.tags || ['Community'],
      createdAt: new Date().toISOString()
    };
    setOrbs(prev => [newOrb, ...prev]);
    setSelectedOrb(newOrb);
  }, [profile]);

  // Channel Selection router
  const handleSelectChannel = (commId: string, channelId: string) => {
    const comm = communities.find(c => c.id === commId);
    const channel = comm?.channels?.find(ch => ch.id === channelId);

    if (channel?.type === 'voice' || channel?.type === 'stage') {
      // Connect to WebRTC voice room
      setActiveVoice({
        channel,
        communityName: comm?.name || 'Community'
      });
    }

    setActiveView({
      type: 'community',
      communityId: commId,
      channelId
    });
  };

  // Open Direct Message with a friend
  const handleOpenDmWithUser = (friend: UserProfile) => {
    let existingDm = directMessages.find(d => d.participants.includes(friend.uid));
    if (existingDm) {
      setActiveView({ type: 'dm', dmId: existingDm.id });
    } else {
      const newDmId = `dm_${Date.now()}`;
      setActiveView({ type: 'dm', dmId: newDmId });
    }
  };

  // Switch demo testing persona
  const handleSwitchPersona = async (index: number) => {
    await loginDemoUser(index);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[oklch(0.2_0.03_160)] text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] animate-spin mb-4" />
        <h2 className="text-base font-bold tracking-wide">Initializing Doomcord...</h2>
        <span className="text-xs text-[oklch(0.7_0.03_155)] mt-1">Connecting to real-time spatial network</span>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthView />;
  }

  // Derive current conversation / channel details
  const activeCommunity = activeView.type === 'community' 
    ? communities.find(c => c.id === activeView.communityId) 
    : null;

  const activeChannel = activeCommunity?.channels?.find(c => c.id === (activeView as any).channelId);

  const activeDm = activeView.type === 'dm' 
    ? directMessages.find(d => d.id === activeView.dmId) 
    : null;

  const activeConversationId = activeView.type === 'dm' 
    ? activeView.dmId 
    : activeView.type === 'community' 
    ? activeView.channelId 
    : selectedOrb?.id || '';

  const activeMessages = messagesMap[activeConversationId] || [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[oklch(0.2_0.03_160)] text-[oklch(0.95_0.015_150)]">
      {/* 1. Leftmost Navigation Rail */}
      <LeftNavRail
        communities={communities}
        activeView={activeView}
        currentUser={profile}
        unreadDmCount={unreadDmCount}
        onNavigateHome={() => setActiveView({ type: 'friends', subTab: 'online' })}
        onNavigateOrbs={() => setActiveView({ type: 'orbs' })}
        onNavigateExplore={() => setActiveView({ type: 'explore_communities' })}
        onSelectCommunity={(commId) => {
          const comm = communities.find(c => c.id === commId);
          const firstCh = comm?.channels?.[0];
          if (firstCh) {
            handleSelectChannel(commId, firstCh.id);
          }
        }}
        onCreateCommunity={() => setIsCreateCommunityOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSwitchPersona={handleSwitchPersona}
      />

      {/* 2. Contextual Channel or DM Sidebar (Hidden in 3D Orbs full viewport) */}
      {activeView.type !== 'orbs' && activeView.type !== 'explore_communities' && (
        <ContextSidebar
          activeView={activeView}
          communities={communities}
          directMessages={directMessages}
          currentUser={profile}
          onNavigateFriends={(subTab) => setActiveView({ type: 'friends', subTab: subTab || 'online' })}
          onSelectDm={(dmId) => setActiveView({ type: 'dm', dmId })}
          onSelectChannel={handleSelectChannel}
          onCreateChannel={(commId) => {
            setCreateChannelCommunityId(commId);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onChangePresence={setPresence}
        />
      )}

      {/* 3. Central Main Workspace View */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {activeView.type === 'friends' ? (
          <FriendsHub
            currentUser={profile}
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
            title={activeDm?.recipientProfile?.displayName || 'Direct Message'}
            subtitle={activeDm?.recipientProfile?.statusMessage || `@${activeDm?.recipientProfile?.username || 'user'}`}
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
              subtitle={activeChannel.topic || `${activeCommunity?.name} · Text channel`}
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
          <OrbsSpatialCanvas
            orbs={orbs}
            selectedOrb={selectedOrb}
            onSelectOrb={(orb) => setSelectedOrb(orb)}
            onEnterOrbRoom={(orb) => {
              setSelectedOrb(orb);
              // Open orb lounge conversation
              setActiveView({ type: 'orbs', orbId: orb.id, viewMode: 'detail' });
            }}
            onCreateOrb={() => setIsCreateOrbOpen(true)}
          />
        ) : activeView.type === 'explore_communities' ? (
          <ExploreCommunitiesView
            communities={communities}
            joinedCommunityIds={communities.map(c => c.id)}
            onJoinCommunity={handleJoinCommunity}
            onCreateCommunity={() => setIsCreateCommunityOpen(true)}
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
      <ContextualPanel
        activeView={activeView}
        activeCommunity={activeCommunity}
        recipientProfile={activeDm?.recipientProfile}
        activeOrb={selectedOrb}
        members={friends}
        onSelectMember={handleOpenDmWithUser}
      />

      {/* Modals */}
      <SettingsModal
        currentUser={profile}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateProfile={updateProfile}
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
