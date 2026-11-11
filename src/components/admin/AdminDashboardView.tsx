import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Crown,
  ShoppingBag,
  CreditCard,
  Activity,
  FileText,
  Settings,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RotateCcw,
  Trash2,
  Database,
  Megaphone,
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
} from '../../types';

interface AdminDashboardViewProps {
  currentUser: UserProfile;
  authToken: string | null;
  users: UserProfile[];
  communities: Community[];
  orbs: OrbData[];
  nitroPlans: NitroPlanConfig[];
  cosmetics: CosmeticItem[];
  transactions: TransactionRecord[];
  auditLogs: AuditLogEntry[];
  systemConfig: SystemConfigData;
  onUpdateNitroPlan: (plan: NitroPlanConfig) => Promise<void>;
  onSaveCosmetic: (item: CosmeticItem) => Promise<void>;
  onDeleteCommunity: (communityId: string) => Promise<void>;
  onDeleteOrb: (orbId: string) => Promise<void>;
  onUpdateUserRole: (targetUid: string, newRole: PlatformRole) => Promise<void>;
  onModerateUser: (
    targetUid: string,
    action: 'ban' | 'unban' | 'suspend' | 'unsuspend'
  ) => Promise<void>;
  onGrantOrRevokeNitro: (targetUid: string, tier: 'free' | 'basic' | 'nitro') => Promise<void>;
  onGrantOrRevokeCosmetic: (
    targetUid: string,
    cosmeticId: string,
    mode: 'grant' | 'revoke'
  ) => Promise<void>;
  onRefundTransaction: (tx: TransactionRecord) => Promise<void>;
  onUpdateSystemConfig: (cfg: Partial<SystemConfigData>) => Promise<void>;
}

