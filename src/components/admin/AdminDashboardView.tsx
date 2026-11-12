import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  Crown,
  ShoppingBag,
  CreditCard,
  FileText,
  Ban,
  Plus,
  Gift,
  Receipt,
  UserCheck,
  Copy,
  Check,
  Lock,
  Search,
  LayoutDashboard,
  Server,
  Globe,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Eye,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import {
  UserProfile,
  NitroPlanConfig,
  CosmeticItem,
  CosmeticCategory,
  CosmeticRarity,
  TransactionRecord,
  AuditLogEntry,
  SystemConfigData,
  Community,
  OrbData,
  PlatformRole,
  GiftRecord,
  GiftDuration,
  OwnerInvitationRecord,
  ReceiptRecord,
  ReceiptType,
  ReceiptPaymentStatus,
  ReceiptDurationPreset,
  CustomDurationUnit,
  ReceiptLineItem,
} from '../../types';
import {
  ROOT_OWNER_UUID,
  isRootOwner,
  isSecondaryOwner,
  isAnyOwner,
  isAdminOrAbove,
  formatRoleLabel,
  generateInitialsAvatar,
  calculateReceiptDuration,
  getReceiptExpirationInfo,
  SECURITY_AUDIT_REPORT_DATA,
} from '../../lib/dataService';

interface AdminDashboardViewProps {
  currentUser: UserProfile;
  authToken: string | null;
  users: UserProfile[];
  communities: Community[];
  orbs: OrbData[];
  nitroPlans: NitroPlanConfig[];
  cosmetics: CosmeticItem[];
  transactions: TransactionRecord[];
  gifts: GiftRecord[];
  ownerInvitations: OwnerInvitationRecord[];
  receipts: ReceiptRecord[];
  auditLogs: AuditLogEntry[];
  systemConfig: SystemConfigData;
  onUpdateNitroPlan: (plan: NitroPlanConfig) => Promise<void>;
  onSaveCosmetic: (item: CosmeticItem) => Promise<void>;
  onDeleteCommunity: (communityId: string) => Promise<void>;
  onDeleteOrb: (orbId: string) => Promise<void>;
  onUpdateUserRole: (targetUid: string, newRole: PlatformRole) => Promise<void>;
  onUpdateSecondaryOwnerPermissions: (
    targetUid: string,
    perms: NonNullable<UserProfile['secondaryOwnerPermissions']>
  ) => Promise<void>;
  onModerateUser: (
    targetUid: string,
    action: 'ban' | 'unban' | 'suspend' | 'unsuspend'
  ) => Promise<void>;
  onGrantOrRevokeNitro: (
    targetUid: string,
    tier: 'free' | 'basic' | 'nitro'
  ) => Promise<void>;
  onGrantOrRevokeCosmetic: (
    targetUid: string,
    cosmeticId: string,
    mode: 'grant' | 'revoke'
  ) => Promise<void>;
  onCreateOwnerGift: (params: {
    apexTier: 'none' | 'basic' | 'nitro';
    cosmeticIds: string[];
    duration: GiftDuration;
    personalMessage: string;
    restrictedRecipientUsername?: string;
    restrictedRecipientEmail?: string;
  }) => Promise<GiftRecord>;
  onRevokeGift: (giftId: string) => Promise<void>;
  onCreateOwnerInvite: (
    email: string,
    invitedDisplayName?: string
  ) => Promise<OwnerInvitationRecord>;
  onRevokeOwnerInvite: (inviteId: string) => Promise<void>;
  onCreateManualReceipt: (
    receiptData: Omit<
      ReceiptRecord,
      'id' | 'receiptNumber' | 'accessToken' | 'auditHistory' | 'createdAt'
    >
  ) => Promise<ReceiptRecord>;
  onCorrectReceiptMetadata: (
    receiptId: string,
    newNotes: string,
    reason: string
  ) => Promise<void>;
  onOpenReceiptModal: (receipt: ReceiptRecord) => void;
  onRefundTransaction: (tx: TransactionRecord) => Promise<void>;
  onUpdateSystemConfig: (cfg: Partial<SystemConfigData>) => Promise<void>;
  onReturnHome?: () => void;
}

type AdminSectionId =
  | 'dashboard'
  | 'users'
  | 'owners'
  | 'moderation'
  | 'servers'
  | 'community_members'
  | 'orbs'
  | 'nitro_plans'
  | 'cosmetics'
  | 'gifts'
  | 'payments'
  | 'receipts'
  | 'security'
  | 'audit_logs'
  | 'system_settings';

type RevenueRange = '7d' | '30d' | '90d' | 'all';

