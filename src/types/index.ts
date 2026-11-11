export type UserPresence = 'online' | 'idle' | 'dnd' | 'invisible';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL?: string;
  bannerURL?: string;
  bio?: string;
  statusMessage?: string;
  presence: UserPresence;
  accentColor?: string;
  createdAt: string;
  updatedAt?: string;
  blockedUsers?: string[];
  savedMessages?: string[];
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromUsername: string;
  fromDisplayName?: string;
  fromPhotoURL?: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  size?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachments?: MessageAttachment[];
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  readBy?: string[]; // array of userIds who read the message
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  isPinned?: boolean;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface DirectMessageThread {
  id: string;
  participants: string[];
  recipientProfile?: UserProfile;
  lastMessageText?: string;
  lastMessageSenderId?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  isMuted?: boolean;
  createdAt: string;
}

export type ChannelType = 'text' | 'announcement' | 'voice' | 'stage';

export interface Channel {
  id: string;
  communityId: string;
  name: string;
  topic?: string;
  type: ChannelType;
  position: number;
  unread?: boolean;
  createdAt?: string;
}

export type MemberRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface CommunityMember {
  userId: string;
  communityId: string;
  role: MemberRole;
  nickname?: string;
  joinedAt: string;
  profile?: UserProfile;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  bannerUrl?: string;
  ownerId: string;
  themeColor: string;
  isPublic: boolean;
  channels?: Channel[];
  memberCount?: number;
  createdAt: string;
}

export type OrbVisibility = 'public' | 'friends' | 'private';

export interface OrbData {
  id: string;
  name: string;
  description: string;
  category: 'Gaming' | 'Coding' | 'Anime' | 'Music' | 'Art' | 'Science' | 'Study' | 'Tech' | 'Chill';
  icon: string;
  primaryColor: string;
  secondaryColor: string;
  visibility: OrbVisibility;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  memberCount: number;
  activityScore: number;
  tags: string[];
  members?: string[];
  createdAt: string;
}

export interface VoiceParticipant {
  uid: string;
  displayName: string;
  photoURL?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  volumeLevel: number;
  isStageSpeaker?: boolean;
  joinedAt: string;
}

export interface AppNotification {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'direct_message' | 'community_invite' | 'orb_activity' | 'mention';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
  actionPayload?: Record<string, any>;
}

export type ActiveView = 
  | { type: 'friends'; subTab: 'online' | 'all' | 'pending' | 'blocked' | 'add' }
  | { type: 'dm'; dmId: string }
  | { type: 'community'; communityId: string; channelId: string }
  | { type: 'orbs'; orbId?: string; viewMode?: 'explore' | 'detail' | 'create' }
  | { type: 'explore_communities' };
