export type UserPresence = 'online' | 'idle' | 'dnd' | 'invisible';
export type PlatformRole = 'owner' | 'admin' | 'moderator' | 'member';
export type NitroTier = 'free' | 'basic' | 'nitro';
export type BillingCycle = 'none' | 'monthly' | 'yearly';

export interface EquippedCosmetics {
  avatarDecoration?: string;
  profileEffect?: string;
  profileTheme?: string;
  nameplate?: string;
  banner?: string;
  appTheme?: string;
  chatCosmetic?: string;
  soundEffect?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  role: PlatformRole;
  photoURL?: string;
  bannerURL?: string;
  bio?: string;
  statusMessage?: string;
  presence: UserPresence;
  accentColor?: string;
  secondaryColor?: string;
  nitroTier: NitroTier;
  nitroBillingCycle: BillingCycle;
  nitroExpiresAt?: string;
  nitroAutoRenew?: boolean;
  ownedCosmetics: string[];
  equippedCosmetics: EquippedCosmetics;
  badges: string[];
  isBanned?: boolean;
  isSuspended?: boolean;
  mustChangePassword?: boolean;
  authSalt?: string;
  authHash?: string;
  createdAt: string;
  updatedAt?: string;
  friends?: string[];
  joinedCommunities?: string[];
  blockedUsers?: string[];
  savedMessages?: string[];
}

export interface NitroPlanConfig {
  id: string;
  tier: NitroTier;
  name: string;
  tagline: string;
  monthlyPriceINR: number;
  yearlyPriceINR: number;
  uploadLimitMB: number;
  maxMessageLength: number;
  shopDiscountPercent: number;
  benefits: string[];
  updatedAt: string;
}

export type CosmeticCategory =
  | 'Avatar Decorations'
  | 'Profile Effects'
  | 'Profile Themes'
  | 'Nameplates'
  | 'Profile Badges'
  | 'Banners'
  | 'Animated Avatars'
  | 'App Themes and Icons'
  | 'Chat Cosmetics'
  | 'Sound Effects'
  | 'Seasonal Collections'
  | 'Exclusive Bundles';

export type CosmeticRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  category: CosmeticCategory;
  priceINR: number;
  rarity: CosmeticRarity;
  nitroEligible: NitroTier | 'none';
  cssPreviewClass: string;
  previewColorPrimary: string;
  previewColorSecondary: string;
  enabled: boolean;
  isLimitedEdition?: boolean;
  bundleItems?: string[];
  createdAt: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  userEmail: string;
  type: 'nitro_subscription' | 'cosmetic_purchase' | 'admin_grant' | 'refund';
  itemId: string;
  itemName: string;
  amountINR: number;
  currency: 'INR';
  status: 'created' | 'verified' | 'captured' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  billingCycle?: BillingCycle;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetId?: string;
  details: string;
  createdAt: string;
}

export interface SystemConfigData {
  id: string;
  merchantUpiId: string;
  maintenanceMode: boolean;
  globalAnnouncement: string;
  globalDiscountPercent: number;
  updatedAt: string;
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
  senderRole?: PlatformRole;
  senderNitroTier?: NitroTier;
  senderNameplate?: string;
  content: string;
  attachments?: MessageAttachment[];
  reactions?: Record<string, string[]>;
  readBy?: string[];
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

export interface Community {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  bannerUrl?: string;
  ownerId: string;
  themeColor: string;
  isPublic: boolean;
  members: string[];
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

export type ActiveView =
  | { type: 'friends'; subTab: 'online' | 'all' | 'pending' | 'blocked' | 'add' }
  | { type: 'dm'; dmId: string }
  | { type: 'community'; communityId: string; channelId: string }
  | { type: 'orbs'; orbId?: string; viewMode?: 'explore' | 'detail' | 'create' }
  | { type: 'explore_communities' }
  | { type: 'nitro' }
  | { type: 'shop'; initialCategory?: CosmeticCategory }
  | { type: 'admin' };