interface NavGroupItem {
  id: AdminSectionId;
  label: string;
  group: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  visible: boolean;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  authToken,
  users,
  communities,
  orbs,
  nitroPlans,
  cosmetics,
  transactions,
  gifts,
  ownerInvitations,
  receipts,
  auditLogs,
  systemConfig,
  onUpdateNitroPlan,
  onSaveCosmetic,
  onDeleteCommunity,
  onDeleteOrb,
  onUpdateUserRole,
  onUpdateSecondaryOwnerPermissions,
  onModerateUser,
  onGrantOrRevokeNitro,
  onCreateOwnerGift,
  onRevokeGift,
  onCreateOwnerInvite,
  onRevokeOwnerInvite,
  onCreateManualReceipt,
  onCorrectReceiptMetadata,
  onOpenReceiptModal,
  onRefundTransaction,
  onUpdateSystemConfig,
  onReturnHome,
}) => {
  const isRoot = isRootOwner(currentUser);
  const isSecOwner = isSecondaryOwner(currentUser);
  const isOwner = isAnyOwner(currentUser);
  const secPerms = currentUser.secondaryOwnerPermissions || {
    canManageUsers: true,
    canManageCommunities: true,
    canManageApexPlans: false,
    canManageCosmetics: false,
    canCreateGifts: true,
    canManageReceipts: true,
    canProcessRefunds: false,
  };

  const canManagePricing =
    isRoot || (isSecOwner && secPerms.canManageApexPlans);
  const canManageCosmetics =
    isRoot || (isSecOwner && secPerms.canManageCosmetics);
  const canGrantEntitlements =
    isRoot || (isSecOwner && secPerms.canCreateGifts);
  const canViewRevenue =
    isRoot || isSecOwner || currentUser.role === 'admin';
  const canManageSysConfig = isRoot || isSecOwner;

  const [activeTab, setActiveTab] = useState<AdminSectionId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showNotificationsPopover, setShowNotificationsPopover] =
    useState(false);

  // Filters & Pagination
  const [globalSearch, setGlobalSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 8;

  // Revenue filter
  const [revenueRange, setRevenueRange] = useState<RevenueRange>('30d');

  // Detail Drawer state
  const [drawerItem, setDrawerItem] = useState<
    | { type: 'user'; data: UserProfile }
    | { type: 'community'; data: Community }
    | { type: 'orb'; data: OrbData }
    | { type: 'transaction'; data: TransactionRecord }
    | null
  >(null);

  // New Cosmetic Form
  const [newCosmeticName, setNewCosmeticName] = useState('');
  const [newCosmeticDesc, setNewCosmeticDesc] = useState('');
  const [newCosmeticCat, setNewCosmeticCat] =
    useState<CosmeticCategory>('Avatar Decorations');
  const [newCosmeticRarity, setNewCosmeticRarity] =
    useState<CosmeticRarity>('Epic');
  const [newCosmeticPrice, setNewCosmeticPrice] = useState('499');
  const [newCosmeticCss] = useState(
    'ring-2 ring-[#8957F5] shadow-[0_0_15px_rgba(137,87,245,0.6)]'
  );
  const [newCosmeticNitroFree] = useState<'none' | 'basic' | 'nitro'>('nitro');

  // Plan edit states
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editMonthlyInr, setEditMonthlyInr] = useState('');
  const [editYearlyInr, setEditYearlyInr] = useState('');

  // Owner Complimentary Gift Generator state
  const [giftApexTier, setGiftApexTier] = useState<'none' | 'basic' | 'nitro'>(
    'nitro'
  );
  const [giftSelectedCosmetics] = useState<string[]>([]);
  const [giftDuration, setGiftDuration] = useState<GiftDuration>('lifetime');
  const [giftMessage, setGiftMessage] = useState(
    'Complimentary Root Owner Sovereign Gift — Welcome to APEX+!'
  );
  const [giftRestrictUsername, setGiftRestrictUsername] = useState('');
  const [giftRestrictEmail] = useState('');
  const [createdGiftUrl, setCreatedGiftUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreatingGift, setIsCreatingGift] = useState(false);

  // Secondary Owner Invitation state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  // Manual Receipt Generator state
  const [showReceiptCreator, setShowReceiptCreator] = useState(false);
  const [rcpType] = useState<ReceiptType>('Complimentary Gift Receipt');
  const [rcpRecipientUid, setRcpRecipientUid] = useState('');
  const [rcpRecipientName, setRcpRecipientName] = useState('');
  const [rcpRecipientUsername, setRcpRecipientUsername] = useState('');
  const [rcpRecipientEmail, setRcpRecipientEmail] = useState('');
  const [rcpItemTitle, setRcpItemTitle] = useState(
    'Doomcord APEX+ Sovereign Membership'
  );
  const [rcpItemDesc] = useState(
    'Full platform privileges, 4K spatial streams, custom cosmetics, and zero limits.'
  );
  const [rcpUnitPriceInr] = useState('0');
  const [rcpDiscountInr] = useState('0');
  const [rcpPaymentStatus] = useState<ReceiptPaymentStatus>('Complimentary');
  const [rcpDurationPreset, setRcpDurationPreset] =
    useState<ReceiptDurationPreset>('lifetime');
  const [rcpCustomValue] = useState('30');
  const [rcpCustomUnit] = useState<CustomDurationUnit>('days');
  const [rcpNotes] = useState('Issued directly by Root Owner authority.');
  const [rcpSearchFilter] = useState('');
  const [rcpTypeFilter] = useState<string>('all');
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

  // Receipt Correction Modal state
  const [correctingReceipt, setCorrectingReceipt] =
    useState<ReceiptRecord | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');

  // Real-time Server Metrics from Backend
  const [serverStats, setServerStats] = useState<{
    status: string;
    totalVerifiedRevenuePaise: number;
    totalVerifiedTransactions: number;
    recentReceiptsCount: number;
    securityControls: string[];
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchServerMetrics = async () => {
      if (!authToken) return;
      try {
        const res = await fetch('/api/admin/metrics', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (res.ok && mounted) {
          const data = await res.json();
          setServerStats(data);
        }
      } catch {
        // Fallback to local Firestore snapshot metrics if offline
      }
    };
    fetchServerMetrics();
    return () => {
      mounted = false;
    };
  }, [authToken, transactions.length]);

  const navItems: NavGroupItem[] = useMemo(
    () => [
      // OVERVIEW
      {
        id: 'dashboard',
        label: 'Dashboard',
        group: 'OVERVIEW',
        icon: LayoutDashboard,
        visible: true,
      },
      // PEOPLE
      {
        id: 'users',
        label: 'Users',
        group: 'PEOPLE',
        icon: Users,
        visible: true,
      },
      {
        id: 'owners',
        label: 'Owners',
        group: 'PEOPLE',
        icon: Crown,
        visible: isRoot || isSecOwner,
      },
      {
        id: 'moderation',
        label: 'Moderation',
        group: 'PEOPLE',
        icon: Ban,
        visible: true,
      },
      // COMMUNITIES
      {
        id: 'servers',
        label: 'Servers',
        group: 'COMMUNITIES',
        icon: Server,
        visible: true,
      },
      {
        id: 'community_members',
        label: 'Members',
        group: 'COMMUNITIES',
        icon: UserCheck,
        visible: true,
      },
      {
        id: 'orbs',
        label: 'Orbs',
        group: 'COMMUNITIES',
        icon: Globe,
        visible: true,
      },
      // MONETIZATION
      {
        id: 'nitro_plans',
        label: 'APEX Plans',
        group: 'MONETIZATION',
        icon: Sparkles,
        visible: canManagePricing,
      },
      {
        id: 'cosmetics',
        label: 'Cosmetics',
        group: 'MONETIZATION',
        icon: ShoppingBag,
        visible: canManageCosmetics,
      },
      {
        id: 'gifts',
        label: 'Gift Management',
        group: 'MONETIZATION',
        icon: Gift,
        visible: canGrantEntitlements,
      },
      {
        id: 'payments',
        label: 'Payments',
        group: 'MONETIZATION',
        icon: CreditCard,
        visible: canViewRevenue,
      },
      {
        id: 'receipts',
        label: 'Receipts',
        group: 'MONETIZATION',
        icon: Receipt,
        visible: true,
      },
      // SYSTEM
      {
        id: 'security',
        label: 'Security',
        group: 'SYSTEM',
        icon: Shield,
        visible: true,
      },
      {
        id: 'audit_logs',
        label: 'Audit Logs',
        group: 'SYSTEM',
        icon: FileText,
        visible: true,
      },
      {
        id: 'system_settings',
        label: 'Settings',
        group: 'SYSTEM',
        icon: Settings,
        visible: canManageSysConfig || isOwner,
      },
    ],
    [
      isRoot,
      isSecOwner,
      canManagePricing,
      canManageCosmetics,
      canGrantEntitlements,
      canViewRevenue,
      canManageSysConfig,
      isOwner,
    ]
  );

  // Client-side RBAC check using isAdminOrAbove(currentUser)
  if (!isAdminOrAbove(currentUser)) {
    return (
      <div
        data-testid="admin-access-denied"
        className="flex-1 flex flex-col items-center justify-center bg-[#09080F] text-[#F5F3FA] p-8 select-none doom-ambient-bg"
      >
        <div className="max-w-md w-full doom-glass-strong rounded-3xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400">
            <Lock size={32} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F5F3FA] mb-2">
            Access Denied — Restricted Governance Zone
          </h1>
          <p className="text-sm text-[#A19DAD] leading-relaxed mb-6">
            Your account (
            <span className="text-[#F5F3FA] font-semibold">
              @{currentUser.username}
            </span>
            ) has the{' '}
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-white/5 text-[#C4B1FF] border border-white/10">
              {formatRoleLabel(currentUser.role, currentUser.uid)}
            </span>{' '}
            role and is not authorized to view or operate the Doomcord
            Administration Panel.
          </p>
          <div className="text-[11px] font-mono uppercase tracking-widest text-rose-400/90 bg-rose-950/30 border border-rose-500/20 rounded-xl py-2.5 px-4">
            OWASP ASVS V4.1 Access Control Enforced
          </div>
          {onReturnHome && (
            <button
              onClick={onReturnHome}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#8957F5] hover:bg-[#A47BFF] text-white text-xs font-bold transition-colors"
            >
              Return to Doomcord Home
            </button>
          )}
        </div>
      </div>
    );
  }

  // Verified revenue calculations
  const verifiedTransactions = transactions.filter(
    (t) =>
      (t.status === 'verified' || t.status === 'captured') &&
      t.type !== 'admin_grant' &&
      t.amountINR > 0
  );

  const rangeThresholdMs = useMemo(() => {
    const now = Date.now();
    if (revenueRange === '7d') return now - 7 * 86400 * 1000;
    if (revenueRange === '30d') return now - 30 * 86400 * 1000;
    if (revenueRange === '90d') return now - 90 * 86400 * 1000;
    return 0;
  }, [revenueRange]);

  const filteredRevenueTransactions = verifiedTransactions.filter(
    (tx) => new Date(tx.createdAt).getTime() >= rangeThresholdMs
  );

  const totalRevenueInr = verifiedTransactions.reduce(
    (acc, t) => acc + (t.amountINR || 0),
    0
  );

  const rangeRevenueInr = filteredRevenueTransactions.reduce(
    (acc, t) => acc + (t.amountINR || 0),
    0
  );

  const activeSubscribersCount = users.filter(
    (u) => u.nitroTier === 'basic' || u.nitroTier === 'nitro'
  ).length;

  // Build 7-bucket chart points for the interactive revenue graph
  const chartPoints = useMemo(() => {
    const buckets = [
      { label: 'P1', value: 0 },
      { label: 'P2', value: 0 },
      { label: 'P3', value: 0 },
      { label: 'P4', value: 0 },
      { label: 'P5', value: 0 },
      { label: 'P6', value: 0 },
      { label: 'Now', value: 0 },
    ];
    if (filteredRevenueTransactions.length === 0) {
      return buckets.map((b, idx) => ({
        label: b.label,
        value: totalRevenueInr > 0 && idx === 6 ? totalRevenueInr : 0,
      }));
    }
    const now = Date.now();
    const span =
      revenueRange === '7d'
        ? 7 * 86400 * 1000
        : revenueRange === '30d'
        ? 30 * 86400 * 1000
        : revenueRange === '90d'
        ? 90 * 86400 * 1000
        : Math.max(
            30 * 86400 * 1000,
            now -
              Math.min(
                ...filteredRevenueTransactions.map((t) =>
                  new Date(t.createdAt).getTime()
                )
              )
          );
    const step = span / 7;
    const start = now - span;
    filteredRevenueTransactions.forEach((tx) => {
      const ts = new Date(tx.createdAt).getTime();
      const idx = Math.min(6, Math.max(0, Math.floor((ts - start) / step)));
      buckets[idx].value += tx.amountINR || 0;
    });
    return buckets;
  }, [filteredRevenueTransactions, revenueRange, totalRevenueInr]);

  const maxChartVal = Math.max(100, ...chartPoints.map((p) => p.value));

  const effectiveSearch = (userSearch || globalSearch).trim().toLowerCase();

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !effectiveSearch ||
      u.displayName.toLowerCase().includes(effectiveSearch) ||
      u.username.toLowerCase().includes(effectiveSearch) ||
      (u.email || '').toLowerCase().includes(effectiveSearch) ||
      u.uid.toLowerCase().includes(effectiveSearch);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUserPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  );
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * USERS_PER_PAGE,
    userPage * USERS_PER_PAGE
  );

  const filteredReceipts = receipts.filter((r) => {
    const q = (rcpSearchFilter || globalSearch).trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.receiptNumber.toLowerCase().includes(q) ||
      r.customerDisplayName.toLowerCase().includes(q) ||
      r.customerUsername.toLowerCase().includes(q) ||
      (r.customerEmail || '').toLowerCase().includes(q);
    const matchesType =
      rcpTypeFilter === 'all' || r.receiptType === rcpTypeFilter;
    return matchesSearch && matchesType;
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSavePlanEdit = async (plan: NitroPlanConfig) => {
    const mInr = parseInt(editMonthlyInr, 10);
    const yInr = parseInt(editYearlyInr, 10);
    if (isNaN(mInr) || isNaN(yInr)) return;
    await onUpdateNitroPlan({
      ...plan,
      monthlyPriceINR: mInr,
      yearlyPriceINR: yInr,
    });
    setEditingPlanId(null);
  };

  const handleAddCosmetic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCosmeticName.trim()) return;
    const item: CosmeticItem = {
      id: `cosm_${Date.now()}`,
      name: newCosmeticName.trim(),
      description: newCosmeticDesc.trim() || 'Exclusive Sovereign Cosmetic',
      category: newCosmeticCat,
      rarity: newCosmeticRarity,
      priceINR: parseInt(newCosmeticPrice, 10) || 299,
      nitroEligible: newCosmeticNitroFree,
      cssPreviewClass: newCosmeticCss,
      previewColorPrimary: '#8957F5',
      previewColorSecondary: '#A47BFF',
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    await onSaveCosmetic(item);
    setNewCosmeticName('');
    setNewCosmeticDesc('');
  };

  const handleGenerateOwnerGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (giftApexTier === 'none' && giftSelectedCosmetics.length === 0) return;
    setIsCreatingGift(true);
    try {
      const gift = await onCreateOwnerGift({
        apexTier: giftApexTier,
        cosmeticIds: giftSelectedCosmetics,
        duration: giftDuration,
        personalMessage: giftMessage,
        restrictedRecipientUsername: giftRestrictUsername.trim() || undefined,
        restrictedRecipientEmail: giftRestrictEmail.trim() || undefined,
      });
      const token = gift.claimToken || gift.tokenPreview;
      const url = `${window.location.origin}/?gift=${token}`;
      setCreatedGiftUrl(url);
    } finally {
      setIsCreatingGift(false);
    }
  };

  const handleGenerateOwnerInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsCreatingInvite(true);
    try {
      const inv = await onCreateOwnerInvite(
        inviteEmail.trim(),
        inviteDisplayName.trim() || undefined
      );
      const token = inv.inviteToken || inv.tokenPreview;
      const url = `${window.location.origin}/?owner_invite=${token}`;
      setCreatedInviteUrl(url);
      setInviteEmail('');
      setInviteDisplayName('');
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleSelectRecipientPreset = (uid: string) => {
    setRcpRecipientUid(uid);
    const found = users.find((u) => u.uid === uid);
    if (found) {
      setRcpRecipientName(found.displayName);
      setRcpRecipientUsername(found.username);
      setRcpRecipientEmail(found.email || '');
    }
  };

  const handleCreateReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcpRecipientName.trim() || !rcpItemTitle.trim()) return;
    setIsSubmittingReceipt(true);
    try {
      const issuedIso = new Date().toISOString();
      const customVal = parseInt(rcpCustomValue, 10) || 30;
      const durationInfo = calculateReceiptDuration(
        rcpDurationPreset,
        issuedIso,
        customVal,
        rcpCustomUnit
      );

      const unitPriceINR = Math.max(0, Math.round(parseFloat(rcpUnitPriceInr) || 0));
      const discountINR = Math.max(0, Math.round(parseFloat(rcpDiscountInr) || 0));
      const subtotalINR = unitPriceINR;
      const totalAmountINR =
        rcpPaymentStatus === 'Complimentary'
          ? 0
          : Math.max(0, subtotalINR - discountINR);

      const lineItem: ReceiptLineItem = {
        id: `item_${Date.now()}`,
        productName: rcpItemTitle.trim(),
        category: 'APEX Entitlement',
        quantity: 1,
        unitPriceINR,
        discountINR:
          rcpPaymentStatus === 'Complimentary' ? unitPriceINR : discountINR,
        finalAmountINR: totalAmountINR,
        durationPreset: rcpDurationPreset,
        customDurationValue:
          rcpDurationPreset === 'custom' ? customVal : undefined,
        customDurationUnit:
          rcpDurationPreset === 'custom' ? rcpCustomUnit : undefined,
        durationLabel: durationInfo.durationLabel,
        serviceStartDate: durationInfo.serviceStartDate,
        serviceExpiryDate: durationInfo.serviceExpiryDate,
      };

      const created = await onCreateManualReceipt({
        receiptType: rcpType,
        title: rcpItemTitle.trim(),
        description: rcpItemDesc.trim(),
        customerUid: rcpRecipientUid || currentUser.uid,
        customerDisplayName: rcpRecipientName.trim(),
        customerUsername: rcpRecipientUsername.trim() || 'sovereign_citizen',
        customerEmail: rcpRecipientEmail.trim() || 'citizen@doomcord.local',
        items: [lineItem],
        currency: 'INR',
        subtotalINR,
        discountTotalINR:
          rcpPaymentStatus === 'Complimentary' ? unitPriceINR : discountINR,
        taxINR: 0,
        totalAmountINR,
        paymentStatus: rcpPaymentStatus,
        paymentMethod:
          rcpPaymentStatus === 'Complimentary'
            ? 'Root Owner Sovereign Grant (₹0 Complimentary)'
            : 'Razorpay Verified Settlement',
        transactionId: `TX-MANUAL-${Date.now()}`,
        issueDate: issuedIso,
        serviceStartDate: durationInfo.serviceStartDate,
        serviceExpiryDate: durationInfo.serviceExpiryDate,
        serviceDurationLabel: durationInfo.durationLabel,
        notes: rcpNotes.trim(),
        issuerUid: currentUser.uid,
        issuerName: currentUser.displayName,
        issuerEmail: currentUser.email,
        issuerRole: currentUser.role,
      });

      setShowReceiptCreator(false);
      onOpenReceiptModal(created);
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  const handleSaveReceiptCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingReceipt || !correctionReason.trim()) return;
    await onCorrectReceiptMetadata(
      correctingReceipt.id,
      correctionNotes,
      correctionReason
    );
    setCorrectingReceipt(null);
    setCorrectionNotes('');
    setCorrectionReason('');
  };

  const activeNavMeta =
    navItems.find((item) => item.id === activeTab) || navItems[0];

  const groupsOrder = [
    'OVERVIEW',
    'PEOPLE',
    'COMMUNITIES',
    'MONETIZATION',
    'SYSTEM',
  ];

  const renderSidebarNavigation = (isMobile = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Sidebar Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#15111F] border border-[#8957F5]/40 flex items-center justify-center shrink-0 doom-purple-glow overflow-hidden">
            <img
              src="/assets/aistudio/doomcord-icon_378efdf9.png"
              alt="Doomcord"
              className="w-6 h-6 object-contain"
            />
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <div className="min-w-0">
              <div className="text-sm font-black tracking-tight text-[#F5F3FA] truncate">
                DOOMCORD
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#C4B1FF] truncate">
                ADMINISTRATION
              </div>
            </div>
          )}
        </div>
        {isMobile ? (
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-[#A19DAD] hover:text-[#F5F3FA] hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="p-1.5 rounded-lg text-[#A19DAD] hover:text-[#F5F3FA] hover:bg-white/10 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2.5 space-y-5">
        {groupsOrder.map((groupName) => {
          const items = navItems.filter(
            (i) => i.group === groupName && i.visible
          );
          if (items.length === 0) return null;
          return (
            <div key={groupName}>
              {(!sidebarCollapsed || isMobile) && (
                <div className="px-2.5 mb-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-[#777180]">
                  {groupName}
                </div>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (isMobile) setMobileDrawerOpen(false);
                      }}
                      title={
                        sidebarCollapsed && !isMobile ? item.label : undefined
                      }
                      className={`w-full flex items-center ${
                        sidebarCollapsed && !isMobile
                          ? 'justify-center px-2 py-2.5'
                          : 'gap-3 px-3 py-2'
                      } rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#8957F5]/20 text-[#F5F3FA] border border-[#8957F5]/45 shadow-[0_0_20px_rgba(137,87,245,0.22)]'
                          : 'text-[#A19DAD] hover:text-[#F5F3FA] hover:bg-white/[0.045] border border-transparent'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={
                          isActive
                            ? 'text-[#C4B1FF] shrink-0'
                            : 'text-[#A19DAD] shrink-0'
                        }
                      />
                      {(!sidebarCollapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer — Active Owner Identity */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <div
          className={`doom-glass rounded-xl p-2.5 flex items-center ${
            sidebarCollapsed && !isMobile ? 'justify-center' : 'gap-2.5'
          }`}
        >
          <img
            src={
              currentUser.photoURL ||
              generateInitialsAvatar(currentUser.displayName)
            }
            alt={currentUser.displayName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-[#8957F5]/50 shrink-0"
          />
          {(!sidebarCollapsed || isMobile) && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#F5F3FA] truncate">
                {currentUser.displayName}
              </div>
              <div className="text-[10px] font-mono text-[#C4B1FF] truncate">
                {formatRoleLabel(currentUser.role, currentUser.uid)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex h-full bg-[#09080F] text-[#F5F3FA] overflow-hidden doom-ambient-bg relative">
      {/* Desktop Vertical Glass Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 doom-glass-sidebar transition-all duration-200 z-20 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[252px]'
        }`}
      >
        {renderSidebarNavigation(false)}
      </aside>

      {/* Mobile Glass Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative w-72 max-w-[84vw] h-full doom-glass-strong z-10 flex flex-col">
            {renderSidebarNavigation(true)}
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Translucent Glass Admin Header */}
        <header className="h-16 px-4 md:px-6 doom-glass-header flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl doom-glass text-[#F5F3FA]"
              aria-label="Open admin navigation"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#A19DAD]">
                <span>Administration</span>
                <span>/</span>
                <span className="text-[#777180]">{activeNavMeta.group}</span>
                <span>/</span>
                <span className="text-[#C4B1FF]">{activeNavMeta.label}</span>
              </div>
              <h1 className="text-base md:text-lg font-extrabold tracking-tight text-[#F5F3FA] truncate">
                {activeNavMeta.label}
              </h1>
            </div>
          </div>

          {/* Header Controls: Search, Notifications, Owner Identity, Security Status */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative hidden sm:block w-52 lg:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A19DAD]"
              />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setUserPage(1);
                }}
                placeholder="Search users, receipts, logs..."
                className="w-full bg-[#15111F]/90 border border-white/12 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#F5F3FA] placeholder-[#777180] focus:outline-none focus:border-[#8957F5]"
              />
            </div>

            {/* Security Status Badge */}
            <button
              onClick={() => setActiveTab('security')}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#8957F5]/15 border border-[#8957F5]/35 text-[11px] font-mono text-[#C4B1FF] hover:bg-[#8957F5]/25 transition-colors"
              title="Security posture verified"
            >
              <span className="w-2 h-2 rounded-full bg-[#A47BFF] animate-pulse" />
              <span>ASVS L2 SECURE</span>
            </button>

            {/* Notifications Popover Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsPopover((p) => !p)}
                className="p-2 rounded-xl doom-glass text-[#A19DAD] hover:text-[#F5F3FA] relative"
                aria-label="Admin notifications"
              >
                <Bell size={16} />
                {auditLogs.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#8957F5] absolute top-1.5 right-1.5" />
                )}
              </button>
              {showNotificationsPopover && (
                <div className="absolute right-0 mt-2 w-80 doom-glass-strong rounded-2xl p-4 z-50 shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C4B1FF]">
                      Governance Alerts
                    </span>
                    <button
                      onClick={() => setShowNotificationsPopover(false)}
                      className="text-[#A19DAD] hover:text-[#F5F3FA]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-[#15111F]/90 border border-white/10 text-xs"
                      >
                        <div className="font-mono text-[10px] text-[#C4B1FF]">
                          {log.action}
                        </div>
                        <div className="text-[#A19DAD] truncate mt-0.5">
                          {log.details}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main Owner Identity Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl doom-glass">
              <Crown size={14} className="text-[#C4B1FF]" />
              <span className="text-xs font-semibold text-[#F5F3FA]">
                {isRoot
                  ? 'Root Owner'
                  : formatRoleLabel(currentUser.role, currentUser.uid)}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Workspace Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8 space-y-6">
          {/* ========================================================= */}
          {/* 1. OVERVIEW -> DASHBOARD                                  */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Compact 6-metric Glass Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                <div className="doom-glass rounded-2xl p-4">
                  <div className="text-[11px] font-medium text-[#A19DAD] flex items-center justify-between">
                    <span>Registered Users</span>
                    <Users size={14} className="text-[#A47BFF]" />
                  </div>
                  <div className="text-2xl font-black text-[#F5F3FA] mt-2 tabular-nums">
                    {users.length}
                  </div>
                  <div className="text-[11px] text-[#C4B1FF] mt-1 font-mono">
                    {users.filter((u) => u.presence === 'online').length} online
                    now
                  </div>
                </div>

                <div className="doom-glass rounded-2xl p-4">
                  <div className="text-[11px] font-medium text-[#A19DAD] flex items-center justify-between">
                    <span>Active Communities</span>
                    <Server size={14} className="text-[#A47BFF]" />
                  </div>
                  <div className="text-2xl font-black text-[#F5F3FA] mt-2 tabular-nums">
                    {communities.length}
                  </div>
                  <div className="text-[11px] text-[#A19DAD] mt-1 font-mono">
                    Real-time servers
                  </div>
                </div>

                <div className="doom-glass rounded-2xl p-4">
                  <div className="text-[11px] font-medium text-[#A19DAD] flex items-center justify-between">
                    <span>Total Orbs</span>
                    <Globe size={14} className="text-[#A47BFF]" />
                  </div>
                  <div className="text-2xl font-black text-[#F5F3FA] mt-2 tabular-nums">
                    {orbs.length}
                  </div>
                  <div className="text-[11px] text-[#A19DAD] mt-1 font-mono">
                    Spatial hubs
                  </div>
                </div>

                <div className="doom-glass rounded-2xl p-4">
                  <div className="text-[11px] font-medium text-[#A19DAD] flex items-center justify-between">
                    <span>Active APEX Members</span>
                    <Crown size={14} className="text-[#C4B1FF]" />
                  </div>
                  <div className="text-2xl font-black text-[#F5F3FA] mt-2 tabular-nums">
                    {activeSubscribersCount}
                  </div>
                  <div className="text-[11px] text-[#C4B1FF] mt-1 font-mono">
                    APEX & APEX+ tiers
                  </div>
                </div>

                <div className="doom-glass rounded-2xl p-4">
                  <div className="text-[11px] font-medium text-[#A19DAD] flex items-center justify-between">
                    <span>Verified Revenue</span>
                    <CreditCard size={14} className="text-[#A47BFF]" />
                  </div>
                  <div className="text-2xl font-black text-[#F5F3FA] mt-2 tabular-nums">
                    ₹
                    {serverStats
                      ? (
                          serverStats.totalVerifiedRevenuePaise / 100
                        ).toLocaleString()
                      : totalRevenueInr.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#A19DAD] mt-1 font-mono">
                    {verifiedTransactions.length} paid orders
                  </div>
                </div>

                <div className="doom-glass rounded-2xl p-4">
                  <div className="text-[11px] font-medium text-[#A19DAD] flex items-center justify-between">
                    <span>Issued Receipts</span>
                    <Receipt size={14} className="text-[#A47BFF]" />
                  </div>
                  <div className="text-2xl font-black text-[#F5F3FA] mt-2 tabular-nums">
                    {receipts.length}
                  </div>
                  <div className="text-[11px] text-[#A19DAD] mt-1 font-mono">
                    {gifts.length} gifts issued
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="doom-glass rounded-2xl p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                  <div>
                    <h2 className="text-sm font-bold text-[#F5F3FA]">
                      Quick Governance Actions
                    </h2>
                    <p className="text-xs text-[#A19DAD]">
                      Direct shortcuts to high-priority administrative operations
                    </p>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C4B1FF]">
                    DOOMCORD SOVEREIGN CONSOLE
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <button
                    onClick={() => setActiveTab('owners')}
                    className="p-3 rounded-xl doom-glass-elevated hover:border-[#8957F5]/50 text-left transition-all group"
                  >
                    <UserCheck
                      size={16}
                      className="text-[#C4B1FF] mb-1.5 group-hover:scale-110 transition-transform"
                    />
                    <div className="text-xs font-bold text-[#F5F3FA]">
                      Create Owner Invite
                    </div>
                    <div className="text-[10px] text-[#A19DAD] mt-0.5">
                      Appoint secondary owner
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('gifts')}
                    className="p-3 rounded-xl doom-glass-elevated hover:border-[#8957F5]/50 text-left transition-all group"
                  >
                    <Gift
                      size={16}
                      className="text-[#C4B1FF] mb-1.5 group-hover:scale-110 transition-transform"
                    />
                    <div className="text-xs font-bold text-[#F5F3FA]">
                      Complimentary Gift
                    </div>
                    <div className="text-[10px] text-[#A19DAD] mt-0.5">
                      ₹0 instant APEX+ link
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('users')}
                    className="p-3 rounded-xl doom-glass-elevated hover:border-[#8957F5]/50 text-left transition-all group"
                  >
                    <Users
                      size={16}
                      className="text-[#C4B1FF] mb-1.5 group-hover:scale-110 transition-transform"
                    />
                    <div className="text-xs font-bold text-[#F5F3FA]">
                      Manage Users
                    </div>
                    <div className="text-[10px] text-[#A19DAD] mt-0.5">
                      Roles & entitlements
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('receipts');
                      setShowReceiptCreator(true);
                    }}
                    className="p-3 rounded-xl doom-glass-elevated hover:border-[#8957F5]/50 text-left transition-all group"
                  >
                    <Receipt
                      size={16}
                      className="text-[#C4B1FF] mb-1.5 group-hover:scale-110 transition-transform"
                    />
                    <div className="text-xs font-bold text-[#F5F3FA]">
                      Create Receipt
                    </div>
                    <div className="text-[10px] text-[#A19DAD] mt-0.5">
                      Official verifiable doc
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('nitro_plans')}
                    className="p-3 rounded-xl doom-glass-elevated hover:border-[#8957F5]/50 text-left transition-all group"
                  >
                    <Sparkles
                      size={16}
                      className="text-[#C4B1FF] mb-1.5 group-hover:scale-110 transition-transform"
                    />
                    <div className="text-xs font-bold text-[#F5F3FA]">
                      Configure APEX
                    </div>
                    <div className="text-[10px] text-[#A19DAD] mt-0.5">
                      Plans & INR pricing
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('audit_logs')}
                    className="p-3 rounded-xl doom-glass-elevated hover:border-[#8957F5]/50 text-left transition-all group"
                  >
                    <Shield
                      size={16}
                      className="text-[#C4B1FF] mb-1.5 group-hover:scale-110 transition-transform"
                    />
                    <div className="text-xs font-bold text-[#F5F3FA]">
                      Security Logs
                    </div>
                    <div className="text-[10px] text-[#A19DAD] mt-0.5">
                      Review audit trail
                    </div>
                  </button>
                </div>
              </div>

              {/* Revenue Analytics & Security Overview Split */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Interactive Revenue Analytics (2 cols on xl) */}
                <div className="xl:col-span-2 doom-glass rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-[#A47BFF]" />
                        <h3 className="text-sm font-bold text-[#F5F3FA]">
                          Revenue Analytics & Verified Settlement
                        </h3>
                      </div>
                      <p className="text-xs text-[#A19DAD] mt-0.5">
                        Real-time Razorpay HMAC-SHA256 verified transactions
                        (excludes ₹0 owner grants)
                      </p>
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-[#15111F] border border-white/10 self-start">
                      {(
                        [
                          { id: '7d', label: '7-day' },
                          { id: '30d', label: '30-day' },
                          { id: '90d', label: '90-day' },
                          { id: 'all', label: 'All-time' },
                        ] as { id: RevenueRange; label: string }[]
                      ).map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setRevenueRange(f.id)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                            revenueRange === f.id
                              ? 'bg-[#8957F5] text-white shadow'
                              : 'text-[#A19DAD] hover:text-[#F5F3FA]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Period KPI summary */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="p-3 rounded-xl bg-[#15111F]/90 border border-white/10">
                      <div className="text-[11px] text-[#A19DAD]">
                        Selected Period Revenue
                      </div>
                      <div className="text-lg font-black text-[#F5F3FA] mt-0.5 tabular-nums">
                        ₹{rangeRevenueInr.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#15111F]/90 border border-white/10">
                      <div className="text-[11px] text-[#A19DAD]">
                        Verified Transactions
                      </div>
                      <div className="text-lg font-black text-[#C4B1FF] mt-0.5 tabular-nums">
                        {filteredRevenueTransactions.length}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#15111F]/90 border border-white/10">
                      <div className="text-[11px] text-[#A19DAD]">
                        Complimentary Grants
                      </div>
                      <div className="text-lg font-black text-[#A19DAD] mt-0.5 tabular-nums">
                        {
                          transactions.filter((t) => t.type === 'admin_grant')
                            .length
                        }{' '}
                        (₹0)
                      </div>
                    </div>
                  </div>

                  {/* Interactive Bar/Area Chart */}
                  <div className="h-44 bg-[#15111F]/80 border border-white/10 rounded-xl p-4 flex items-end justify-between gap-3">
                    {chartPoints.map((pt, i) => {
                      const heightPct = Math.max(
                        10,
                        Math.round((pt.value / maxChartVal) * 100)
                      );
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center justify-end h-full group"
                        >
                          <div className="text-[10px] font-mono text-[#C4B1FF] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                            ₹{pt.value.toLocaleString()}
                          </div>
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-[#8957F5]/40 via-[#8957F5]/80 to-[#C4B1FF] border-t border-[#C4B1FF] transition-all duration-300 group-hover:brightness-125"
                          />
                          <div className="text-[10px] font-mono text-[#A19DAD] mt-2">
                            {pt.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Security Overview Card */}
                <div className="doom-glass rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-[#C4B1FF]" />
                        <h3 className="text-sm font-bold text-[#F5F3FA]">
                          Security Overview
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#8957F5]/20 text-[#C4B1FF] border border-[#8957F5]/40">
                        ACTIVE
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-[#15111F]/90 border border-white/10 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#F5F3FA]">
                            Authentication Status
                          </div>
                          <div className="text-[11px] text-[#A19DAD]">
                            TOTP 2FA, WebAuthn & Passkeys
                          </div>
                        </div>
                        <CheckCircle2 size={16} className="text-[#C4B1FF]" />
                      </div>

                      <div className="p-3 rounded-xl bg-[#15111F]/90 border border-white/10 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#F5F3FA]">
                            Root Owner Protection
                          </div>
                          <div className="text-[11px] text-[#A19DAD] font-mono">
                            UUID {ROOT_OWNER_UUID.slice(0, 8)}...
                          </div>
                        </div>
                        <CheckCircle2 size={16} className="text-[#C4B1FF]" />
                      </div>

                      <div className="p-3 rounded-xl bg-[#15111F]/90 border border-white/10 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#F5F3FA]">
                            Payment Configuration
                          </div>
                          <div className="text-[11px] text-[#A19DAD]">
                            Razorpay HMAC-SHA256 Server Verify
                          </div>
                        </div>
                        <CheckCircle2 size={16} className="text-[#C4B1FF]" />
                      </div>

                      <div className="p-3 rounded-xl bg-[#15111F]/90 border border-white/10 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#F5F3FA]">
                            Audit Status
                          </div>
                          <div className="text-[11px] text-[#A19DAD]">
                            {auditLogs.length} immutable events recorded
                          </div>
                        </div>
                        <CheckCircle2 size={16} className="text-[#C4B1FF]" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('security')}
                    className="mt-4 w-full py-2.5 rounded-xl bg-[#8957F5]/20 hover:bg-[#8957F5]/30 border border-[#8957F5]/40 text-xs font-bold text-[#C4B1FF] transition-colors"
                  >
                    Open Full OWASP Security Audit
                  </button>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className="doom-glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F3FA]">
                      Recent Platform Activity
                    </h3>
                    <p className="text-xs text-[#A19DAD]">
                      Latest administrative actions, role updates, gifts, and
                      security events
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('audit_logs')}
                    className="text-xs font-semibold text-[#C4B1FF] hover:underline"
                  >
                    View all ({auditLogs.length})
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-[#A19DAD]">
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">Actor</th>
                        <th className="py-2.5 px-4">Action</th>
                        <th className="py-2.5 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {auditLogs.slice(0, 6).map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-[#A19DAD] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-[#F5F3FA]">
                            {log.actorEmail}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#8957F5]/15 text-[#C4B1FF] border border-[#8957F5]/30">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#A19DAD]">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-6 text-center text-xs text-[#777180]"
                          >
                            No recent administrative events logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. PEOPLE -> USERS                                        */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              {/* Filter Bar */}
              <div className="doom-glass rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A19DAD]"
                  />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Filter by username, display name, email, or UUID..."
                    className="w-full bg-[#15111F] border border-white/12 rounded-xl pl-9 pr-4 py-2 text-xs text-[#F5F3FA] placeholder-[#777180] focus:outline-none focus:border-[#8957F5]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-[#A19DAD]" />
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                    className="bg-[#15111F] border border-white/12 rounded-xl px-3 py-2 text-xs text-[#F5F3FA] focus:outline-none focus:border-[#8957F5]"
                  >
                    <option value="all">All Roles ({users.length})</option>
                    <option value="root_owner">Root Owner</option>
                    <option value="secondary_owner">Secondary Owners</option>
                    <option value="admin">Admins</option>
                    <option value="moderator">Moderators</option>
                    <option value="member">Members</option>
                  </select>
                </div>
              </div>

              {/* Readable Solid-Surface User Table inside Glass Frame */}
              <div className="doom-glass rounded-2xl p-4">
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-[#A19DAD]">
                        <th className="py-3 px-4">User Identity</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">APEX Membership</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {paginatedUsers.map((u) => {
                        const targetIsRoot = isRootOwner(u);
                        const targetIsSecOwner = isSecondaryOwner(u);
                        const canModifyTarget =
                          !targetIsRoot &&
                          (isRoot ||
                            (isSecOwner &&
                              !targetIsSecOwner &&
                              secPerms.canManageUsers) ||
                            (currentUser.role === 'admin' &&
                              !isAnyOwner(u) &&
                              u.role !== 'admin'));

                        return (
                          <tr key={u.uid} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    u.photoURL ||
                                    generateInitialsAvatar(u.displayName)
                                  }
                                  alt={u.displayName}
                                  className="w-9 h-9 rounded-full object-cover border border-white/15 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-[#F5F3FA] flex items-center gap-1.5">
                                    <span className="truncate">
                                      {u.displayName}
                                    </span>
                                    {targetIsRoot && (
                                      <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-[#8957F5]/25 text-[#C4B1FF] border border-[#8957F5]/50 rounded">
                                        ROOT OWNER
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#A19DAD] font-mono truncate">
                                    @{u.username} {u.email ? `· ${u.email}` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {targetIsRoot ? (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#8957F5]/20 text-[#C4B1FF] border border-[#8957F5]/40">
                                  Immutable Root Owner
                                </span>
                              ) : (
                                <select
                                  disabled={!canModifyTarget}
                                  value={u.role}
                                  onChange={(e) =>
                                    onUpdateUserRole(
                                      u.uid,
                                      e.target.value as PlatformRole
                                    )
                                  }
                                  className="bg-[#09080F] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#F5F3FA] disabled:opacity-50"
                                >
                                  {isRoot && (
                                    <option value="secondary_owner">
                                      Secondary Owner
                                    </option>
                                  )}
                                  <option value="admin">Admin</option>
                                  <option value="moderator">Moderator</option>
                                  <option value="member">Member</option>
                                </select>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {targetIsRoot ? (
                                <span className="text-xs font-bold text-[#C4B1FF]">
                                  Permanent APEX+
                                </span>
                              ) : (
                                <select
                                  disabled={!canGrantEntitlements}
                                  value={u.nitroTier || 'free'}
                                  onChange={(e) =>
                                    onGrantOrRevokeNitro(
                                      u.uid,
                                      e.target.value as
                                        | 'free'
                                        | 'basic'
                                        | 'nitro'
                                    )
                                  }
                                  className="bg-[#09080F] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-[#F5F3FA] disabled:opacity-50"
                                >
                                  <option value="free">Free Tier</option>
                                  <option value="basic">APEX Basic</option>
                                  <option value="nitro">APEX+ Sovereign</option>
                                </select>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {u.isBanned ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Banned
                                </span>
                              ) : u.isSuspended ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Suspended
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#8957F5]/15 text-[#C4B1FF] border border-[#8957F5]/30">
                                  Active
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    setDrawerItem({ type: 'user', data: u })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F3FA] text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <Eye size={12} /> Inspect
                                </button>
                                {!targetIsRoot && canModifyTarget && (
                                  <button
                                    onClick={() =>
                                      onModerateUser(
                                        u.uid,
                                        u.isBanned ? 'unban' : 'ban'
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                                      u.isBanned
                                        ? 'bg-[#8957F5]/20 text-[#C4B1FF]'
                                        : 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                                    }`}
                                  >
                                    {u.isBanned ? 'Unban' : 'Ban'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 px-1 text-xs text-[#A19DAD]">
                  <span>
                    Showing {paginatedUsers.length} of {filteredUsers.length}{' '}
                    users
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={userPage <= 1}
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded-lg doom-glass disabled:opacity-40 text-[#F5F3FA]"
                    >
                      Previous
                    </button>
                    <span className="font-mono">
                      Page {userPage} / {totalUserPages}
                    </span>
                    <button
                      disabled={userPage >= totalUserPages}
                      onClick={() =>
                        setUserPage((p) => Math.min(totalUserPages, p + 1))
                      }
                      className="px-3 py-1 rounded-lg doom-glass disabled:opacity-40 text-[#F5F3FA]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. PEOPLE -> OWNERS                                       */}
          {/* ========================================================= */}
          {activeTab === 'owners' && (
            <div className="space-y-6">
              {/* Root Owner Immutable Authority Banner */}
              <div className="doom-glass-elevated rounded-2xl p-5 border border-[#8957F5]/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#C4B1FF]">
                      PRIMARY ROOT OWNER AUTHORITY
                    </div>
                    <h2 className="text-base font-extrabold text-[#F5F3FA] mt-1">
                      razorpay@admin.doom · UUID {ROOT_OWNER_UUID}
                    </h2>
                    <p className="text-xs text-[#A19DAD] mt-1">
                      Protected against demotion, suspension, or deletion. Holds
                      permanent APEX+ and unlimited sovereign gifting.
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-[#8957F5]/20 border border-[#8957F5]/40 text-xs font-mono text-[#C4B1FF] self-start">
                    IMMUTABLE SOVEREIGN
                  </span>
                </div>
              </div>

              {/* Create Secondary Owner Invitation (Root Owner Only) */}
              {isRoot && (
                <div className="doom-glass rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-[#F5F3FA] mb-1">
                    Invite Secondary Owner
                  </h3>
                  <p className="text-xs text-[#A19DAD] mb-4">
                    Generate a single-use cryptographic owner invitation bound
                    to the recipient’s email address.
                  </p>
                  <form
                    onSubmit={handleGenerateOwnerInvite}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3"
                  >
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Recipient email (required)"
                      className="bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F3FA] placeholder-[#777180]"
                    />
                    <input
                      type="text"
                      value={inviteDisplayName}
                      onChange={(e) => setInviteDisplayName(e.target.value)}
                      placeholder="Invited display name / title (optional)"
                      className="bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F3FA] placeholder-[#777180]"
                    />
                    <button
                      type="submit"
                      disabled={isCreatingInvite}
                      className="py-2.5 px-4 rounded-xl bg-[#8957F5] hover:bg-[#A47BFF] text-white font-bold text-xs transition-colors"
                    >
                      {isCreatingInvite
                        ? 'Generating Invite...'
                        : 'Create Owner Invitation'}
                    </button>
                  </form>

                  {createdInviteUrl && (
                    <div className="mt-4 p-3.5 rounded-xl bg-[#15111F] border border-[#8957F5]/40 flex items-center justify-between gap-3">
                      <code className="text-xs font-mono text-[#C4B1FF] truncate">
                        {createdInviteUrl}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(createdInviteUrl, 'created_invite')
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#8957F5] text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                      >
                        {copiedId === 'created_invite' ? (
                          <>
                            <Check size={13} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={13} /> Copy URL
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Active Secondary Owners & Granular Permissions */}
              <div className="doom-glass rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#F5F3FA] mb-3">
                  Secondary Owners & Granular Capabilities
                </h3>
                <div className="space-y-3">
                  {users
                    .filter((u) => u.role === 'secondary_owner')
                    .map((sec) => {
                      const perms = sec.secondaryOwnerPermissions || {
                        canManageUsers: true,
                        canManageCommunities: true,
                        canManageApexPlans: false,
                        canManageCosmetics: false,
                        canCreateGifts: true,
                        canManageReceipts: true,
                        canProcessRefunds: false,
                      };
                      return (
                        <div
                          key={sec.uid}
                          className="p-4 rounded-xl bg-[#15111F] border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                sec.photoURL ||
                                generateInitialsAvatar(sec.displayName)
                              }
                              alt={sec.displayName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <div className="text-sm font-bold text-[#F5F3FA]">
                                {sec.displayName} (@{sec.username})
                              </div>
                              <div className="text-xs text-[#A19DAD]">
                                {sec.email}
                              </div>
                            </div>
                          </div>
                          {isRoot && (
                            <div className="flex flex-wrap items-center gap-2">
                              {(
                                [
                                  ['canManageUsers', 'Users'],
                                  ['canManageCommunities', 'Servers'],
                                  ['canManageApexPlans', 'APEX Plans'],
                                  ['canManageCosmetics', 'Cosmetics'],
                                  ['canCreateGifts', 'Gifts'],
                                  ['canManageReceipts', 'Receipts'],
                                ] as [keyof typeof perms, string][]
                              ).map(([key, label]) => (
                                <button
                                  key={key}
                                  onClick={() =>
                                    onUpdateSecondaryOwnerPermissions(sec.uid, {
                                      ...perms,
                                      [key]: !perms[key],
                                    })
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${
                                    perms[key]
                                      ? 'bg-[#8957F5]/20 text-[#C4B1FF] border-[#8957F5]/40'
                                      : 'bg-white/5 text-[#777180] border-white/10'
                                  }`}
                                >
                                  {label}: {perms[key] ? 'ON' : 'OFF'}
                                </button>
                              ))}
                              <button
                                onClick={() =>
                                  onUpdateUserRole(sec.uid, 'member')
                                }
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-[11px] font-semibold"
                              >
                                Revoke Owner
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  {users.filter((u) => u.role === 'secondary_owner').length ===
                    0 && (
                    <div className="text-xs text-[#777180] py-4 text-center">
                      No Secondary Owners currently appointed.
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Invitations Ledger */}
              <div className="doom-glass rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#F5F3FA] mb-3">
                  Owner Invitation Ledger ({ownerInvitations.length})
                </h3>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-[#A19DAD]">
                        <th className="py-2.5 px-4">Token Preview</th>
                        <th className="py-2.5 px-4">Target Email</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ownerInvitations.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-2.5 px-4 font-mono text-[#C4B1FF]">
                            {inv.tokenPreview}
                          </td>
                          <td className="py-2.5 px-4 text-[#F5F3FA]">
                            {inv.email}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#8957F5]/15 text-[#C4B1FF]">
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {inv.status === 'pending' && isRoot && (
                              <button
                                onClick={() => onRevokeOwnerInvite(inv.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-[11px]"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {ownerInvitations.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-5 text-center text-[#777180]"
                          >
                            No invitations issued yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. PEOPLE -> MODERATION                                   */}
          {/* ========================================================= */}
          {activeTab === 'moderation' && (
            <div className="space-y-5">
              <div className="doom-glass rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#F5F3FA] mb-1">
                  User Moderation & Account Enforcement
                </h3>
                <p className="text-xs text-[#A19DAD] mb-4">
                  Manage suspended or banned accounts and enforce community
                  safety rules.
                </p>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-[#A19DAD]">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">State</th>
                        <th className="py-3 px-4 text-right">
                          Moderation Controls
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users
                        .filter((u) => !isRootOwner(u))
                        .map((u) => (
                          <tr key={u.uid}>
                            <td className="py-3 px-4 font-semibold text-[#F5F3FA]">
                              {u.displayName} (@{u.username})
                            </td>
                            <td className="py-3 px-4 font-mono text-[#A19DAD]">
                              {formatRoleLabel(u.role, u.uid)}
                            </td>
                            <td className="py-3 px-4">
                              {u.isBanned
                                ? 'Banned'
                                : u.isSuspended
                                ? 'Suspended'
                                : 'Good Standing'}
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() =>
                                  onModerateUser(
                                    u.uid,
                                    u.isSuspended ? 'unsuspend' : 'suspend'
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-[11px] font-semibold"
                              >
                                {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                              </button>
                              <button
                                onClick={() =>
                                  onModerateUser(
                                    u.uid,
                                    u.isBanned ? 'unban' : 'ban'
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-[11px] font-semibold"
                              >
                                {u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. COMMUNITIES -> SERVERS                                 */}
          {/* ========================================================= */}
          {activeTab === 'servers' && (
            <div className="doom-glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F3FA]">
                    Communities & Servers ({communities.length})
                  </h3>
                  <p className="text-xs text-[#A19DAD]">
                    Inspect or remove communities across the Doomcord network
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-[#A19DAD]">
                      <th className="py-3 px-4">Community</th>
                      <th className="py-3 px-4">Visibility</th>
                      <th className="py-3 px-4">Members</th>
                      <th className="py-3 px-4">Channels</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {communities.map((c) => (
                      <tr key={c.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-bold text-[#F5F3FA]">
                          {c.name}
                        </td>
                        <td className="py-3 px-4 text-[#C4B1FF] font-mono">
                          {c.isPublic ? 'Public' : 'Private'}
                        </td>
                        <td className="py-3 px-4 text-[#A19DAD]">
                          {c.memberCount || c.members?.length || 1}
                        </td>
                        <td className="py-3 px-4 text-[#A19DAD]">
                          {c.channels?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() =>
                              setDrawerItem({ type: 'community', data: c })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F3FA] text-[11px]"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => onDeleteCommunity(c.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-[11px]"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. COMMUNITIES -> MEMBERS                                 */}
          {/* ========================================================= */}
          {activeTab === 'community_members' && (
            <div className="doom-glass rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[#F5F3FA] mb-1">
                Community Membership Roster
              </h3>
              <p className="text-xs text-[#A19DAD] mb-4">
                Cross-server membership distribution and owner assignments
              </p>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-[#A19DAD]">
                      <th className="py-3 px-4">Server Name</th>
                      <th className="py-3 px-4">Owner UID</th>
                      <th className="py-3 px-4">Active Members</th>
                      <th className="py-3 px-4">Roles Configured</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {communities.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 px-4 font-bold text-[#F5F3FA]">
                          {c.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#A19DAD]">
                          {c.ownerId || ROOT_OWNER_UUID}
                        </td>
                        <td className="py-3 px-4 text-[#C4B1FF] font-bold">
                          {c.members?.length || c.memberCount || 1}
                        </td>
                        <td className="py-3 px-4 text-[#A19DAD]">
                          {c.customRoles?.length || 1} roles
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. COMMUNITIES -> ORBS                                    */}
          {/* ========================================================= */}
          {activeTab === 'orbs' && (
            <div className="doom-glass rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[#F5F3FA] mb-1">
                Spatial Orbs Governance ({orbs.length})
              </h3>
              <p className="text-xs text-[#A19DAD] mb-4">
                Manage interactive 3D Orbs, live rooms, and spatial hubs
              </p>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-[#A19DAD]">
                      <th className="py-3 px-4">Orb Name</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Active Participants</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orbs.map((orb) => (
                      <tr key={orb.id}>
                        <td className="py-3 px-4 font-bold text-[#F5F3FA]">
                          {orb.name}
                        </td>
                        <td className="py-3 px-4 text-[#A19DAD]">
                          {orb.description}
                        </td>
                        <td className="py-3 px-4 text-[#C4B1FF] font-mono">
                          {orb.memberCount} members
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() =>
                              setDrawerItem({ type: 'orb', data: orb })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white/5 text-[#F5F3FA] text-[11px]"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => onDeleteOrb(orb.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-[11px]"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 8. MONETIZATION -> APEX PLANS                             */}
          {/* ========================================================= */}
          {activeTab === 'nitro_plans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {nitroPlans.map((plan) => (
                <div key={plan.id} className="doom-glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#C4B1FF]">
                        {plan.tier}
                      </span>
                      <h3 className="text-base font-extrabold text-[#F5F3FA]">
                        {plan.name}
                      </h3>
                    </div>
                    <Crown size={20} className="text-[#C4B1FF]" />
                  </div>
                  <p className="text-xs text-[#A19DAD] mb-4">{plan.tagline}</p>
                  <div className="p-3.5 rounded-xl bg-[#15111F] border border-white/10 mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#A19DAD]">Monthly</div>
                      <div className="text-base font-black text-[#F5F3FA]">
                        ₹{plan.monthlyPriceINR}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#A19DAD]">Yearly</div>
                      <div className="text-base font-black text-[#C4B1FF]">
                        ₹{plan.yearlyPriceINR}
                      </div>
                    </div>
                  </div>
                  {editingPlanId === plan.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={editMonthlyInr}
                          onChange={(e) => setEditMonthlyInr(e.target.value)}
                          placeholder="Monthly INR"
                          className="bg-[#15111F] border border-white/15 rounded-xl px-3 py-2 text-xs text-[#F5F3FA]"
                        />
                        <input
                          type="number"
                          value={editYearlyInr}
                          onChange={(e) => setEditYearlyInr(e.target.value)}
                          placeholder="Yearly INR"
                          className="bg-[#15111F] border border-white/15 rounded-xl px-3 py-2 text-xs text-[#F5F3FA]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSavePlanEdit(plan)}
                          className="px-4 py-2 rounded-xl bg-[#8957F5] text-white text-xs font-bold"
                        >
                          Save Pricing
                        </button>
                        <button
                          onClick={() => setEditingPlanId(null)}
                          className="px-4 py-2 rounded-xl bg-white/10 text-xs text-[#A19DAD]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingPlanId(plan.id);
                        setEditMonthlyInr(String(plan.monthlyPriceINR));
                        setEditYearlyInr(String(plan.yearlyPriceINR));
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#8957F5]/20 hover:bg-[#8957F5]/30 border border-[#8957F5]/40 text-xs font-bold text-[#C4B1FF]"
                    >
                      Edit Plan Pricing
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ========================================================= */}
          {/* 9. MONETIZATION -> COSMETICS                              */}
          {/* ========================================================= */}
          {activeTab === 'cosmetics' && (
            <div className="space-y-6">
              <div className="doom-glass rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#F5F3FA] mb-3">
                  Publish New APEX Collection Cosmetic
                </h3>
                <form
                  onSubmit={handleAddCosmetic}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <input
                    type="text"
                    required
                    value={newCosmeticName}
                    onChange={(e) => setNewCosmeticName(e.target.value)}
                    placeholder="Cosmetic title"
                    className="bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2 text-xs text-[#F5F3FA]"
                  />
                  <input
                    type="text"
                    value={newCosmeticDesc}
                    onChange={(e) => setNewCosmeticDesc(e.target.value)}
                    placeholder="Description"
                    className="bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2 text-xs text-[#F5F3FA]"
                  />
                  <input
                    type="number"
                    value={newCosmeticPrice}
                    onChange={(e) => setNewCosmeticPrice(e.target.value)}
                    placeholder="Price INR"
                    className="bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2 text-xs text-[#F5F3FA]"
                  />
                  <select
                    value={newCosmeticCat}
                    onChange={(e) =>
                      setNewCosmeticCat(e.target.value as CosmeticCategory)
                    }
                    className="bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2 text-xs text-[#F5F3FA]"
                  >
                    <option value="Avatar Decorations">
                      Avatar Decorations
                    </option>
                    <option value="Profile Effects">Profile Effects</option>
                    <option value="Profile Themes">Profile Themes</option>
                    <option value="Nameplates">Nameplates</option>
                    <option value="Profile Badges">Profile Badges</option>
                    <option value="Banners">Banners</option>
                  </select>
                  <select
                    value={newCosmeticRarity}
                    onChange={(e) =>
                      setNewCosmeticRarity(e.target.value as CosmeticRarity)
                    }
                    className="bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2 text-xs text-[#F5F3FA]"
                  >
                    <option value="Rare">Rare</option>
                    <option value="Epic">Epic</option>
                    <option value="Legendary">Legendary</option>
                    <option value="Mythic">Mythic</option>
                  </select>
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-[#8957F5] hover:bg-[#A47BFF] text-white font-bold text-xs"
                  >
                    Add Cosmetic to Store
                  </button>
                </form>
              </div>

              <div className="doom-glass rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#F5F3FA] mb-3">
                  Active Cosmetics Catalog ({cosmetics.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {cosmetics.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl bg-[#15111F] border border-white/10 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#C4B1FF]">
                          <span>{c.category}</span>
                          <span>{c.rarity}</span>
                        </div>
                        <div className="text-sm font-bold text-[#F5F3FA] mt-1">
                          {c.name}
                        </div>
                        <p className="text-xs text-[#A19DAD] mt-1">
                          {c.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#F5F3FA]">
                          ₹{c.priceINR}
                        </span>
                        <span className="text-[10px] font-mono text-[#C4B1FF]">
                          {c.nitroEligible !== 'none'
                            ? 'Included w/ APEX+'
                            : 'Store Item'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 10. MONETIZATION -> GIFT MANAGEMENT                       */}
          {/* ========================================================= */}
          {activeTab === 'gifts' && (
            <div className="space-y-6">
              <div className="doom-glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F3FA]">
                      Issue Complimentary Sovereign Gift (₹0 Owner Grant)
                    </h3>
                    <p className="text-xs text-[#A19DAD]">
                      Generate an instant redemption link for APEX, APEX+, or
                      cosmetics without payment
                    </p>
                  </div>
                  <Gift size={18} className="text-[#C4B1FF]" />
                </div>

                <form
                  onSubmit={handleGenerateOwnerGift}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <select
                    value={giftApexTier}
                    onChange={(e) =>
                      setGiftApexTier(
                        e.target.value as 'none' | 'basic' | 'nitro'
                      )
                    }
                    className="bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F3FA]"
                  >
                    <option value="nitro">APEX+ Sovereign</option>
                    <option value="basic">APEX Basic</option>
                    <option value="none">Cosmetics Only</option>
                  </select>

                  <select
                    value={giftDuration}
                    onChange={(e) =>
                      setGiftDuration(e.target.value as GiftDuration)
                    }
                    className="bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F3FA]"
                  >
                    <option value="lifetime">Lifetime Entitlement</option>
                    <option value="1y">1 Year</option>
                    <option value="1m">1 Month</option>
                  </select>

                  <input
                    type="text"
                    value={giftRestrictUsername}
                    onChange={(e) => setGiftRestrictUsername(e.target.value)}
                    placeholder="Lock to @username (optional)"
                    className="bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F3FA]"
                  />

                  <input
                    type="text"
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Personal gift note"
                    className="md:col-span-2 bg-[#15111F] border border-white/12 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F3FA]"
                  />

                  <button
                    type="submit"
                    disabled={isCreatingGift}
                    className="py-2.5 px-4 rounded-xl bg-[#8957F5] hover:bg-[#A47BFF] text-white font-bold text-xs"
                  >
                    {isCreatingGift
                      ? 'Generating Gift...'
                      : 'Generate Instant Gift Link'}
                  </button>
                </form>

                {createdGiftUrl && (
                  <div className="mt-4 p-3.5 rounded-xl bg-[#15111F] border border-[#8957F5]/40 flex items-center justify-between gap-3">
                    <code className="text-xs font-mono text-[#C4B1FF] truncate">
                      {createdGiftUrl}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(createdGiftUrl, 'created_gift')
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#8957F5] text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                    >
                      {copiedId === 'created_gift' ? (
                        <>
                          <Check size={13} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copy Gift Link
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="doom-glass rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#F5F3FA] mb-3">
                  Issued Gifts Ledger ({gifts.length})
                </h3>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-[#A19DAD]">
                        <th className="py-3 px-4">Token Preview</th>
                        <th className="py-3 px-4">Entitlement</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {gifts.map((g) => (
                        <tr key={g.id}>
                          <td className="py-3 px-4 font-mono text-[#C4B1FF]">
                            {g.tokenPreview}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#F5F3FA]">
                            {g.apexTier === 'nitro'
                              ? 'APEX+ Sovereign'
                              : g.apexTier === 'basic'
                              ? 'APEX Basic'
                              : 'Cosmetic Bundle'}
                          </td>
                          <td className="py-3 px-4 text-[#A19DAD] font-mono">
                            {g.duration}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#8957F5]/15 text-[#C4B1FF]">
                              {g.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `${window.location.origin}/?gift=${
                                    g.claimToken || g.tokenPreview
                                  }`,
                                  g.id
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-white/5 text-[#F5F3FA] text-[11px]"
                            >
                              {copiedId === g.id ? 'Copied' : 'Copy Link'}
                            </button>
                            {g.status === 'unclaimed' && (
                              <button
                                onClick={() => onRevokeGift(g.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-[11px]"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 11. MONETIZATION -> PAYMENTS                              */}
          {/* ========================================================= */}
          {activeTab === 'payments' && (
            <div className="doom-glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F3FA]">
                    Payment History & Razorpay Settlements (
                    {transactions.length})
                  </h3>
                  <p className="text-xs text-[#A19DAD]">
                    Complete ledger of verified customer transactions and
                    complimentary grants
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-[#A19DAD]">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer Email</th>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#A19DAD]">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#F5F3FA]">
                          {tx.userEmail}
                        </td>
                        <td className="py-3 px-4 text-[#A19DAD]">
                          {tx.itemName}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#F5F3FA]">
                          {tx.type === 'admin_grant'
                            ? '₹0 (Owner Grant)'
                            : `₹${tx.amountINR}`}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#8957F5]/15 text-[#C4B1FF]">
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() =>
                              setDrawerItem({ type: 'transaction', data: tx })
                            }
                            className="px-2.5 py-1 rounded-lg bg-white/5 text-[#F5F3FA] text-[11px]"
                          >
                            Details
                          </button>
                          {(tx.status === 'verified' ||
                            tx.status === 'captured') &&
                            tx.type !== 'admin_grant' && (
                              <button
                                onClick={() => onRefundTransaction(tx)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-[11px]"
                              >
                                Refund
                              </button>
                            )}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-6 text-center text-[#777180]"
                        >
                          No transactions recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 12. MONETIZATION -> RECEIPTS                              */}
          {/* ========================================================= */}
          {activeTab === 'receipts' && (
            <div className="space-y-6">
              <div className="doom-glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F3FA]">
                    Official Verifiable Receipts ({receipts.length})
                  </h3>
                  <p className="text-xs text-[#A19DAD]">
                    Issue manual receipts, inspect expiration dates, or view
                    printable receipt documents
                  </p>
                </div>
                <button
                  onClick={() => setShowReceiptCreator((p) => !p)}
                  className="px-4 py-2.5 rounded-xl bg-[#8957F5] hover:bg-[#A47BFF] text-white text-xs font-bold flex items-center gap-2 self-start"
                >
                  <Plus size={15} />
                  {showReceiptCreator ? 'Close Creator' : 'Issue Manual Receipt'}
                </button>
              </div>

              {showReceiptCreator && (
                <form
                  onSubmit={handleCreateReceiptSubmit}
                  className="doom-glass-elevated rounded-2xl p-5 space-y-4"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#C4B1FF]">
                    Create Official Doomcord Receipt
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      value={rcpRecipientUid}
                      onChange={(e) =>
                        handleSelectRecipientPreset(e.target.value)
                      }
                      className="bg-[#15111F] border border-white/12 rounded-xl px-3 py-2 text-xs text-[#F5F3FA]"
                    >
                      <option value="">Select Existing User (Optional)</option>
                      {users.map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName} (@{u.username})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={rcpRecipientName}
                      onChange={(e) => setRcpRecipientName(e.target.value)}
                      placeholder="Recipient Display Name"
                      className="bg-[#15111F] border border-white/12 rounded-xl px-3 py-2 text-xs text-[#F5F3FA]"
                    />
                    <input
                      type="text"
                      value={rcpRecipientUsername}
                      onChange={(e) => setRcpRecipientUsername(e.target.value)}
                      placeholder="Recipient @username"
                      className="bg-[#15111F] border border-white/12 rounded-xl px-3 py-2 text-xs text-[#F5F3FA]"
                    />
                    <input
                      type="text"
                      required
                      value={rcpItemTitle}
                      onChange={(e) => setRcpItemTitle(e.target.value)}
                      placeholder="Item Title"
                      className="bg-[#15111F] border border-white/12 rounded-xl px-3 py-2 text-xs text-[#F5F3FA]"
                    />
                    <select
                      value={rcpDurationPreset}
                      onChange={(e) =>
                        setRcpDurationPreset(
                          e.target.value as ReceiptDurationPreset
                        )
                      }
                      className="bg-[#15111F] border border-white/12 rounded-xl px-3 py-2 text-xs text-[#F5F3FA]"
                    >
                      <option value="lifetime">Lifetime</option>
                      <option value="1y">1 Year</option>
                      <option value="30d">30 Days</option>
                      <option value="7d">7 Days</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isSubmittingReceipt}
                      className="py-2 px-4 rounded-xl bg-[#8957F5] text-white font-bold text-xs"
                    >
                      {isSubmittingReceipt
                        ? 'Issuing Receipt...'
                        : 'Generate & View Receipt'}
                    </button>
                  </div>
                </form>
              )}

              <div className="doom-glass rounded-2xl p-5">
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-[#A19DAD]">
                        <th className="py-3 px-4">Receipt #</th>
                        <th className="py-3 px-4">Recipient</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Total Paid</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredReceipts.map((r) => {
                        const exp = getReceiptExpirationInfo(
                          r.serviceExpiryDate
                        );
                        return (
                          <tr key={r.id}>
                            <td className="py-3 px-4 font-mono text-[#C4B1FF]">
                              {r.receiptNumber}
                            </td>
                            <td className="py-3 px-4 font-bold text-[#F5F3FA]">
                              {r.customerDisplayName} (@{r.customerUsername})
                            </td>
                            <td className="py-3 px-4 text-[#A19DAD]">
                              {r.serviceDurationLabel} · {exp.remainingLabel}
                            </td>
                            <td className="py-3 px-4 font-bold text-[#F5F3FA]">
                              ₹{r.totalAmountINR.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => onOpenReceiptModal(r)}
                                className="px-2.5 py-1 rounded-lg bg-[#8957F5]/20 text-[#C4B1FF] text-[11px] font-semibold"
                              >
                                View Document
                              </button>
                              <button
                                onClick={() => {
                                  setCorrectingReceipt(r);
                                  setCorrectionNotes(r.notes || '');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/5 text-[#A19DAD] text-[11px]"
                              >
                                Append Note
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {correctingReceipt && (
                <form
                  onSubmit={handleSaveReceiptCorrection}
                  className="doom-glass-elevated rounded-2xl p-5 space-y-3"
                >
                  <div className="text-xs font-bold text-[#C4B1FF]">
                    Append Audit Correction to {correctingReceipt.receiptNumber}
                  </div>
                  <input
                    type="text"
                    required
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Reason for audit note"
                    className="w-full bg-[#15111F] border border-white/12 rounded-xl px-3 py-2 text-xs text-[#F5F3FA]"
                  />
                  <textarea
                    value={correctionNotes}
                    onChange={(e) => setCorrectionNotes(e.target.value)}
                    placeholder="Updated receipt note"
                    className="w-full bg-[#15111F] border border-white/12 rounded-xl px-3 py-2 text-xs text-[#F5F3FA]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#8957F5] text-white text-xs font-bold"
                    >
                      Save Audit Note
                    </button>
                    <button
                      type="button"
                      onClick={() => setCorrectingReceipt(null)}
                      className="px-4 py-2 rounded-xl bg-white/10 text-xs text-[#A19DAD]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 13. SYSTEM -> SECURITY                                    */}
          {/* ========================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="doom-glass rounded-2xl p-5">
                <h3 className="text-sm font-bold text-[#F5F3FA] mb-1">
                  OWASP Top 10 & ASVS L2 Security Remediations
                </h3>
                <p className="text-xs text-[#A19DAD] mb-4">
                  Active defensive controls verified across authentication,
                  RBAC, and payment pipelines
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {SECURITY_AUDIT_REPORT_DATA.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#15111F] border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono uppercase text-[#C4B1FF]">
                          {item.category} · {item.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#8957F5]/20 text-[#C4B1FF]">
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#F5F3FA]">
                        {item.vulnerability}
                      </div>
                      <p className="text-[11px] text-[#A19DAD] mt-1">
                        {item.fixImplemented}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 14. SYSTEM -> AUDIT LOGS                                  */}
          {/* ========================================================= */}
          {activeTab === 'audit_logs' && (
            <div className="doom-glass rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[#F5F3FA] mb-3">
                Immutable Governance Audit Trail ({auditLogs.length})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#15111F]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-[#A19DAD]">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#A19DAD] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#F5F3FA]">
                          {log.actorEmail}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#C4B1FF]">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-[#A19DAD]">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 15. SYSTEM -> SETTINGS                                    */}
          {/* ========================================================= */}
          {activeTab === 'system_settings' && (
            <div className="doom-glass rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#F5F3FA]">
                Platform System Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#15111F] border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#F5F3FA]">
                      Maintenance Mode
                    </div>
                    <div className="text-[11px] text-[#A19DAD]">
                      Restrict platform access to administrators only
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSystemConfig({
                        maintenanceMode: !systemConfig.maintenanceMode,
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      systemConfig.maintenanceMode
                        ? 'bg-rose-500 text-white'
                        : 'bg-[#8957F5] text-white'
                    }`}
                  >
                    {systemConfig.maintenanceMode ? 'Active' : 'Operational'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#15111F] border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#F5F3FA]">
                      Global Store Discount
                    </div>
                    <div className="text-[11px] text-[#A19DAD]">
                      Current promotional discount:{' '}
                      {systemConfig.globalDiscountPercent}%
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSystemConfig({
                        globalDiscountPercent:
                          systemConfig.globalDiscountPercent > 0 ? 0 : 15,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#C4B1FF]"
                  >
                    {systemConfig.globalDiscountPercent > 0
                      ? 'Reset to 0%'
                      : 'Enable 15% Promo'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-Over Detail Drawer */}
      {drawerItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerItem(null)}
          />
          <div className="relative w-full max-w-md h-full doom-glass-strong p-6 z-10 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C4B1FF]">
                    Inspector Drawer
                  </span>
                  <h3 className="text-base font-bold text-[#F5F3FA] capitalize">
                    {drawerItem.type} Details
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerItem(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A19DAD]"
                >
                  <X size={16} />
                </button>
              </div>

              {drawerItem.type === 'user' && (
                <div className="mt-5 space-y-4 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        drawerItem.data.photoURL ||
                        generateInitialsAvatar(drawerItem.data.displayName)
                      }
                      alt={drawerItem.data.displayName}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#8957F5]/40"
                    />
                    <div>
                      <div className="text-base font-bold text-[#F5F3FA]">
                        {drawerItem.data.displayName}
                      </div>
                      <div className="font-mono text-[#C4B1FF]">
                        @{drawerItem.data.username}
                      </div>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#15111F] border border-white/10 space-y-2">
                    <div>
                      <span className="text-[#A19DAD]">UUID:</span>{' '}
                      <span className="font-mono text-[#F5F3FA]">
                        {drawerItem.data.uid}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A19DAD]">Email:</span>{' '}
                      <span className="text-[#F5F3FA]">
                        {drawerItem.data.email || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A19DAD]">Role:</span>{' '}
                      <span className="font-bold text-[#C4B1FF]">
                        {formatRoleLabel(
                          drawerItem.data.role,
                          drawerItem.data.uid
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A19DAD]">APEX Tier:</span>{' '}
                      <span className="font-bold text-[#F5F3FA] uppercase">
                        {drawerItem.data.nitroTier}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A19DAD]">Owned Cosmetics:</span>{' '}
                      <span className="text-[#F5F3FA]">
                        {(drawerItem.data.ownedCosmetics || []).length} items
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {drawerItem.type === 'community' && (
                <div className="mt-5 space-y-3 text-xs">
                  <div className="text-base font-bold text-[#F5F3FA]">
                    {drawerItem.data.name}
                  </div>
                  <p className="text-[#A19DAD]">
                    {drawerItem.data.description}
                  </p>
                  <div className="p-3.5 rounded-xl bg-[#15111F] border border-white/10 space-y-1.5">
                    <div>
                      Visibility:{' '}
                      {drawerItem.data.isPublic ? 'Public' : 'Private'}
                    </div>
                    <div>
                      Members:{' '}
                      {drawerItem.data.memberCount ||
                        drawerItem.data.members?.length ||
                        1}
                    </div>
                    <div>
                      Channels: {(drawerItem.data.channels || []).length}
                    </div>
                  </div>
                </div>
              )}

              {drawerItem.type === 'orb' && (
                <div className="mt-5 space-y-3 text-xs">
                  <div className="text-base font-bold text-[#F5F3FA]">
                    {drawerItem.data.name}
                  </div>
                  <p className="text-[#A19DAD]">
                    {drawerItem.data.description}
                  </p>
                  <div className="p-3.5 rounded-xl bg-[#15111F] border border-white/10 space-y-1.5">
                    <div>Members: {drawerItem.data.memberCount}</div>
                    <div>Orb ID: {drawerItem.data.id}</div>
                  </div>
                </div>
              )}

              {drawerItem.type === 'transaction' && (
                <div className="mt-5 space-y-3 text-xs">
                  <div className="text-base font-bold text-[#F5F3FA]">
                    {drawerItem.data.itemName}
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#15111F] border border-white/10 space-y-1.5 font-mono">
                    <div>ID: {drawerItem.data.id}</div>
                    <div>Customer: {drawerItem.data.userEmail}</div>
                    <div>Amount: ₹{drawerItem.data.amountINR}</div>
                    <div>Status: {drawerItem.data.status}</div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setDrawerItem(null)}
              className="w-full py-2.5 rounded-xl bg-[#8957F5] text-white text-xs font-bold mt-6"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