type AdminTab =
  | 'overview'
  | 'users'
  | 'nitro_plans'
  | 'cosmetics'
  | 'razorpay'
  | 'moderation'
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
  auditLogs,
  systemConfig,
  onUpdateNitroPlan,
  onSaveCosmetic,
  onDeleteCommunity,
  onDeleteOrb,
  onUpdateUserRole,
  onModerateUser,
  onGrantOrRevokeNitro,
  onGrantOrRevokeCosmetic,
  onRefundTransaction,
  onUpdateSystemConfig,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Razorpay config state
  const [rzpStatus, setRzpStatus] = useState<any>(null);
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState('');
  const [merchantUpi, setMerchantUpi] = useState(
    systemConfig.merchantUpiId || 'adrenoxshriyans@fam'
  );

  // New Cosmetic Form State
  const [newCosmName, setNewCosmName] = useState('');
  const [newCosmDesc, setNewCosmDesc] = useState('');
  const [newCosmCategory, setNewCosmCategory] =
    useState<CosmeticCategory>('Avatar Decorations');
  const [newCosmPrice, setNewCosmPrice] = useState(39);
  const [newCosmRarity, setNewCosmRarity] = useState<CosmeticRarity>('Rare');
  const [newCosmColor1, setNewCosmColor1] = useState('#10b981');
  const [newCosmColor2, setNewCosmColor2] = useState('#f97316');

  // System Announcement State
  const [announcementInput, setAnnouncementInput] = useState(
    systemConfig.globalAnnouncement || ''
  );
  const [discountInput, setDiscountInput] = useState(
    systemConfig.globalDiscountPercent || 0
  );

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

  if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[oklch(0.2_0.03_160)]">
        <div className="max-w-md p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-[oklch(0.72_0.15_355)]/40 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-[oklch(0.72_0.15_355)] mx-auto" />
          <h2 className="text-base font-bold text-white">Access Denied</h2>
          <p className="text-xs text-[oklch(0.7_0.03_155)]">
            This area is restricted to authorized Doomcord Administrators and the Platform Owner.
          </p>
        </div>
      </div>
    );
  }

  const showFlash = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Real Aggregated Metrics from Firestore
  const verifiedTransactions = transactions.filter(
    (t) => t.status === 'verified' || t.status === 'captured'
  );
  const totalRevenueINR = verifiedTransactions.reduce((sum, t) => sum + (t.amountINR || 0), 0);
  const activeNitroUsersCount = users.filter((u) => u.nitroTier !== 'free').length;

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
      const statusRes = await fetch('/api/razorpay/status').then((r) => r.json());
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
      description: newCosmDesc.trim() || `Original Doomcord ${newCosmCategory} cosmetic.`,
      category: newCosmCategory,
      priceINR: Number(newCosmPrice) || 39,
      rarity: newCosmRarity,
      nitroEligible: 'basic',
      cssPreviewClass: 'ring-4 ring-[oklch(0.85_0.12_165)]',
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

  return (
    <div className="flex-1 flex flex-col h-full bg-[oklch(0.2_0.03_160)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-8 py-4 bg-[oklch(0.17_0.028_161)] border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-[oklch(0.84_0.14_85)] to-[oklch(0.72_0.16_32)] text-black shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">
              Owner & Monetization Administration
            </h1>
            <p className="text-xs text-[oklch(0.7_0.03_155)] font-mono">
              Authenticated as {currentUser.email} · Role: {currentUser.role.toUpperCase()} · UUID:{' '}
              {currentUser.uid}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className="px-4 py-2 rounded-xl bg-[oklch(0.85_0.12_165)]/20 border border-[oklch(0.85_0.12_165)]/40 text-xs font-semibold text-[oklch(0.85_0.12_165)]">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="px-8 py-2.5 bg-[oklch(0.14_0.025_162)] border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Analytics & Revenue', icon: Activity },
          { id: 'users', label: `Users & Roles (${users.length})`, icon: Users },
          { id: 'nitro_plans', label: 'Nitro Plans & INR Pricing', icon: Crown },
          { id: 'cosmetics', label: `Cosmetics Shop (${cosmetics.length})`, icon: ShoppingBag },
          { id: 'razorpay', label: 'Razorpay & Transactions', icon: CreditCard },
          { id: 'moderation', label: 'Communities & Orbs Moderation', icon: Shield },
          { id: 'system_audit', label: `System & Audit Logs (${auditLogs.length})`, icon: Database },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                active
                  ? 'bg-[oklch(0.235_0.032_158)] text-[oklch(0.85_0.12_165)]'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* 1. OVERVIEW & REAL REVENUE ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10">
                <span className="text-xs text-[oklch(0.7_0.03_155)]">Verified Revenue (INR)</span>
                <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
                  ₹{totalRevenueINR}
                </div>
                <span className="text-[11px] text-[oklch(0.85_0.12_165)] font-mono">
                  {verifiedTransactions.length} verified payment(s)
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10">
                <span className="text-xs text-[oklch(0.7_0.03_155)]">Registered Users</span>
                <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
                  {users.length}
                </div>
                <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                  {activeNitroUsersCount} with active Nitro
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10">
                <span className="text-xs text-[oklch(0.7_0.03_155)]">Real Communities & Orbs</span>
                <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
                  {communities.length} / {orbs.length}
                </div>
                <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                  Communities / 3D Orbs
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10">
                <span className="text-xs text-[oklch(0.7_0.03_155)]">Merchant UPI Reference</span>
                <div className="text-base font-bold text-[oklch(0.85_0.12_165)] font-mono mt-1 truncate">
                  {merchantUpi}
                </div>
                <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                  Gateway: {rzpStatus?.configured ? rzpStatus.mode.toUpperCase() : 'Awaiting API Keys'}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white">Real-Data Verification Summary</h3>
              <p className="text-xs text-[oklch(0.7_0.03_155)] leading-relaxed">
                All metrics above are computed directly from live Firestore database queries. No fictional users, communities, Orbs, or fabricated revenue statistics exist.
              </p>
            </div>
          </div>
        )}

        {/* 2. USER MANAGEMENT, ROLES, MODERATION & PROMOTIONAL GRANTS */}
        {activeTab === 'users' && (
          <div className="rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-[oklch(0.14_0.025_162)] border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Registered Platform Accounts ({users.length})
              </h3>
              <span className="text-xs text-[oklch(0.7_0.03_155)]">
                Owner account is strictly protected from downgrade or moderation
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[oklch(0.7_0.03_155)]">
                    <th className="py-3.5 px-6">User / UUID</th>
                    <th className="py-3.5 px-6">System Role</th>
                    <th className="py-3.5 px-6">Nitro Tier</th>
                    <th className="py-3.5 px-6">Promotional Cosmetics</th>
                    <th className="py-3.5 px-6 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => {
                    const isTargetOwner = u.role === 'owner' || u.email === 'razorpay@admin.doom';
                    return (
                      <tr key={u.uid} className="hover:bg-white/5">
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-white">{u.displayName}</div>
                          <div className="text-[11px] font-mono text-[oklch(0.7_0.03_155)]">
                            @{u.username} · {u.email}
                          </div>
                          <div className="text-[10px] font-mono text-[oklch(0.7_0.03_155)]/70">
                            UUID: {u.uid}
                          </div>
                        </td>

                        <td className="py-3.5 px-6">
                          {isTargetOwner ? (
                            <span className="font-mono font-bold text-[oklch(0.84_0.14_85)] uppercase">
                              OWNER (ROOT)
                            </span>
                          ) : (
                            <select
                              value={u.role || 'member'}
                              onChange={async (e) => {
                                await onUpdateUserRole(u.uid, e.target.value as PlatformRole);
                                showFlash(`Updated @${u.username} role to ${e.target.value}.`);
                              }}
                              className="bg-[oklch(0.235_0.032_158)] text-white px-2.5 py-1.5 rounded-lg border border-white/10 outline-none"
                            >
                              <option value="member">member</option>
                              <option value="moderator">moderator</option>
                              <option value="admin">admin</option>
                            </select>
                          )}
                        </td>

                        <td className="py-3.5 px-6">
                          <select
                            value={u.nitroTier || 'free'}
                            onChange={async (e) => {
                              await onGrantOrRevokeNitro(
                                u.uid,
                                e.target.value as 'free' | 'basic' | 'nitro'
                              );
                              showFlash(
                                `Updated @${u.username} Nitro entitlement to ${e.target.value}.`
                              );
                            }}
                            className="bg-[oklch(0.235_0.032_158)] text-white px-2.5 py-1.5 rounded-lg border border-white/10 outline-none"
                          >
                            <option value="free">Free (₹0)</option>
                            <option value="basic">Nitro Basic (Grant)</option>
                            <option value="nitro">Nitro Pro (Grant)</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={async () => {
                                if (cosmetics[0]) {
                                  await onGrantOrRevokeCosmetic(u.uid, cosmetics[0].id, 'grant');
                                  showFlash(`Granted ${cosmetics[0].name} to @${u.username}.`);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[oklch(0.85_0.12_165)]/20 text-[oklch(0.85_0.12_165)] hover:bg-[oklch(0.85_0.12_165)]/30"
                            >
                              + Grant Pack
                            </button>
                            {u.ownedCosmetics && u.ownedCosmetics.length > 0 && (
                              <button
                                onClick={async () => {
                                  const lastId = u.ownedCosmetics[u.ownedCosmetics.length - 1];
                                  await onGrantOrRevokeCosmetic(u.uid, lastId, 'revoke');
                                  showFlash(`Revoked cosmetic ${lastId} from @${u.username}.`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/5 text-[oklch(0.7_0.03_155)] hover:text-white"
                              >
                                Revoke Last ({u.ownedCosmetics.length})
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          {isTargetOwner ? (
                            <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                              Protected
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={async () => {
                                  const action = u.isSuspended ? 'unsuspend' : 'suspend';
                                  await onModerateUser(u.uid, action);
                                  showFlash(
                                    `${action === 'suspend' ? 'Suspended' : 'Unsuspended'} @${u.username}.`
                                  );
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[oklch(0.84_0.14_85)]/20 text-[oklch(0.84_0.14_85)]"
                              >
                                {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                              </button>

                              <button
                                onClick={async () => {
                                  const action = u.isBanned ? 'unban' : 'ban';
                                  await onModerateUser(u.uid, action);
                                  showFlash(
                                    `${action === 'ban' ? 'Banned' : 'Unbanned'} @${u.username}.`
                                  );
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[oklch(0.72_0.15_355)]/20 text-[oklch(0.72_0.15_355)]"
                              >
                                {u.isBanned ? 'Unban' : 'Ban'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. NITRO PLANS & PRICING EDITOR (INR) */}
        {activeTab === 'nitro_plans' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {nitroPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 space-y-4"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-[oklch(0.85_0.12_165)]">
                    Tier ID: {plan.id}
                  </span>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-[oklch(0.7_0.03_155)] block mb-1">
                      Monthly Price (INR)
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
                      className="w-full bg-[oklch(0.235_0.032_158)] text-white px-3 py-2 rounded-xl border border-white/10 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[oklch(0.7_0.03_155)] block mb-1">
                      Yearly Price (INR)
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
                      className="w-full bg-[oklch(0.235_0.032_158)] text-white px-3 py-2 rounded-xl border border-white/10 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[oklch(0.7_0.03_155)] block mb-1">
                      Upload Limit (MB)
                    </label>
                    <input
                      type="number"
                      value={plan.uploadLimitMB}
                      onChange={(e) =>
                        onUpdateNitroPlan({
                          ...plan,
                          uploadLimitMB: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[oklch(0.235_0.032_158)] text-white px-3 py-2 rounded-xl border border-white/10 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[oklch(0.7_0.03_155)] block mb-1">
                      Shop Discount (%)
                    </label>
                    <input
                      type="number"
                      value={plan.shopDiscountPercent}
                      onChange={(e) =>
                        onUpdateNitroPlan({
                          ...plan,
                          shopDiscountPercent: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[oklch(0.235_0.032_158)] text-white px-3 py-2 rounded-xl border border-white/10 font-mono"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-[oklch(0.7_0.03_155)]">
                  Changes sync immediately to Firestore and update the live Nitro Storefront.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 4. COSMETICS SHOP MANAGEMENT */}
        {activeTab === 'cosmetics' && (
          <div className="space-y-6">
            {/* Add New Cosmetic Form */}
            <form
              onSubmit={handleCreateCosmetic}
              className="p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 space-y-4"
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
                <span>Add New Cosmetic Product to Catalog</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Cosmetic Name"
                  value={newCosmName}
                  onChange={(e) => setNewCosmName(e.target.value)}
                  className="bg-[oklch(0.235_0.032_158)] text-white px-3 py-2 rounded-xl border border-white/10 outline-none"
                  required
                />

                <select
                  value={newCosmCategory}
                  onChange={(e) => setNewCosmCategory(e.target.value as CosmeticCategory)}
                  className="bg-[oklch(0.235_0.032_158)] text-white px-3 py-2 rounded-xl border border-white/10 outline-none"
                >
                  {[
                    'Avatar Decorations',
                    'Profile Effects',
                    'Profile Themes',
                    'Nameplates',
                    'Profile Badges',
                    'Banners',
                    'Animated Avatars',
                    'App Themes and Icons',
                    'Chat Cosmetics',
                    'Sound Effects',
                    'Seasonal Collections',
                    'Exclusive Bundles',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Price in INR (e.g. 39)"
                  value={newCosmPrice}
                  onChange={(e) => setNewCosmPrice(Number(e.target.value))}
                  className="bg-[oklch(0.235_0.032_158)] text-white px-3 py-2 rounded-xl border border-white/10 font-mono outline-none"
                  required
                />

                <select
                  value={newCosmRarity}
                  onChange={(e) => setNewCosmRarity(e.target.value as CosmeticRarity)}
                  className="bg-[oklch(0.235_0.032_158)] text-white px-3 py-2 rounded-xl border border-white/10 outline-none"
                >
                  {['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Description..."
                  value={newCosmDesc}
                  onChange={(e) => setNewCosmDesc(e.target.value)}
                  className="flex-1 bg-[oklch(0.235_0.032_158)] text-white px-3 py-2 rounded-xl border border-white/10 outline-none"
                />
                <input
                  type="color"
                  value={newCosmColor1}
                  onChange={(e) => setNewCosmColor1(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  title="Primary Accent"
                />
                <input
                  type="color"
                  value={newCosmColor2}
                  onChange={(e) => setNewCosmColor2(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  title="Secondary Accent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)]"
                >
                  Publish Cosmetic
                </button>
              </div>
            </form>

            {/* Cosmetics Pricing & Status Table */}
            <div className="rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[oklch(0.7_0.03_155)]">
                      <th className="py-3 px-6">Cosmetic Item</th>
                      <th className="py-3 px-6">Category / Rarity</th>
                      <th className="py-3 px-6">Price (INR)</th>
                      <th className="py-3 px-6 text-right">Store Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {cosmetics.map((c) => (
                      <tr key={c.id} className="hover:bg-white/5">
                        <td className="py-3 px-6 font-bold text-white">{c.name}</td>
                        <td className="py-3 px-6 text-[oklch(0.7_0.03_155)]">
                          {c.category} · {c.rarity}
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[oklch(0.7_0.03_155)]">₹</span>
                            <input
                              type="number"
                              value={c.priceINR}
                              onChange={(e) =>
                                onSaveCosmetic({ ...c, priceINR: Number(e.target.value) })
                              }
                              className="w-20 bg-[oklch(0.235_0.032_158)] text-white px-2 py-1 rounded-lg border border-white/10 font-mono"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button
                            onClick={() => onSaveCosmetic({ ...c, enabled: !c.enabled })}
                            className={`px-3 py-1 rounded-lg font-semibold ${
                              c.enabled
                                ? 'bg-[oklch(0.85_0.12_165)]/20 text-[oklch(0.85_0.12_165)]'
                                : 'bg-white/5 text-[oklch(0.7_0.03_155)]'
                            }`}
                          >
                            {c.enabled ? 'Enabled in Shop' : 'Disabled'}
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

        {/* 5. RAZORPAY GATEWAY SETTINGS & TRANSACTIONS / REFUNDS */}
        {activeTab === 'razorpay' && (
          <div className="space-y-6">
            <form
              onSubmit={handleSaveRazorpayConfig}
              className="p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Razorpay Payment Gateway Configuration (INR)
                  </h3>
                  <p className="text-xs text-[oklch(0.7_0.03_155)]">
                    Secrets are stored strictly on the backend server and never exposed to client queries.
                  </p>
                </div>
                <span className="text-xs font-mono text-[oklch(0.85_0.12_165)]">
                  Status: {rzpStatus?.configured ? `${rzpStatus.mode.toUpperCase()} MODE` : 'UNCONFIGURED'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-white font-semibold block mb-1">
                    Razorpay Key ID (RAZORPAY_KEY_ID)
                  </label>
                  <input
                    type="text"
                    value={rzpKeyId}
                    onChange={(e) => setRzpKeyId(e.target.value)}
                    placeholder="rzp_test_... or rzp_live_..."
                    className="w-full bg-[oklch(0.235_0.032_158)] text-white px-3.5 py-2.5 rounded-xl border border-white/10 font-mono"
                  />
                </div>

                <div>
                  <label className="text-white font-semibold block mb-1">
                    Razorpay Key Secret (RAZORPAY_KEY_SECRET)
                  </label>
                  <input
                    type="password"
                    value={rzpKeySecret}
                    onChange={(e) => setRzpKeySecret(e.target.value)}
                    placeholder="Leave blank to keep existing server secret"
                    className="w-full bg-[oklch(0.235_0.032_158)] text-white px-3.5 py-2.5 rounded-xl border border-white/10 font-mono"
                  />
                </div>

                <div>
                  <label className="text-white font-semibold block mb-1">
                    Webhook Secret (RAZORPAY_WEBHOOK_SECRET)
                  </label>
                  <input
                    type="password"
                    value={rzpWebhookSecret}
                    onChange={(e) => setRzpWebhookSecret(e.target.value)}
                    placeholder="Webhook HMAC verification secret"
                    className="w-full bg-[oklch(0.235_0.032_158)] text-white px-3.5 py-2.5 rounded-xl border border-white/10 font-mono"
                  />
                </div>

                <div>
                  <label className="text-white font-semibold block mb-1">
                    Merchant UPI ID Reference
                  </label>
                  <input
                    type="text"
                    value={merchantUpi}
                    onChange={(e) => setMerchantUpi(e.target.value)}
                    className="w-full bg-[oklch(0.235_0.032_158)] text-white px-3.5 py-2.5 rounded-xl border border-white/10 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)]"
              >
                Save Gateway Configuration
              </button>
            </form>

            {/* Transactions & Refund Management */}
            <div className="rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 overflow-hidden">
              <div className="px-6 py-4 bg-[oklch(0.14_0.025_162)] border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  Transaction Logs & Refund Management ({transactions.length})
                </h3>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[oklch(0.7_0.03_155)]">
                  No payment transactions have been recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[oklch(0.7_0.03_155)]">
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-6">User</th>
                        <th className="py-3 px-6">Item</th>
                        <th className="py-3 px-6">Amount</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Refund Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-3 px-6 font-mono text-[oklch(0.7_0.03_155)]">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-6 font-mono text-white">{tx.userEmail}</td>
                          <td className="py-3 px-6 text-white font-semibold">{tx.itemName}</td>
                          <td className="py-3 px-6 font-mono tabular-nums text-white">
                            ₹{tx.amountINR}
                          </td>
                          <td className="py-3 px-6 font-mono uppercase text-[oklch(0.85_0.12_165)]">
                            {tx.status}
                          </td>
                          <td className="py-3 px-6 text-right">
                            {tx.status !== 'refunded' && (
                              <button
                                onClick={async () => {
                                  await onRefundTransaction(tx);
                                  showFlash(`Processed refund for transaction ${tx.id}.`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[oklch(0.72_0.15_355)]/20 text-[oklch(0.72_0.15_355)]"
                              >
                                Process Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. COMMUNITIES & ORBS MODERATION */}
        {activeTab === 'moderation' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white">
                Communities Moderation ({communities.length})
              </h3>
              {communities.length === 0 ? (
                <p className="text-xs text-[oklch(0.7_0.03_155)]">
                  No communities created yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {communities.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/5"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                          ID: {c.id} · Owner: {c.ownerId}
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteCommunity(c.id)}
                        className="p-2 rounded-xl bg-[oklch(0.72_0.15_355)]/20 text-[oklch(0.72_0.15_355)]"
                        title="Delete Community"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white">3D Orbs Moderation ({orbs.length})</h3>
              {orbs.length === 0 ? (
                <p className="text-xs text-[oklch(0.7_0.03_155)]">No Orbs created yet.</p>
              ) : (
                <div className="space-y-2">
                  {orbs.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/5"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{o.name}</div>
                        <div className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                          Category: {o.category} · Creator: {o.creatorName}
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteOrb(o.id)}
                        className="p-2 rounded-xl bg-[oklch(0.72_0.15_355)]/20 text-[oklch(0.72_0.15_355)]"
                        title="Delete Orb"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. SYSTEM CONFIGURATION, ANNOUNCEMENTS & AUDIT LOGS */}
        {activeTab === 'system_audit' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
                <span>Platform-Wide Announcement & Promotional Controls</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="text-white font-semibold block mb-1">
                    Global Announcement Banner Text
                  </label>
                  <input
                    type="text"
                    value={announcementInput}
                    onChange={(e) => setAnnouncementInput(e.target.value)}
                    placeholder="Leave empty to hide banner..."
                    className="w-full bg-[oklch(0.235_0.032_158)] text-white px-3.5 py-2.5 rounded-xl border border-white/10"
                  />
                </div>

                <div>
                  <label className="text-white font-semibold block mb-1">
                    Storewide Promotional Discount (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={discountInput}
                    onChange={(e) => setDiscountInput(Number(e.target.value))}
                    className="w-full bg-[oklch(0.235_0.032_158)] text-white px-3.5 py-2.5 rounded-xl border border-white/10 font-mono"
                  />
                </div>
              </div>

              <button
                onClick={async () => {
                  await onUpdateSystemConfig({
                    globalAnnouncement: announcementInput.trim(),
                    globalDiscountPercent: Number(discountInput) || 0,
                  });
                  showFlash('Updated system configuration and global announcement.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)]"
              >
                Update Platform Settings
              </button>
            </div>

            {/* Audit Trail */}
            <div className="rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 overflow-hidden">
              <div className="px-6 py-4 bg-[oklch(0.14_0.025_162)] border-b border-white/5">
                <h3 className="text-sm font-bold text-white">
                  Immutable Administrative Audit Logs ({auditLogs.length})
                </h3>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[oklch(0.7_0.03_155)]">
                  No administrative actions logged yet.
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-[oklch(0.85_0.12_165)]">
                          [{log.action}]
                        </span>{' '}
                        <span className="text-white">{log.details}</span>
                        <div className="text-[11px] font-mono text-[oklch(0.7_0.03_155)]">
                          Actor: {log.actorEmail} ({log.actorUid})
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-[oklch(0.7_0.03_155)]">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
