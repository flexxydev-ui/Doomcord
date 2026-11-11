import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Crown,
  ShoppingBag,
  CreditCard,
  Activity,
  FileText,
  Ban,
  AlertTriangle,
  Plus,
  Trash2,
  Gift,
  Receipt,
  UserCheck,
  Copy,
  Check,
  Lock,
  ExternalLink,
  Search,
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
}

type AdminTab =
  | 'overview'
  | 'users'
  | 'owners'
  | 'gifts'
  | 'receipts'
  | 'nitro_plans'
  | 'cosmetics'
  | 'razorpay'
  | 'moderation'
  | 'security_audit'
  | 'system_audit';

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
  onGrantOrRevokeCosmetic,
  onCreateOwnerGift,
  onRevokeGift,
  onCreateOwnerInvite,
  onRevokeOwnerInvite,
  onCreateManualReceipt,
  onCorrectReceiptMetadata,
  onOpenReceiptModal,
  onRefundTransaction,
  onUpdateSystemConfig,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User filter
  const [userSearch, setUserSearch] = useState('');

  // Owner Management (#35) state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);

  // Owner Gifting Studio (#28-#31) state
  const [giftApexTier, setGiftApexTier] = useState<'none' | 'basic' | 'nitro'>(
    'nitro'
  );
  const [giftSelectedCosmetics, setGiftSelectedCosmetics] = useState<string[]>(
    []
  );
  const [giftDuration, setGiftDuration] = useState<GiftDuration>('lifetime');
  const [giftMessage, setGiftMessage] = useState(
    'Complimentary DOOMCORD APEX+ gift from the Doomcord Owner!'
  );
  const [giftRecipientUsername, setGiftRecipientUsername] = useState('');
  const [giftRecipientEmail, setGiftRecipientEmail] = useState('');
  const [generatedGiftUrl, setGeneratedGiftUrl] = useState<string | null>(null);

  // Receipt Generator (#36) state
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [rcpType, setRcpType] = useState<ReceiptType>(
    'APEX+ Membership Receipt'
  );
  const [rcpTitle, setRcpTitle] = useState('DOOMCORD APEX+ Membership');
  const [rcpDesc, setRcpDesc] = useState(
    'Official Doomcord billing & entitlement receipt'
  );
  const [rcpCustomerUid, setRcpCustomerUid] = useState('');
  const [rcpCustomerUsername, setRcpCustomerUsername] = useState('');
  const [rcpCustomerDisplayName, setRcpCustomerDisplayName] = useState('');
  const [rcpCustomerEmail, setRcpCustomerEmail] = useState('');
  const [rcpPaymentMethod, setRcpPaymentMethod] = useState('Razorpay / UPI');
  const [rcpPaymentStatus, setRcpPaymentStatus] =
    useState<ReceiptPaymentStatus>('Paid');
  const [rcpTxId, setRcpTxId] = useState(`TXN-${Date.now()}`);
  const [rcpNotes, setRcpNotes] = useState(
    'Verified and issued by Doomcord Platform Administration.'
  );
  const [rcpItemName, setRcpItemName] = useState('DOOMCORD APEX+ Membership');
  const [rcpItemCategory, setRcpItemCategory] = useState('Membership');
  const [rcpItemQty, setRcpItemQty] = useState(1);
  const [rcpItemPrice, setRcpItemPrice] = useState(99);
  const [rcpItemDiscount, setRcpItemDiscount] = useState(0);
  const [rcpDurationPreset, setRcpDurationPreset] =
    useState<ReceiptDurationPreset>('30d');
  const [rcpCustomVal, setRcpCustomVal] = useState(30);
  const [rcpCustomUnit, setRcpCustomUnit] =
    useState<CustomDurationUnit>('days');
  const [rcpExtraItems, setRcpExtraItems] = useState<ReceiptLineItem[]>([]);
  const [receiptSearch, setReceiptSearch] = useState('');

  // Metadata correction state
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [editReceiptNotes, setEditReceiptNotes] = useState('');
  const [editReceiptReason, setEditReceiptReason] = useState('');

  // Razorpay state
  const [rzpStatus, setRzpStatus] = useState<any>(null);
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState('');
  const [merchantUpi, setMerchantUpi] = useState(
    systemConfig.merchantUpiId || 'adrenoxshriyans@fam'
  );

  // New Cosmetic state
  const [newCosmName, setNewCosmName] = useState('');
  const [newCosmDesc, setNewCosmDesc] = useState('');
  const [newCosmCategory, setNewCosmCategory] =
    useState<CosmeticCategory>('Avatar Decorations');
  const [newCosmPrice, setNewCosmPrice] = useState(39);
  const [newCosmRarity, setNewCosmRarity] = useState<CosmeticRarity>('Rare');
  const [newCosmColor1, setNewCosmColor1] = useState('#8957F5');
  const [newCosmColor2, setNewCosmColor2] = useState('#C4B1FF');

  useEffect(() => {
    fetch('/api/razorpay/status')
      .then((r) => r.json())
      .then((data) => {
        setRzpStatus(data);
        if (data.keyIdPublic) setRzpKeyId(data.keyIdPublic);
        if (data.merchantUpiId) setMerchantUpi(data.merchantUpiId);
      })
      .catch(() => {});
  }, []);

  if (!isAdminOrAbove(currentUser)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#09090D]">
        <div className="max-w-md p-6 rounded-xl bg-[#101014] border border-[#E57373]/40 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-[#E57373] mx-auto" />
          <h2 className="text-base font-display font-bold text-[#F5F3FA]">
            Access Restricted
          </h2>
          <p className="text-xs text-[#A19DAD]">
            This console is restricted to authorized Doomcord Owners and Administrators.
          </p>
        </div>
      </div>
    );
  }

  const isRoot = isRootOwner(currentUser.uid);
  const isOwner = isAnyOwner(currentUser);
  const canCreateGifts =
    isRoot ||
    (isSecondaryOwner(currentUser) &&
      currentUser.secondaryOwnerPermissions?.canCreateGifts !== false);
  const canManageReceipts =
    isRoot ||
    (isSecondaryOwner(currentUser) &&
      currentUser.secondaryOwnerPermissions?.canManageReceipts !== false);

  const showFlash = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4500);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const verifiedTransactions = transactions.filter(
    (t) => t.status === 'verified' || t.status === 'captured'
  );
  const totalRevenueINR = verifiedTransactions.reduce(
    (sum, t) => sum + (t.amountINR || 0),
    0
  );
  const activeNitroUsersCount = users.filter(
    (u) => u.nitroTier !== 'free' || isRootOwner(u.uid)
  ).length;

  const ownerAccounts = users.filter(
    (u) =>
      isRootOwner(u.uid) ||
      u.role === 'root_owner' ||
      u.role === 'secondary_owner' ||
      u.role === 'owner'
  );

  const handleSelectReceiptCustomer = (uid: string) => {
    const found = users.find((u) => u.uid === uid);
    if (found) {
      setRcpCustomerUid(found.uid);
      setRcpCustomerUsername(found.username);
      setRcpCustomerDisplayName(found.displayName);
      setRcpCustomerEmail(found.email);
    }
  };

  const handleAddReceiptLineItem = () => {
    const dur = calculateReceiptDuration(
      rcpDurationPreset,
      new Date().toISOString(),
      rcpCustomVal,
      rcpCustomUnit
    );
    const finalAmt = Math.max(
      0,
      rcpItemQty * rcpItemPrice - rcpItemDiscount
    );
    const item: ReceiptLineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      productName: rcpItemName,
      category: rcpItemCategory,
      quantity: rcpItemQty,
      unitPriceINR: rcpItemPrice,
      discountINR: rcpItemDiscount,
      finalAmountINR: finalAmt,
      durationPreset: rcpDurationPreset,
      customDurationValue:
        rcpDurationPreset === 'custom' ? rcpCustomVal : undefined,
      customDurationUnit:
        rcpDurationPreset === 'custom' ? rcpCustomUnit : undefined,
      durationLabel: dur.durationLabel,
      serviceStartDate: dur.serviceStartDate,
      serviceExpiryDate: dur.serviceExpiryDate,
    };
    setRcpExtraItems((prev) => [...prev, item]);
  };

  const handleIssueReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dur = calculateReceiptDuration(
      rcpDurationPreset,
      new Date().toISOString(),
      rcpCustomVal,
      rcpCustomUnit
    );
    const primaryItemFinal = Math.max(
      0,
      rcpItemQty * rcpItemPrice - rcpItemDiscount
    );
    const primaryItem: ReceiptLineItem = {
      id: `item_${Date.now()}`,
      productName: rcpItemName,
      category: rcpItemCategory,
      quantity: rcpItemQty,
      unitPriceINR: rcpItemPrice,
      discountINR: rcpItemDiscount,
      finalAmountINR: primaryItemFinal,
      durationPreset: rcpDurationPreset,
      customDurationValue:
        rcpDurationPreset === 'custom' ? rcpCustomVal : undefined,
      customDurationUnit:
        rcpDurationPreset === 'custom' ? rcpCustomUnit : undefined,
      durationLabel: dur.durationLabel,
      serviceStartDate: dur.serviceStartDate,
      serviceExpiryDate: dur.serviceExpiryDate,
    };

    const allItems =
      rcpExtraItems.length > 0 ? [primaryItem, ...rcpExtraItems] : [primaryItem];
    const subtotalINR = allItems.reduce(
      (s, i) => s + i.quantity * i.unitPriceINR,
      0
    );
    const discountTotalINR = allItems.reduce((s, i) => s + i.discountINR, 0);
    const totalAmountINR = allItems.reduce((s, i) => s + i.finalAmountINR, 0);

    const created = await onCreateManualReceipt({
      receiptType: rcpType,
      title: rcpTitle,
      description: rcpDesc,
      customerUid: rcpCustomerUid || currentUser.uid,
      customerUsername: rcpCustomerUsername || currentUser.username,
      customerDisplayName: rcpCustomerDisplayName || currentUser.displayName,
      customerEmail: rcpCustomerEmail || currentUser.email,
      items: allItems,
      subtotalINR,
      discountTotalINR,
      taxINR: 0,
      totalAmountINR,
      currency: 'INR',
      paymentMethod: rcpPaymentMethod,
      paymentStatus: rcpPaymentStatus,
      transactionId: rcpTxId,
      issueDate: new Date().toISOString(),
      serviceStartDate: dur.serviceStartDate,
      serviceExpiryDate: dur.serviceExpiryDate,
      serviceDurationLabel: dur.durationLabel,
      notes: rcpNotes,
      issuerUid: currentUser.uid,
      issuerName: currentUser.displayName,
      issuerEmail: currentUser.email,
      issuerRole: isRoot ? 'root_owner' : currentUser.role,
    });

    setRcpExtraItems([]);
    setShowReceiptForm(false);
    showFlash(`Issued Official Receipt ${created.receiptNumber}.`);
    onOpenReceiptModal(created);
  };

  const handleSaveRazorpayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/razorpay-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify({
          keyId: rzpKeyId,
          keySecret: rzpKeySecret || undefined,
          webhookSecret: rzpWebhookSecret || undefined,
          merchantUpiId: merchantUpi,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showFlash(data.error || 'Failed to update Razorpay settings.');
        return;
      }
      await onUpdateSystemConfig({ merchantUpiId: merchantUpi });
      const statusRes = await fetch('/api/razorpay/status').then((r) =>
        r.json()
      );
      setRzpStatus(statusRes);
      setRzpKeySecret('');
      setRzpWebhookSecret('');
      showFlash('Razorpay Payment Gateway configuration saved on server.');
    } catch (err: any) {
      showFlash(err.message || 'Error saving payment config.');
    }
  };

  const handleCreateCosmetic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCosmName.trim()) return;
    const newItem: CosmeticItem = {
      id: `cosm_${Date.now()}`,
      name: newCosmName.trim(),
      description:
        newCosmDesc.trim() || `Original Doomcord ${newCosmCategory} cosmetic.`,
      category: newCosmCategory,
      priceINR: Number(newCosmPrice) || 39,
      rarity: newCosmRarity,
      nitroEligible: 'basic',
      cssPreviewClass: 'ring-2 ring-[#8957F5]',
      previewColorPrimary: newCosmColor1,
      previewColorSecondary: newCosmColor2,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    await onSaveCosmetic(newItem);
    setNewCosmName('');
    setNewCosmDesc('');
    showFlash(`Created cosmetic "${newItem.name}" (₹${newItem.priceINR} INR).`);
  };

  const TABS: {
    id: AdminTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Overview & Revenue', icon: Activity },
    { id: 'users', label: `Users (${users.length})`, icon: Users },
    { id: 'owners', label: `Owners (${ownerAccounts.length})`, icon: UserCheck },
    { id: 'gifts', label: `Gifting Studio (${gifts.length})`, icon: Gift },
    { id: 'receipts', label: `Receipts (${receipts.length})`, icon: Receipt },
    { id: 'nitro_plans', label: 'APEX Plans', icon: Crown },
    { id: 'cosmetics', label: `Cosmetics (${cosmetics.length})`, icon: ShoppingBag },
    { id: 'razorpay', label: 'Razorpay & Payments', icon: CreditCard },
    { id: 'moderation', label: 'Communities & Orbs', icon: Shield },
    { id: 'security_audit', label: 'Security Audit (#32)', icon: Lock },
    { id: 'system_audit', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090D] text-[#F5F3FA] overflow-hidden">
      {/* Header */}
      <header className="px-8 py-4 bg-[#09090D] border-b border-[#282631] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#17171F] border border-[#8957F5]/30 flex items-center justify-center p-2">
            <img
              src="/assets/aistudio/doomcord-icon_378efdf9.png"
              alt="Doomcord"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-display font-bold text-[#F5F3FA]">
                Doomcord Platform Administration Console
              </h1>
              <span className="px-2 py-0.5 rounded bg-[#17171F] border border-[#A47BFF]/30 text-[10px] font-mono uppercase text-[#A47BFF]">
                {formatRoleLabel(currentUser.role, currentUser.uid)}
              </span>
            </div>
            <p className="text-xs font-mono text-[#706C7B]">
              {currentUser.email} · UUID: {currentUser.uid}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className="px-4 py-2 rounded-lg bg-[#17171F] border border-[#8957F5]/40 text-xs font-medium text-[#8957F5]">
            {statusMessage}
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <div className="px-8 py-2.5 bg-[#101014] border-b border-[#282631] flex items-center gap-1.5 overflow-x-auto shrink-0">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-[#22212C] text-[#F5F3FA] font-semibold'
                  : 'text-[#A19DAD] hover:text-[#F5F3FA] hover:bg-[#17171F]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-[#8957F5]" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-6xl w-full mx-auto">
        {/* 1. OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-[#101014] border border-[#282631]">
                <span className="text-[11px] font-mono uppercase text-[#706C7B]">
                  Verified Revenue (INR)
                </span>
                <div className="text-2xl font-display font-bold text-[#8957F5] mt-1 tabular-nums">
                  ₹{totalRevenueINR.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-[#A19DAD] mt-1 block tabular-nums">
                  {verifiedTransactions.length} verified transactions
                </span>
              </div>

              <div className="p-5 rounded-xl bg-[#101014] border border-[#282631]">
                <span className="text-[11px] font-mono uppercase text-[#706C7B]">
                  Active APEX Members
                </span>
                <div className="text-2xl font-display font-bold text-[#A47BFF] mt-1 tabular-nums">
                  {activeNitroUsersCount}
                </div>
                <span className="text-[11px] text-[#A19DAD] mt-1 block">
                  Includes Root Owner permanent APEX+
                </span>
              </div>

              <div className="p-5 rounded-xl bg-[#101014] border border-[#282631]">
                <span className="text-[11px] font-mono uppercase text-[#706C7B]">
                  Issued Official Receipts
                </span>
                <div className="text-2xl font-display font-bold text-[#F5F3FA] mt-1 tabular-nums">
                  {receipts.length}
                </div>
                <span className="text-[11px] text-[#A19DAD] mt-1 block tabular-nums">
                  {gifts.length} total gifts generated
                </span>
              </div>

              <div className="p-5 rounded-xl bg-[#101014] border border-[#282631]">
                <span className="text-[11px] font-mono uppercase text-[#706C7B]">
                  Registered Accounts
                </span>
                <div className="text-2xl font-display font-bold text-[#F5F3FA] mt-1 tabular-nums">
                  {users.length}
                </div>
                <span className="text-[11px] text-[#A19DAD] mt-1 block tabular-nums">
                  {communities.length} communities · {orbs.length} Orbs
                </span>
              </div>
            </div>

            {/* Quick Launch Modules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('owners')}
                className="p-5 rounded-xl bg-[#101014] hover:bg-[#17171F] border border-[#282631] text-left transition-colors"
              >
                <UserCheck className="w-5 h-5 text-[#A47BFF] mb-2" />
                <h3 className="text-sm font-display font-bold text-[#F5F3FA]">
                  Owner Hierarchy (#35)
                </h3>
                <p className="text-xs text-[#A19DAD] mt-1">
                  Invite Secondary Owners and configure granular permissions while Root Owner remains protected.
                </p>
              </button>

              <button
                onClick={() => setActiveTab('gifts')}
                className="p-5 rounded-xl bg-[#101014] hover:bg-[#17171F] border border-[#282631] text-left transition-colors"
              >
                <Gift className="w-5 h-5 text-[#8957F5] mb-2" />
                <h3 className="text-sm font-display font-bold text-[#F5F3FA]">
                  Unlimited Gifting Studio (#28)
                </h3>
                <p className="text-xs text-[#A19DAD] mt-1">
                  Generate ₹0 complimentary APEX, Lifetime APEX+, and cosmetic gift links for any user.
                </p>
              </button>

              <button
                onClick={() => setActiveTab('receipts')}
                className="p-5 rounded-xl bg-[#101014] hover:bg-[#17171F] border border-[#282631] text-left transition-colors"
              >
                <Receipt className="w-5 h-5 text-[#C4B1FF] mb-2" />
                <h3 className="text-sm font-display font-bold text-[#F5F3FA]">
                  Finance → Receipts (#36)
                </h3>
                <p className="text-xs text-[#A19DAD] mt-1">
                  Create, customize, print, and manage official DC-2026-XXXXXX receipts with duration tracking.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* 2. USERS & ROLES */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-display font-bold text-[#F5F3FA]">
                Registered Users ({users.length})
              </h2>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#706C7B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search @username or email..."
                  className="h-8 pl-8 pr-3 rounded-lg bg-[#101014] border border-[#282631] text-xs text-[#F5F3FA] outline-none w-60"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {users
                .filter((u) => {
                  if (!userSearch.trim()) return true;
                  const q = userSearch.toLowerCase();
                  return (
                    u.username.toLowerCase().includes(q) ||
                    u.displayName.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q)
                  );
                })
                .map((u) => {
                  const isTargetRoot = isRootOwner(u.uid);
                  return (
                    <div
                      key={u.uid}
                      className="p-4 rounded-xl bg-[#101014] border border-[#282631] flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#F5F3FA]">
                            {u.displayName}
                          </span>
                          <span className="text-xs font-mono text-[#706C7B]">
                            @{u.username}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[10px] font-mono uppercase text-[#8957F5]">
                            {formatRoleLabel(u.role, u.uid)}
                          </span>
                          {isTargetRoot && (
                            <span className="px-2 py-0.5 rounded bg-[#A47BFF]/15 border border-[#A47BFF]/40 text-[10px] font-mono text-[#A47BFF]">
                              PROTECTED ROOT OWNER · OWNER_PERMANENT_APEX
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-[#A19DAD] mt-0.5">
                          {u.email} · UUID: {u.uid}
                        </p>
                      </div>

                      {!isTargetRoot && (
                        <div className="flex flex-wrap items-center gap-2">
                          {isRoot && (
                            <select
                              value={u.role}
                              onChange={async (e) => {
                                await onUpdateUserRole(
                                  u.uid,
                                  e.target.value as PlatformRole
                                );
                                showFlash(
                                  `Updated @${u.username} role to ${e.target.value}.`
                                );
                              }}
                              className="h-8 px-2.5 rounded-lg bg-[#17171F] border border-[#282631] text-xs text-[#F5F3FA]"
                            >
                              <option value="member">Member</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                              <option value="secondary_owner">
                                Secondary Owner
                              </option>
                            </select>
                          )}

                          <select
                            value={u.nitroTier}
                            onChange={async (e) => {
                              await onGrantOrRevokeNitro(
                                u.uid,
                                e.target.value as 'free' | 'basic' | 'nitro'
                              );
                              showFlash(
                                `Updated @${u.username} APEX tier to ${e.target.value}.`
                              );
                            }}
                            className="h-8 px-2.5 rounded-lg bg-[#17171F] border border-[#A47BFF]/30 text-xs text-[#A47BFF]"
                          >
                            <option value="free">DOOMCORD FREE</option>
                            <option value="basic">DOOMCORD APEX</option>
                            <option value="nitro">DOOMCORD APEX+</option>
                          </select>

                          <button
                            onClick={async () => {
                              await onModerateUser(
                                u.uid,
                                u.isBanned ? 'unban' : 'ban'
                              );
                              showFlash(
                                `${u.isBanned ? 'Unbanned' : 'Banned'} @${u.username}.`
                              );
                            }}
                            className="h-8 px-3 rounded-lg bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs text-[#E57373]"
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 3. MULTIPLE OWNERS SYSTEM (#35) */}
        {activeTab === 'owners' && (
          <div className="space-y-6">
            {/* Root Owner Protected Card */}
            <div className="p-6 rounded-xl bg-[#101014] border border-[#A47BFF]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A47BFF]">
                  <Shield className="w-4 h-4" />
                  <span>Main Owner — Root Authority (root_owner)</span>
                </div>
                <h2 className="text-lg font-display font-bold text-[#F5F3FA] mt-1">
                  Permanent Root Owner Protection Active
                </h2>
                <p className="text-xs text-[#A19DAD] mt-1">
                  Account UUID <span className="font-mono text-[#F5F3FA]">{ROOT_OWNER_UUID}</span> (razorpay@admin.doom) is permanently protected by Firestore security rules and server guards. Secondary owners can never demote, suspend, or modify the Main Owner.
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-[#17171F] border border-[#A47BFF]/40 text-xs font-mono text-[#A47BFF] shrink-0">
                ROOT OWNER IMMUTABLE
              </span>
            </div>

            {/* Create New Secondary Owner Invitation (Main Owner Only) */}
            {isRoot && (
              <div className="p-6 rounded-xl bg-[#101014] border border-[#282631] space-y-4">
                <div>
                  <h3 className="text-sm font-display font-bold text-[#F5F3FA]">
                    Owner Management → Create New Owner
                  </h3>
                  <p className="text-xs text-[#A19DAD] mt-0.5">
                    Invite a trusted team member to become a Secondary Owner (`secondary_owner`). They will set their own password securely upon accepting the invitation link.
                  </p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!inviteEmail.trim()) return;
                    try {
                      const inv = await onCreateOwnerInvite(
                        inviteEmail.trim(),
                        inviteName.trim() || undefined
                      );
                      const link = `${window.location.origin}/?owner_invite=${inv.inviteToken}`;
                      setCreatedInviteLink(link);
                      setInviteEmail('');
                      setInviteName('');
                      showFlash(`Created Secondary Owner invitation for ${inv.email}.`);
                    } catch (err: any) {
                      showFlash(err.message || 'Failed to create owner invite.');
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <input
                    type="email"
                    placeholder="New owner email address..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-10 px-3.5 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Optional display name..."
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="h-10 px-3.5 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] outline-none"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-lg bg-[#8957F5] hover:bg-[#7846E4] text-white font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Owner Invitation</span>
                  </button>
                </form>

                {createdInviteLink && (
                  <div className="p-4 rounded-xl bg-[#17171F] border border-[#8957F5]/30 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono uppercase text-[#8957F5]">
                        Single-Use Secondary Owner Onboarding Link
                      </div>
                      <div className="text-xs font-mono text-[#F5F3FA] truncate mt-1">
                        {createdInviteLink}
                      </div>
                    </div>
                    <button
                      onClick={() => copyText(createdInviteLink, 'owner_inv')}
                      className="h-8 px-3 rounded-lg bg-[#8957F5] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      {copiedId === 'owner_inv' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Registered Owners & Secondary Owner Permission Controls */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#A19DAD]">
                Registered Platform Owners ({ownerAccounts.length})
              </h3>
              {ownerAccounts.map((ownerAcc) => {
                const isAccRoot = isRootOwner(ownerAcc.uid);
                const perms = ownerAcc.secondaryOwnerPermissions || {
                  canManageUsers: true,
                  canManageCommunities: true,
                  canManageApexPlans: true,
                  canManageCosmetics: true,
                  canCreateGifts: true,
                  canManageReceipts: true,
                  canProcessRefunds: false,
                };

                return (
                  <div
                    key={ownerAcc.uid}
                    className="p-5 rounded-xl bg-[#101014] border border-[#282631] space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-display font-bold text-[#F5F3FA]">
                            {ownerAcc.displayName}
                          </span>
                          <span className="text-xs font-mono text-[#706C7B]">
                            @{ownerAcc.username}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                              isAccRoot
                                ? 'bg-[#A47BFF]/20 text-[#A47BFF] border border-[#A47BFF]/40'
                                : 'bg-[#8957F5]/15 text-[#8957F5] border border-[#8957F5]/30'
                            }`}
                          >
                            {isAccRoot ? 'ROOT OWNER' : 'SECONDARY OWNER'}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[#A19DAD] mt-1">
                          {ownerAcc.email} · Created{' '}
                          {new Date(ownerAcc.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {!isAccRoot && isRoot && (
                        <button
                          onClick={async () => {
                            await onUpdateUserRole(ownerAcc.uid, 'member');
                            showFlash(
                              `Revoked Secondary Owner status from @${ownerAcc.username}.`
                            );
                          }}
                          className="h-8 px-3 rounded-lg bg-[#17171F] hover:bg-[#22212C] border border-[#E57373]/30 text-xs text-[#E57373]"
                        >
                          Revoke Owner Role
                        </button>
                      )}
                    </div>

                    {!isAccRoot && isRoot && (
                      <div className="pt-3 border-t border-[#282631]">
                        <div className="text-[11px] font-mono uppercase text-[#706C7B] mb-2.5">
                          Granular Secondary Owner Permissions
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {(
                            [
                              { key: 'canManageUsers', label: 'Manage Users' },
                              {
                                key: 'canManageCommunities',
                                label: 'Manage Communities',
                              },
                              {
                                key: 'canManageApexPlans',
                                label: 'Manage APEX Plans',
                              },
                              {
                                key: 'canManageCosmetics',
                                label: 'Manage Cosmetics',
                              },
                              { key: 'canCreateGifts', label: 'Create Gifts' },
                              {
                                key: 'canManageReceipts',
                                label: 'Create Receipts',
                              },
                              {
                                key: 'canProcessRefunds',
                                label: 'Process Refunds',
                              },
                            ] as const
                          ).map((p) => (
                            <label
                              key={p.key}
                              className="flex items-center gap-2 p-2 rounded-lg bg-[#17171F] border border-[#282631] text-xs text-[#F5F3FA] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(perms[p.key])}
                                onChange={async (e) => {
                                  const updated = {
                                    ...perms,
                                    [p.key]: e.target.checked,
                                  };
                                  await onUpdateSecondaryOwnerPermissions(
                                    ownerAcc.uid,
                                    updated
                                  );
                                  showFlash(
                                    `Updated permissions for @${ownerAcc.username}.`
                                  );
                                }}
                                className="accent-[#8957F5]"
                              />
                              <span>{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pending Owner Invitations */}
            {ownerInvitations.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#A19DAD]">
                  Owner Invitations History ({ownerInvitations.length})
                </h3>
                {ownerInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-xl bg-[#101014] border border-[#282631] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#F5F3FA]">
                        {inv.email}{' '}
                        <span className="font-mono text-[#8957F5] uppercase ml-2">
                          [{inv.status}]
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#706C7B]">
                        Token: {inv.tokenPreview} · Created{' '}
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {inv.status === 'pending' && isRoot && (
                      <button
                        onClick={() => onRevokeOwnerInvite(inv.id)}
                        className="h-8 px-3 rounded-lg bg-[#17171F] text-xs text-[#E57373]"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. OWNER UNLIMITED GIFTING STUDIO (#28-#31) */}
        {activeTab === 'gifts' && (
          <div className="space-y-6">
            {canCreateGifts ? (
              <div className="p-6 rounded-xl bg-[#101014] border border-[#282631] space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-display font-bold text-[#F5F3FA]">
                      Owner Unlimited Gifting Studio (₹0 Complimentary)
                    </h2>
                    <p className="text-xs text-[#A19DAD] mt-0.5">
                      Generate single-use gift links for DOOMCORD APEX, DOOMCORD APEX+, Lifetime APEX+, or any Cosmetic item without payment.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded bg-[#17171F] border border-[#8957F5]/30 text-xs font-mono text-[#8957F5]">
                    COST: ₹0 INR
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#A19DAD] block mb-1.5">
                      APEX Membership Tier
                    </label>
                    <select
                      value={giftApexTier}
                      onChange={(e) =>
                        setGiftApexTier(
                          e.target.value as 'none' | 'basic' | 'nitro'
                        )
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                    >
                      <option value="nitro">DOOMCORD APEX+ (Full Tier)</option>
                      <option value="basic">DOOMCORD APEX (Basic Tier)</option>
                      <option value="none">Cosmetics Only (No Membership)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#A19DAD] block mb-1.5">
                      Entitlement Duration
                    </label>
                    <select
                      value={giftDuration}
                      onChange={(e) =>
                        setGiftDuration(e.target.value as GiftDuration)
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                    >
                      <option value="lifetime">
                        Lifetime / Permanent (Never Expires)
                      </option>
                      <option value="1y">1 Year (365 Days)</option>
                      <option value="90d">90 Days</option>
                      <option value="30d">30 Days</option>
                      <option value="7d">7 Days</option>
                      <option value="1d">1 Day</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#A19DAD] block mb-1.5">
                      Restrict to @username (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank for anyone with link..."
                      value={giftRecipientUsername}
                      onChange={(e) => setGiftRecipientUsername(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                    />
                  </div>
                </div>

                {/* Optional Cosmetics Selector */}
                <div>
                  <label className="text-xs font-medium text-[#A19DAD] block mb-2">
                    Include Bonus Cosmetics ({giftSelectedCosmetics.length}{' '}
                    selected)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 rounded-lg bg-[#09090D] border border-[#282631]">
                    {cosmetics.map((c) => {
                      const selected = giftSelectedCosmetics.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setGiftSelectedCosmetics((prev) =>
                              selected
                                ? prev.filter((id) => id !== c.id)
                                : [...prev, c.id]
                            )
                          }
                          className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                            selected
                              ? 'bg-[#22212C] border-[#8957F5] text-[#8957F5] font-semibold'
                              : 'bg-[#101014] border-[#282631] text-[#A19DAD]'
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-[#A19DAD] block mb-1.5">
                      Personal Gift Message
                    </label>
                    <input
                      type="text"
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const rec = await onCreateOwnerGift({
                          apexTier: giftApexTier,
                          cosmeticIds: giftSelectedCosmetics,
                          duration: giftDuration,
                          personalMessage: giftMessage,
                          restrictedRecipientUsername:
                            giftRecipientUsername.trim() || undefined,
                          restrictedRecipientEmail:
                            giftRecipientEmail.trim() || undefined,
                        });
                        const url = `${window.location.origin}/?gift=${rec.claimToken}`;
                        setGeneratedGiftUrl(url);
                        showFlash(
                          'Generated complimentary gift link & official receipt!'
                        );
                      } catch (err: any) {
                        showFlash(err.message || 'Failed to create gift.');
                      }
                    }}
                    className="h-10 px-4 rounded-lg bg-[#8957F5] hover:bg-[#7846E4] text-white font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Generate Free Gift Link</span>
                  </button>
                </div>

                {generatedGiftUrl && (
                  <div className="p-4 rounded-xl bg-[#17171F] border border-[#A47BFF]/40 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono uppercase text-[#A47BFF]">
                        Shareable Gift Claim URL (Single-Use)
                      </div>
                      <div className="text-xs font-mono text-[#F5F3FA] truncate mt-1">
                        {generatedGiftUrl}
                      </div>
                    </div>
                    <button
                      onClick={() => copyText(generatedGiftUrl, 'gift_new')}
                      className="h-8 px-3.5 rounded-lg bg-[#8957F5] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      {copiedId === 'gift_new' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Gift Link</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-[#101014] border border-[#282631] text-xs text-[#A19DAD]">
                Your Secondary Owner account does not currently have gift generation permission enabled.
              </div>
            )}

            {/* Gift Records Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#A19DAD]">
                Generated Gifts Ledger ({gifts.length})
              </h3>
              {gifts.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#101014] border border-[#282631] text-center text-xs text-[#A19DAD]">
                  No gifts generated yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {gifts.map((g) => {
                    const giftUrl = g.claimToken
                      ? `${window.location.origin}/?gift=${g.claimToken}`
                      : null;
                    return (
                      <div
                        key={g.id}
                        className="p-4 rounded-xl bg-[#101014] border border-[#282631] flex flex-wrap items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#F5F3FA]">
                              {g.apexTier === 'nitro'
                                ? 'DOOMCORD APEX+'
                                : g.apexTier === 'basic'
                                ? 'DOOMCORD APEX'
                                : 'Cosmetic Bundle'}{' '}
                              ({g.duration.toUpperCase()})
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#17171F] text-[10px] font-mono uppercase text-[#8957F5]">
                              {g.status}
                            </span>
                            {g.isPaidGift ? (
                              <span className="text-[10px] font-mono text-[#A47BFF]">
                                Paid Gift (₹{g.amountPaidINR})
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-[#A19DAD]">
                                Owner Complimentary (₹0)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-[#706C7B] mt-1">
                            Token: {g.tokenPreview} · Created by {g.creatorName}
                            {g.redeemedByEmail
                              ? ` · Redeemed by ${g.redeemedByEmail}`
                              : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {giftUrl && g.status === 'unclaimed' && (
                            <button
                              onClick={() => copyText(giftUrl, g.id)}
                              className="h-8 px-3 rounded-lg bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs text-[#F5F3FA] flex items-center gap-1.5"
                            >
                              {copiedId === g.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#8957F5]" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>
                          )}

                          {g.status === 'unclaimed' && canCreateGifts && (
                            <button
                              onClick={async () => {
                                await onRevokeGift(g.id);
                                showFlash(`Revoked gift ${g.tokenPreview}.`);
                              }}
                              className="h-8 px-3 rounded-lg bg-[#17171F] border border-[#E57373]/30 text-xs text-[#E57373]"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. FINANCE -> RECEIPTS (#36) */}
        {activeTab === 'receipts' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-display font-bold text-[#F5F3FA]">
                  Admin Dashboard → Finance → Receipts
                </h2>
                <p className="text-xs text-[#A19DAD] mt-0.5">
                  Create, customize, download, and manage official Doomcord receipts (`DC-2026-XXXXXX`) with automated duration & expiration tracking.
                </p>
              </div>

              {canManageReceipts && (
                <button
                  onClick={() => setShowReceiptForm(!showReceiptForm)}
                  className="h-9 px-4 rounded-lg bg-[#8957F5] hover:bg-[#7846E4] text-white font-semibold text-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {showReceiptForm ? 'Close Receipt Form' : '+ Create New Receipt'}
                  </span>
                </button>
              )}
            </div>

            {showReceiptForm && canManageReceipts && (
              <form
                onSubmit={handleIssueReceiptSubmit}
                className="p-6 rounded-xl bg-[#101014] border border-[#8957F5]/30 space-y-5"
              >
                <h3 className="text-sm font-display font-bold text-[#F5F3FA]">
                  Create Official Doomcord Receipt
                </h3>

                {/* Quick Select Registered User */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                      Auto-Fill from Registered User
                    </label>
                    <select
                      onChange={(e) => handleSelectReceiptCustomer(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                    >
                      <option value="">Select user or enter manually...</option>
                      {users.map((u) => (
                        <option key={u.uid} value={u.uid}>
                          {u.displayName} (@{u.username}) — {u.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                      Receipt Template Type
                    </label>
                    <select
                      value={rcpType}
                      onChange={(e) => {
                        const val = e.target.value as ReceiptType;
                        setRcpType(val);
                        setRcpTitle(val.replace(' Receipt', ''));
                      }}
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                    >
                      <option value="APEX Membership Receipt">
                        APEX Membership Receipt
                      </option>
                      <option value="APEX+ Membership Receipt">
                        APEX+ Membership Receipt
                      </option>
                      <option value="Cosmetic Purchase Receipt">
                        Cosmetic Purchase Receipt
                      </option>
                      <option value="Decoration Purchase Receipt">
                        Decoration Purchase Receipt
                      </option>
                      <option value="APEX Gift Receipt">APEX Gift Receipt</option>
                      <option value="Lifetime Membership Receipt">
                        Lifetime Membership Receipt
                      </option>
                      <option value="Lifetime Cosmetic Receipt">
                        Lifetime Cosmetic Receipt
                      </option>
                      <option value="Custom Service Receipt">
                        Custom Service Receipt
                      </option>
                      <option value="Complimentary Gift Receipt">
                        Complimentary Gift Receipt
                      </option>
                      <option value="Refund Receipt">Refund Receipt</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                      Payment Status
                    </label>
                    <select
                      value={rcpPaymentStatus}
                      onChange={(e) =>
                        setRcpPaymentStatus(
                          e.target.value as ReceiptPaymentStatus
                        )
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Complimentary">Complimentary (₹0)</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-[#A19DAD] block mb-1">
                      Customer Username
                    </label>
                    <input
                      type="text"
                      value={rcpCustomerUsername}
                      onChange={(e) => setRcpCustomerUsername(e.target.value)}
                      placeholder="username"
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#A19DAD] block mb-1">
                      Customer Display Name
                    </label>
                    <input
                      type="text"
                      value={rcpCustomerDisplayName}
                      onChange={(e) => setRcpCustomerDisplayName(e.target.value)}
                      placeholder="Display Name"
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#A19DAD] block mb-1">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      value={rcpCustomerEmail}
                      onChange={(e) => setRcpCustomerEmail(e.target.value)}
                      placeholder="user@domain.com"
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#A19DAD] block mb-1">
                      Customer UUID
                    </label>
                    <input
                      type="text"
                      value={rcpCustomerUid}
                      onChange={(e) => setRcpCustomerUid(e.target.value)}
                      placeholder="UUID"
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Line Item & Duration Configuration */}
                <div className="p-4 rounded-xl bg-[#09090D] border border-[#282631] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#8957F5]">
                      Product / Service Line Item & Duration Configuration
                    </span>
                    <button
                      type="button"
                      onClick={handleAddReceiptLineItem}
                      className="text-xs text-[#8957F5] hover:underline"
                    >
                      + Add Another Line Item
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-2">
                      <label className="text-[11px] text-[#A19DAD] block mb-1">
                        Product or Service Name
                      </label>
                      <input
                        type="text"
                        value={rcpItemName}
                        onChange={(e) => setRcpItemName(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-[#101014] border border-[#282631] text-xs text-[#F5F3FA]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#A19DAD] block mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={rcpItemQty}
                        onChange={(e) => setRcpItemQty(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg bg-[#101014] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#A19DAD] block mb-1">
                        Unit Price (₹ INR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={rcpItemPrice}
                        onChange={(e) => setRcpItemPrice(Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg bg-[#101014] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#A19DAD] block mb-1">
                        Discount (₹ INR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={rcpItemDiscount}
                        onChange={(e) =>
                          setRcpItemDiscount(Number(e.target.value))
                        }
                        className="w-full h-9 px-3 rounded-lg bg-[#101014] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                      />
                    </div>
                  </div>

                  {/* Duration Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] text-[#A19DAD] block mb-1">
                        Service Duration Preset
                      </label>
                      <select
                        value={rcpDurationPreset}
                        onChange={(e) =>
                          setRcpDurationPreset(
                            e.target.value as ReceiptDurationPreset
                          )
                        }
                        className="w-full h-9 px-3 rounded-lg bg-[#101014] border border-[#282631] text-xs text-[#F5F3FA]"
                      >
                        <option value="1d">1 Day</option>
                        <option value="3d">3 Days</option>
                        <option value="7d">7 Days</option>
                        <option value="15d">15 Days</option>
                        <option value="30d">30 Days</option>
                        <option value="60d">60 Days</option>
                        <option value="90d">90 Days</option>
                        <option value="180d">180 Days</option>
                        <option value="1y">1 Year</option>
                        <option value="lifetime">
                          Lifetime / Permanent (LIFETIME — NO EXPIRATION)
                        </option>
                        <option value="custom">Custom Duration...</option>
                      </select>
                    </div>

                    {rcpDurationPreset === 'custom' && (
                      <>
                        <div>
                          <label className="text-[11px] text-[#A19DAD] block mb-1">
                            Custom Duration Value
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={rcpCustomVal}
                            onChange={(e) =>
                              setRcpCustomVal(Number(e.target.value))
                            }
                            className="w-full h-9 px-3 rounded-lg bg-[#101014] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#A19DAD] block mb-1">
                            Custom Unit
                          </label>
                          <select
                            value={rcpCustomUnit}
                            onChange={(e) =>
                              setRcpCustomUnit(
                                e.target.value as CustomDurationUnit
                              )
                            }
                            className="w-full h-9 px-3 rounded-lg bg-[#101014] border border-[#282631] text-xs text-[#F5F3FA]"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Method, Transaction ID, Notes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-[#A19DAD] block mb-1">
                      Payment Method
                    </label>
                    <input
                      type="text"
                      value={rcpPaymentMethod}
                      onChange={(e) => setRcpPaymentMethod(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#A19DAD] block mb-1">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={rcpTxId}
                      onChange={(e) => setRcpTxId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#A19DAD] block mb-1">
                      Additional Notes
                    </label>
                    <input
                      type="text"
                      value={rcpNotes}
                      onChange={(e) => setRcpNotes(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowReceiptForm(false)}
                    className="h-9 px-4 rounded-lg bg-[#17171F] text-xs text-[#A19DAD]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-5 rounded-lg bg-[#8957F5] text-white font-semibold text-xs"
                  >
                    Issue Official Receipt
                  </button>
                </div>
              </form>
            )}

            {/* Receipts Management Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#A19DAD]">
                  Issued Receipts ({receipts.length})
                </span>
                <input
                  type="text"
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  placeholder="Search DC-2026-..., username, or email..."
                  className="h-8 px-3 rounded-lg bg-[#101014] border border-[#282631] text-xs text-[#F5F3FA] outline-none w-64"
                />
              </div>

              {receipts.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#101014] border border-[#282631] text-center text-xs text-[#A19DAD]">
                  No receipts issued yet. Click "+ Create New Receipt" above or complete an APEX purchase/gift to generate one.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {receipts
                    .filter((r) => {
                      if (!receiptSearch.trim()) return true;
                      const q = receiptSearch.toLowerCase();
                      return (
                        r.receiptNumber.toLowerCase().includes(q) ||
                        r.customerUsername.toLowerCase().includes(q) ||
                        r.customerEmail.toLowerCase().includes(q) ||
                        r.title.toLowerCase().includes(q)
                      );
                    })
                    .map((rcp) => {
                      const exp = getReceiptExpirationInfo(
                        rcp.serviceExpiryDate
                      );
                      const shareUrl = `${window.location.origin}/?receipt=${rcp.receiptNumber}&token=${rcp.accessToken}`;
                      return (
                        <div
                          key={rcp.id}
                          className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-mono font-bold text-[#8957F5]">
                                  {rcp.receiptNumber}
                                </span>
                                <span className="text-sm font-semibold text-[#F5F3FA]">
                                  {rcp.title}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[#17171F] text-[10px] font-mono uppercase text-[#A47BFF]">
                                  {rcp.paymentStatus}
                                </span>
                              </div>
                              <p className="text-xs text-[#A19DAD] mt-1 font-mono tabular-nums">
                                Customer: {rcp.customerDisplayName} (@
                                {rcp.customerUsername}) · ₹{rcp.totalAmountINR}{' '}
                                INR · Duration: {rcp.serviceDurationLabel} (
                                {exp.remainingLabel})
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onOpenReceiptModal(rcp)}
                                className="h-8 px-3 rounded-lg bg-[#8957F5] text-white text-xs font-semibold flex items-center gap-1.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>View / Print PDF</span>
                              </button>

                              <button
                                onClick={() => copyText(shareUrl, rcp.id)}
                                className="h-8 px-3 rounded-lg bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs text-[#F5F3FA] flex items-center gap-1.5"
                              >
                                {copiedId === rcp.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#8957F5]" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Share Link</span>
                                  </>
                                )}
                              </button>

                              {canManageReceipts && (
                                <button
                                  onClick={() => {
                                    setEditingReceiptId(
                                      editingReceiptId === rcp.id
                                        ? null
                                        : rcp.id
                                    );
                                    setEditReceiptNotes(rcp.notes);
                                    setEditReceiptReason('');
                                  }}
                                  className="h-8 px-3 rounded-lg bg-[#17171F] border border-[#282631] text-xs text-[#A19DAD] hover:text-[#F5F3FA]"
                                >
                                  Amend Notes
                                </button>
                              )}
                            </div>
                          </div>

                          {editingReceiptId === rcp.id && (
                            <div className="pt-3 border-t border-[#282631] grid grid-cols-1 md:grid-cols-3 gap-2.5">
                              <input
                                type="text"
                                value={editReceiptNotes}
                                onChange={(e) =>
                                  setEditReceiptNotes(e.target.value)
                                }
                                placeholder="Updated receipt notes..."
                                className="h-8 px-3 rounded bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                              />
                              <input
                                type="text"
                                value={editReceiptReason}
                                onChange={(e) =>
                                  setEditReceiptReason(e.target.value)
                                }
                                placeholder="Audit reason for metadata amendment..."
                                className="h-8 px-3 rounded bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                              />
                              <button
                                onClick={async () => {
                                  if (!editReceiptReason.trim()) return;
                                  await onCorrectReceiptMetadata(
                                    rcp.id,
                                    editReceiptNotes,
                                    editReceiptReason
                                  );
                                  setEditingReceiptId(null);
                                  showFlash(
                                    `Recorded audited metadata correction on ${rcp.receiptNumber}.`
                                  );
                                }}
                                className="h-8 px-3 rounded bg-[#8957F5] text-white text-xs font-semibold"
                              >
                                Save Audited Amendment
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. APEX PLANS */}
        {activeTab === 'nitro_plans' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {nitroPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-5 rounded-xl bg-[#101014] border border-[#282631] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-display font-bold text-[#F5F3FA]">
                    {plan.name}
                  </h3>
                  <Crown className="w-4 h-4 text-[#A47BFF]" />
                </div>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[#A19DAD] block mb-1">
                      Monthly Price (₹ INR)
                    </label>
                    <input
                      type="number"
                      value={plan.monthlyPriceINR}
                      onChange={(e) =>
                        onUpdateNitroPlan({
                          ...plan,
                          monthlyPriceINR: Number(e.target.value),
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-[#F5F3FA] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[#A19DAD] block mb-1">
                      Yearly Price (₹ INR)
                    </label>
                    <input
                      type="number"
                      value={plan.yearlyPriceINR}
                      onChange={(e) =>
                        onUpdateNitroPlan({
                          ...plan,
                          yearlyPriceINR: Number(e.target.value),
                        })
                      }
                      className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-[#F5F3FA] font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 7. COSMETICS */}
        {activeTab === 'cosmetics' && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateCosmetic}
              className="p-5 rounded-xl bg-[#101014] border border-[#282631] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
            >
              <div>
                <label className="text-[11px] text-[#A19DAD] block mb-1">
                  Cosmetic Name
                </label>
                <input
                  type="text"
                  value={newCosmName}
                  onChange={(e) => setNewCosmName(e.target.value)}
                  placeholder="Emerald Halo"
                  className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-[#A19DAD] block mb-1">
                  Category
                </label>
                <select
                  value={newCosmCategory}
                  onChange={(e) =>
                    setNewCosmCategory(e.target.value as CosmeticCategory)
                  }
                  className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                >
                  <option value="Avatar Decorations">Avatar Decorations</option>
                  <option value="Profile Effects">Profile Effects</option>
                  <option value="Profile Themes">Profile Themes</option>
                  <option value="Nameplates">Nameplates</option>
                  <option value="Profile Badges">Profile Badges</option>
                  <option value="Banners">Banners</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#A19DAD] block mb-1">
                  Price (₹ INR)
                </label>
                <input
                  type="number"
                  value={newCosmPrice}
                  onChange={(e) => setNewCosmPrice(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#A19DAD] block mb-1">
                  Rarity
                </label>
                <select
                  value={newCosmRarity}
                  onChange={(e) =>
                    setNewCosmRarity(e.target.value as CosmeticRarity)
                  }
                  className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA]"
                >
                  <option value="Common">Common</option>
                  <option value="Rare">Rare</option>
                  <option value="Epic">Epic</option>
                  <option value="Legendary">Legendary</option>
                  <option value="Mythic">Mythic</option>
                </select>
              </div>
              <button
                type="submit"
                className="h-9 px-4 rounded-lg bg-[#8957F5] text-white font-semibold text-xs"
              >
                + Add Cosmetic
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cosmetics.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[#101014] border border-[#282631] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#F5F3FA]">
                      {c.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#A19DAD]">
                      {c.category} · ₹{c.priceINR} INR · {c.rarity}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onSaveCosmetic({ ...c, enabled: !c.enabled })
                    }
                    className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase ${
                      c.enabled
                        ? 'bg-[#8957F5]/20 text-[#8957F5]'
                        : 'bg-white/5 text-[#706C7B]'
                    }`}
                  >
                    {c.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. RAZORPAY & TRANSACTIONS */}
        {activeTab === 'razorpay' && (
          <div className="space-y-6">
            <form
              onSubmit={handleSaveRazorpayConfig}
              className="p-6 rounded-xl bg-[#101014] border border-[#282631] space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-display font-bold text-[#F5F3FA]">
                  Razorpay Gateway Configuration (INR)
                </h3>
                <span className="text-xs font-mono text-[#8957F5]">
                  Status:{' '}
                  {rzpStatus?.configured ? 'LIVE KEYS SET' : 'AWAITING KEYS'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#A19DAD] block mb-1">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    value={rzpKeyId}
                    onChange={(e) => setRzpKeyId(e.target.value)}
                    placeholder="rzp_live_..."
                    className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A19DAD] block mb-1">
                    Razorpay Key Secret (Server-Only)
                  </label>
                  <input
                    type="password"
                    value={rzpKeySecret}
                    onChange={(e) => setRzpKeySecret(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-9 px-3 rounded-lg bg-[#09090D] border border-[#282631] text-xs text-[#F5F3FA] font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="h-9 px-4 rounded-lg bg-[#8957F5] text-white font-semibold text-xs"
              >
                Save Razorpay Configuration
              </button>
            </form>
          </div>
        )}

        {/* 9. COMMUNITIES & ORBS MODERATION */}
        {activeTab === 'moderation' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase text-[#A19DAD]">
                Communities ({communities.length})
              </h3>
              {communities.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[#101014] border border-[#282631] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#F5F3FA]">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-[#706C7B] font-mono">
                      {c.members?.length || 1} members
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteCommunity(c.id)}
                    className="p-2 rounded-lg text-[#E57373] hover:bg-[#17171F]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase text-[#A19DAD]">
                Orbs ({orbs.length})
              </h3>
              {orbs.map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-xl bg-[#101014] border border-[#282631] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#F5F3FA]">
                      {o.name}
                    </div>
                    <div className="text-[11px] text-[#706C7B] font-mono">
                      {o.category} · {o.memberCount || 1} members
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteOrb(o.id)}
                    className="p-2 rounded-lg text-[#E57373] hover:bg-[#17171F]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. SECURITY AUDIT REPORT (#32) */}
        {activeTab === 'security_audit' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-[#101014] border border-[#8957F5]/30">
              <h2 className="text-sm font-display font-bold text-[#F5F3FA]">
                Comprehensive Platform Security Audit & Hardening Report (#32)
              </h2>
              <p className="text-xs text-[#A19DAD] mt-1">
                All 10 security domains audited and verified across Authentication, Authorization, Firestore Rules, Razorpay HMAC Verification, and Cryptographic Gift/Receipt Tokens.
              </p>
            </div>

            <div className="space-y-3">
              {SECURITY_AUDIT_REPORT_DATA.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#8957F5]">
                        {item.id}
                      </span>
                      <span className="text-xs font-semibold text-[#F5F3FA]">
                        {item.vulnerability}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#17171F] text-[10px] font-mono text-[#8957F5]">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#A19DAD]">
                    <strong className="text-[#F5F3FA]">Remediation:</strong>{' '}
                    {item.fixImplemented}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. AUDIT LOGS */}
        {activeTab === 'system_audit' && (
          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-[#101014] border border-[#282631] flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-mono text-[#8957F5] font-semibold">
                    {log.action}
                  </span>
                  <span className="text-[#A19DAD] ml-2">{log.details}</span>
                </div>
                <span className="text-[11px] font-mono text-[#706C7B] shrink-0 tabular-nums">
                  {log.actorEmail} · {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
