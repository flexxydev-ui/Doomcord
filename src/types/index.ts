export type UserPresence = 'online' | 'idle' | 'dnd' | 'invisible';
export type PlatformRole =
  | 'root_owner'
  | 'secondary_owner'
  | 'owner'
  | 'admin'
  | 'moderator'
  | 'member';
// Internal storage identifiers preserved for backward-compatible DB migration:
// 'basic' = DOOMCORD APEX (₹49/mo), 'nitro' = DOOMCORD APEX+ (₹99/mo)
export type NitroTier = 'free' | 'basic' | 'nitro';
export type BillingCycle = 'none' | 'monthly' | 'yearly' | 'lifetime';

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
  nitroExpiresAt?: string | null;
  nitroAutoRenew?: boolean;
  permanentEntitlement?:
    | 'OWNER_PERMANENT_APEX'
    | 'OWNER_PERMANENT_NITRO'
    | 'LIFETIME_APEX_PLUS'
    | 'LIFETIME_APEX';
  ownerPermanentApex?: boolean;
  ownerPermanentNitro?: boolean;
  ownedCosmetics: string[];
  equippedCosmetics: EquippedCosmetics;
  badges: string[];
  isBanned?: boolean;
  isSuspended?: boolean;
  mustChangePassword?: boolean;
  authSalt?: string;
  authHash?: string;
  secondaryOwnerPermissions?: {
    canManageUsers: boolean;
    canManageCommunities: boolean;
    canManageApexPlans: boolean;
    canManageCosmetics: boolean;
    canCreateGifts: boolean;
    canManageReceipts: boolean;
    canProcessRefunds: boolean;
  };
  createdAt: string;
  updatedAt?: string;
  friends?: string[];
  joinedCommunities?: string[];
  blockedUsers?: string[];
  savedMessages?: string[];
  // Account Security & 2FA
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  emailVerified?: boolean;
  passkeys?: {
    id: string;
    name: string;
    createdAt: string;
  }[];
  loginHistory?: {
    id: string;
    device: string;
    ip: string;
    method: string;
    timestamp: string;
  }[];
  connectedAccounts?: {
    provider: 'github' | 'google' | 'twitch' | 'youtube' | 'spotify' | 'steam';
    username: string;
    connectedAt: string;
    showOnProfile: boolean;
  }[];
  privacySettings?: {
    readReceipts: boolean;
    allowDmFromServerMembers: boolean;
    sharePresence: boolean;
  };
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

export type GiftDuration = '1d' | '7d' | '1m' | '30d' | '90d' | '1y' | 'lifetime';

export interface GiftRecord {
  id: string;
  tokenHash: string;
  tokenPreview: string;
  claimToken?: string;
  creatorUid: string;
  creatorName: string;
  apexTier: 'none' | 'basic' | 'nitro';
  billingCycle?: 'monthly' | 'yearly' | 'lifetime';
  cosmeticIds: string[];
  duration: GiftDuration;
  personalMessage: string;
  restrictedRecipientUid?: string;
  restrictedRecipientUsername?: string;
  restrictedRecipientEmail?: string;
  isPaidGift?: boolean;
  purchaserUid?: string;
  amountPaidINR?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  receiptId?: string;
  status: 'unclaimed' | 'redeemed' | 'revoked' | 'expired';
  redeemedByUid?: string;
  redeemedByEmail?: string;
  redeemedByUsername?: string;
  redeemedAt?: string;
  linkExpiresAt?: string | null;
  createdAt: string;
}

export interface GiftRedemptionRecord {
  id: string;
  giftId: string;
  recipientUid: string;
  recipientEmail: string;
  apexTierGranted: 'none' | 'basic' | 'nitro';
  cosmeticsGranted: string[];
  duration: GiftDuration;
  entitlementExpiresAt: string | null;
  redeemedAt: string;
}

export interface UserEntitlementRecord {
  id: string;
  userId: string;
  entitlementCode: string;
  source: 'owner_permanent' | 'gift' | 'razorpay' | 'admin_grant';
  sourceId?: string;
  apexTier: 'none' | 'basic' | 'nitro';
  cosmeticIds: string[];
  isLifetime: boolean;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface SecurityAuditItem {
  id: string;
  vulnerability: string;
  category:
    | 'Authentication'
    | 'Authorization'
    | 'Database & RLS'
    | 'Payment & Gifting'
    | 'Application & API';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  affectedComponent: string;
  fixImplemented: string;
  testPerformed: string;
  remainingRisk: string;
  status: 'Remediated & Verified';
}

export interface TransactionRecord {
  id: string;
  userId: string;
  userEmail: string;
  type:
    | 'nitro_subscription'
    | 'cosmetic_purchase'
    | 'apex_gift_purchase'
    | 'admin_grant'
    | 'refund';
  itemId: string;
  itemName: string;
  amountINR: number;
  currency: 'INR';
  status: 'created' | 'verified' | 'captured' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  billingCycle?: BillingCycle;
  isGiftPurchase?: boolean;
  giftId?: string;
  receiptId?: string;
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

export interface PollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  createdBy: string;
  closed?: boolean;
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
  poll?: PollData;
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

export type ChannelType = 'text' | 'announcement' | 'forum' | 'media' | 'voice' | 'stage';

export interface Channel {
  id: string;
  communityId: string;
  name: string;
  topic?: string;
  category?: string;
  type: ChannelType;
  position: number;
  slowmodeSeconds?: number;
  isPrivate?: boolean;
  unread?: boolean;
  createdAt?: string;
}

export type MemberRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface ServerRoleDefinition {
  id: string;
  name: string;
  color: string;
  hoisted: boolean;
  mentionable: boolean;
  position: number;
  permissions: string[];
}

export interface ServerInviteRecord {
  code: string;
  creatorUid: string;
  creatorName: string;
  uses: number;
  maxUses?: number | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ServerWebhookRecord {
  id: string;
  name: string;
  channelId: string;
  secretToken: string;
  deliveriesCount: number;
  createdAt: string;
}

export interface ServerBotRecord {
  id: string;
  name: string;
  description: string;
  prefix: string;
  permissions: string[];
  installedAt: string;
}

export interface ServerEventRecord {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  locationChannelId?: string;
  interestedUids: string[];
  createdAt: string;
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
  members: string[];
  channels?: Channel[];
  memberCount?: number;
  boostCount?: number;
  boostedBy?: string[];
  memberRoles?: Record<string, MemberRole>;
  customRoles?: ServerRoleDefinition[];
  bannedMembers?: string[];
  timedOutMembers?: Record<string, string>;
  invites?: ServerInviteRecord[];
  webhooks?: ServerWebhookRecord[];
  installedBots?: ServerBotRecord[];
  events?: ServerEventRecord[];
  verificationLevel?: 'none' | 'low' | 'medium' | 'high';
  welcomeMessage?: string;
  rules?: string[];
  autoModConfig?: {
    enabled: boolean;
    blockInviteLinks: boolean;
    blockExcessiveCaps: boolean;
    maxMentionsPerMessage: number;
    blockedKeywords: string[];
  };
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

export type ReceiptType =
  | 'APEX Membership Receipt'
  | 'APEX+ Membership Receipt'
  | 'Cosmetic Purchase Receipt'
  | 'Decoration Purchase Receipt'
  | 'APEX Gift Receipt'
  | 'Lifetime Membership Receipt'
  | 'Lifetime Cosmetic Receipt'
  | 'Custom Service Receipt'
  | 'Complimentary Gift Receipt'
  | 'Refund Receipt';

export type ReceiptPaymentStatus =
  | 'Paid'
  | 'Complimentary'
  | 'Pending'
  | 'Failed'
  | 'Refunded';

export type ReceiptDurationPreset =
  | '1d'
  | '3d'
  | '7d'
  | '15d'
  | '30d'
  | '60d'
  | '90d'
  | '180d'
  | '1y'
  | 'lifetime'
  | 'custom';

export type CustomDurationUnit =
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years';

export interface ReceiptLineItem {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  unitPriceINR: number;
  discountINR: number;
  finalAmountINR: number;
  durationPreset: ReceiptDurationPreset;
  customDurationValue?: number;
  customDurationUnit?: CustomDurationUnit;
  durationLabel: string;
  serviceStartDate: string;
  serviceExpiryDate: string | null; // null = LIFETIME — NO EXPIRATION
}

export interface ReceiptAuditEvent {
  id: string;
  receiptId: string;
  actorUid: string;
  actorEmail: string;
  action: 'ISSUED' | 'METADATA_CORRECTED' | 'REPLACEMENT_ISSUED' | 'STATUS_UPDATED';
  reason: string;
  previousNotes?: string;
  newNotes?: string;
  timestamp: string;
}

export interface ReceiptRecord {
  id: string;
  receiptNumber: string; // e.g. DC-2026-000001
  accessToken: string; // Secure token for /receipt/DC-2026-000001?token=...
  receiptType: ReceiptType;
  title: string;
  description: string;
  customerUid: string;
  customerUsername: string;
  customerDisplayName: string;
  customerEmail: string;
  items: ReceiptLineItem[];
  subtotalINR: number;
  discountTotalINR: number;
  taxINR: number;
  totalAmountINR: number;
  currency: 'INR';
  paymentMethod: string;
  paymentStatus: ReceiptPaymentStatus;
  transactionId: string;
  linkedGiftId?: string;
  purchaseNature?: 'self_purchase' | 'gift_purchase' | 'complimentary_owner_gift' | 'redeemed_gift';
  giftRecipientInfo?: string;
  giftRedemptionStatus?: 'unclaimed' | 'redeemed' | 'revoked' | 'expired';
  issueDate: string;
  serviceStartDate: string;
  serviceExpiryDate: string | null; // null = LIFETIME — NO EXPIRATION
  serviceDurationLabel: string;
  notes: string;
  issuerUid: string;
  issuerName: string;
  issuerEmail: string;
  issuerRole: PlatformRole;
  replacedByReceiptNumber?: string;
  replacesReceiptNumber?: string;
  auditHistory: ReceiptAuditEvent[];
  createdAt: string;
  updatedAt?: string;
}

export interface OwnerInvitationRecord {
  id: string;
  email: string;
  invitedDisplayName?: string;
  tokenHash: string;
  tokenPreview: string;
  inviteToken?: string;
  createdByUid: string;
  createdByEmail: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  acceptedByUid?: string;
  acceptedAt?: string;
  createdAt: string;
}

export type ActiveView =
  | { type: 'home' }
  | { type: 'friends'; subTab: 'online' | 'all' | 'pending' | 'blocked' | 'add' }
  | { type: 'dm'; dmId: string }
  | { type: 'community'; communityId: string; channelId: string }
  | { type: 'orbs'; orbId?: string; viewMode?: 'explore' | 'detail' | 'create' | '3d' }
  | { type: 'explore_communities' }
  | { type: 'notifications' }
  | { type: 'profile'; userId?: string }
  | { type: 'nitro' }
  | { type: 'shop'; initialCategory?: CosmeticCategory }
  | { type: 'admin' }
  | { type: 'gift_redeem'; token?: string }
  | { type: 'owner_invite_accept'; token?: string };
