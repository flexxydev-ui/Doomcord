import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Crown,
  Zap,
  Shield,
  Download,
  RefreshCw,
  XCircle,
  ArrowUpRight,
  ShoppingBag,
  Receipt,
} from 'lucide-react';
import {
  NitroPlanConfig,
  UserProfile,
  TransactionRecord,
  BillingCycle,
} from '../../types';
import { CheckoutPayload } from '../modals/RazorpayCheckoutModal';

interface NitroViewProps {
  currentUser: UserProfile;
  plans: NitroPlanConfig[];
  userTransactions: TransactionRecord[];
  onStartCheckout: (payload: CheckoutPayload) => void;
  onCancelAutoRenew: () => Promise<void>;
  onReactivateAutoRenew: () => Promise<void>;
  onDowngradeToFree: () => Promise<void>;
  onOpenShop: () => void;
}

export const NitroView: React.FC<NitroViewProps> = ({
  currentUser,
  plans,
  userTransactions,
  onStartCheckout,
  onCancelAutoRenew,
  onReactivateAutoRenew,
  onDowngradeToFree,
  onOpenShop,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'manage'>('plans');

  const freePlan = plans.find((p) => p.tier === 'free') || plans[0];
  const basicPlan = plans.find((p) => p.tier === 'basic') || plans[1];
  const nitroPlan = plans.find((p) => p.tier === 'nitro') || plans[2];

  const handleSelectPlan = (plan: NitroPlanConfig) => {
    if (plan.tier === 'free') return;
    const price = billingCycle === 'yearly' ? plan.yearlyPriceINR : plan.monthlyPriceINR;
    onStartCheckout({
      type: 'nitro_subscription',
      itemId: plan.id,
      itemName: `${plan.name} (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`,
      description: plan.tagline,
      amountINR: price,
      billingCycle,
      tier: plan.tier,
    });
  };

  const downloadInvoiceReceipt = (tx: TransactionRecord) => {
    const receiptText = [
      '====================================================',
      '              DOOMCORD OFFICIAL RECEIPT             ',
      '====================================================',
      `Transaction ID : ${tx.id}`,
      `Order ID       : ${tx.razorpayOrderId || 'N/A'}`,
      `Payment ID     : ${tx.razorpayPaymentId || 'N/A'}`,
      `Date           : ${new Date(tx.createdAt).toUTCString()}`,
      `Customer       : ${currentUser.displayName} (${tx.userEmail})`,
      `Item           : ${tx.itemName}`,
      `Type           : ${tx.type}`,
      `Amount Paid    : ₹${tx.amountINR} INR`,
      `Status         : ${tx.status.toUpperCase()}`,
      'Merchant Ref   : adrenoxshriyans@fam',
      '====================================================',
    ].join('\n');

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doomcord_receipt_${tx.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[oklch(0.2_0.03_160)] overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-[oklch(0.17_0.028_161)] border-b border-white/5 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">Doomcord Nitro</h1>
            <p className="text-xs text-[oklch(0.7_0.03_155)]">
              Unlock custom cosmetics, up to 500 MB uploads, 4,000-character messages & shop discounts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[oklch(0.14_0.025_162)] border border-white/5">
            <button
              onClick={() => setActiveSubTab('plans')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === 'plans'
                  ? 'bg-[oklch(0.235_0.032_158)] text-white'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              Plans & Comparison
            </button>
            <button
              onClick={() => setActiveSubTab('manage')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeSubTab === 'manage'
                  ? 'bg-[oklch(0.235_0.032_158)] text-white'
                  : 'text-[oklch(0.7_0.03_155)] hover:text-white'
              }`}
            >
              Manage Subscription & Billing
            </button>
          </div>

          <button
            onClick={onOpenShop}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] rounded-xl border border-white/10"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
            <span>Cosmetics Shop</span>
          </button>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-10">
        {activeSubTab === 'plans' ? (
          <>
            {/* Hero & Billing Cycle Switcher */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[oklch(0.14_0.025_162)] via-[oklch(0.17_0.028_161)] to-[oklch(0.235_0.032_158)] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl space-y-2">
                <div className="text-xs font-semibold text-[oklch(0.85_0.12_165)]">
                  Current Membership: {currentUser.nitroTier.toUpperCase()}
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Elevate your presence across the forest realm
                </h2>
                <p className="text-xs text-[oklch(0.7_0.03_155)] leading-relaxed">
                  All memberships are billed in Indian Rupees (INR) via Razorpay Checkout. Annual billing saves approximately 15% compared with monthly billing.
                </p>
              </div>

              {/* Monthly / Yearly Toggle */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[oklch(0.14_0.025_162)] border border-white/10 shrink-0">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-[oklch(0.235_0.032_158)] text-white shadow'
                      : 'text-[oklch(0.7_0.03_155)] hover:text-white'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white shadow'
                      : 'text-[oklch(0.7_0.03_155)] hover:text-white'
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="text-[10px] font-mono opacity-95">Save ~15%</span>
                </button>
              </div>
            </div>

            {/* 3 Plan Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {[freePlan, basicPlan, nitroPlan].filter(Boolean).map((plan) => {
                const isCurrent = currentUser.nitroTier === plan.tier;
                const isPro = plan.tier === 'nitro';
                const price =
                  billingCycle === 'yearly' ? plan.yearlyPriceINR : plan.monthlyPriceINR;

                return (
                  <div
                    key={plan.id}
                    className={`flex flex-col justify-between p-6 rounded-3xl border transition-all ${
                      isPro
                        ? 'bg-gradient-to-b from-[oklch(0.235_0.032_158)] to-[oklch(0.17_0.028_161)] border-[oklch(0.85_0.12_165)]/50 shadow-2xl'
                        : 'bg-[oklch(0.17_0.028_161)] border-white/10 shadow-xl'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[oklch(0.85_0.12_165)]">
                          {plan.tier === 'free'
                            ? 'Standard Tier'
                            : plan.tier === 'basic'
                            ? 'Essential Perks'
                            : 'Complete Experience'}
                        </span>
                        {isCurrent && (
                          <span className="text-[11px] font-mono text-[oklch(0.84_0.14_85)]">
                            Active Plan
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-white">{plan.name}</h3>
                      <p className="text-xs text-[oklch(0.7_0.03_155)] mt-1 min-h-[32px]">
                        {plan.tagline}
                      </p>

                      <div className="my-5 pb-5 border-b border-white/10 flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white font-mono tabular-nums">
                          ₹{price}
                        </span>
                        <span className="text-xs text-[oklch(0.7_0.03_155)] font-mono">
                          {plan.tier === 'free'
                            ? 'Forever'
                            : billingCycle === 'yearly'
                            ? '/ year (INR)'
                            : '/ month (INR)'}
                        </span>
                      </div>

                      <ul className="space-y-2.5 mb-6">
                        {plan.benefits.map((benefit, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-xs text-[oklch(0.95_0.015_150)]"
                          >
                            <Check className="w-4 h-4 text-[oklch(0.85_0.12_165)] shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      {plan.tier === 'free' ? (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl bg-white/5 text-[oklch(0.7_0.03_155)] text-xs font-semibold cursor-default"
                        >
                          {isCurrent ? 'Your Current Plan' : 'Included Base Tier'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan(plan)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                            isPro
                              ? 'bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white hover:opacity-95'
                              : 'bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] text-white border border-white/15'
                          }`}
                        >
                          <span>
                            {isCurrent
                              ? `Renew / Switch to ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'}`
                              : currentUser.nitroTier === 'basic' && plan.tier === 'nitro'
                              ? `Upgrade to Nitro (₹${price})`
                              : `Subscribe for ₹${price}`}
                          </span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Comparison Matrix */}
            <div className="rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 overflow-hidden shadow-xl">
              <div className="px-6 py-4 bg-[oklch(0.14_0.025_162)] border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Detailed Plan Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[oklch(0.7_0.03_155)]">
                      <th className="py-3.5 px-6 font-semibold">Capability / Benefit</th>
                      <th className="py-3.5 px-6 font-semibold">Doomcord Free (₹0)</th>
                      <th className="py-3.5 px-6 font-semibold">Nitro Basic (₹49/mo)</th>
                      <th className="py-3.5 px-6 font-semibold text-[oklch(0.85_0.12_165)]">
                        Doomcord Nitro (₹99/mo)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[oklch(0.95_0.015_150)]">
                    <tr>
                      <td className="py-3 px-6 font-medium">Max File Upload Size</td>
                      <td className="py-3 px-6 font-mono tabular-nums">25 MB</td>
                      <td className="py-3 px-6 font-mono tabular-nums">50 MB</td>
                      <td className="py-3 px-6 font-mono tabular-nums text-[oklch(0.85_0.12_165)] font-bold">
                        500 MB
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-6 font-medium">Maximum Message Length</td>
                      <td className="py-3 px-6 font-mono tabular-nums">2,000 chars</td>
                      <td className="py-3 px-6 font-mono tabular-nums">2,500 chars</td>
                      <td className="py-3 px-6 font-mono tabular-nums text-[oklch(0.85_0.12_165)] font-bold">
                        4,000 chars
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-6 font-medium">Animated Avatars & Banners</td>
                      <td className="py-3 px-6 text-[oklch(0.7_0.03_155)]">Static only</td>
                      <td className="py-3 px-6">Animated Avatar</td>
                      <td className="py-3 px-6 text-[oklch(0.85_0.12_165)] font-bold">
                        Animated Avatar + Banner
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-6 font-medium">Profile Effects & Themes</td>
                      <td className="py-3 px-6 text-[oklch(0.7_0.03_155)]">Basic colours</td>
                      <td className="py-3 px-6">Selected themes & frames</td>
                      <td className="py-3 px-6 text-[oklch(0.85_0.12_165)] font-bold">
                        Full Effects, Themes & Per-Server Profiles
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-6 font-medium">Community Boosts Included</td>
                      <td className="py-3 px-6 font-mono tabular-nums">0</td>
                      <td className="py-3 px-6 font-mono tabular-nums">0</td>
                      <td className="py-3 px-6 font-mono tabular-nums text-[oklch(0.85_0.12_165)] font-bold">
                        2 Boosts / cycle
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-6 font-medium">Cosmetics Shop Member Discount</td>
                      <td className="py-3 px-6 font-mono tabular-nums">0%</td>
                      <td className="py-3 px-6 font-mono tabular-nums">10% off</td>
                      <td className="py-3 px-6 font-mono tabular-nums text-[oklch(0.85_0.12_165)] font-bold">
                        20% off
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Subscription Management & Payment History Tab */
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[oklch(0.85_0.12_165)]">
                  Current Subscription Status
                </span>
                <h3 className="text-xl font-black text-white capitalize">
                  Doomcord {currentUser.nitroTier}
                </h3>
                <p className="text-xs text-[oklch(0.7_0.03_155)] font-mono">
                  Billing Cycle: {currentUser.nitroBillingCycle || 'none'} · Auto-Renewal:{' '}
                  {currentUser.nitroAutoRenew ? 'Enabled' : 'Disabled'}
                  {currentUser.nitroExpiresAt
                    ? ` · Expires: ${new Date(currentUser.nitroExpiresAt).toLocaleDateString()}`
                    : ''}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {currentUser.nitroTier !== 'free' && (
                  <>
                    {currentUser.nitroAutoRenew ? (
                      <button
                        onClick={onCancelAutoRenew}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[oklch(0.72_0.15_355)]/20 border border-[oklch(0.72_0.15_355)]/40 text-xs font-semibold text-[oklch(0.72_0.15_355)]"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Auto-Renewal</span>
                      </button>
                    ) : (
                      <button
                        onClick={onReactivateAutoRenew}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[oklch(0.85_0.12_165)]/20 border border-[oklch(0.85_0.12_165)]/40 text-xs font-semibold text-[oklch(0.85_0.12_165)]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reactivate Subscription</span>
                      </button>
                    )}

                    {currentUser.role !== 'owner' && (
                      <button
                        onClick={onDowngradeToFree}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[oklch(0.7_0.03_155)] hover:text-white"
                      >
                        Downgrade to Free
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Verified Payment & Invoice History */}
            <div className="rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 overflow-hidden shadow-xl">
              <div className="px-6 py-4 bg-[oklch(0.14_0.025_162)] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
                  <h3 className="text-sm font-bold text-white">Verified Payment & Invoice History</h3>
                </div>
                <span className="text-xs font-mono text-[oklch(0.7_0.03_155)] tabular-nums">
                  {userTransactions.length} record{userTransactions.length === 1 ? '' : 's'}
                </span>
              </div>

              {userTransactions.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <p className="text-xs text-[oklch(0.7_0.03_155)]">
                    No payment transactions recorded on your account yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[oklch(0.7_0.03_155)]">
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-6">Item</th>
                        <th className="py-3 px-6">Order / Payment ID</th>
                        <th className="py-3 px-6">Amount (INR)</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {userTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/5">
                          <td className="py-3 px-6 font-mono tabular-nums text-[oklch(0.7_0.03_155)]">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-6 font-semibold text-white">{tx.itemName}</td>
                          <td className="py-3 px-6 font-mono text-[11px] text-[oklch(0.7_0.03_155)]">
                            {tx.razorpayPaymentId || tx.razorpayOrderId || tx.id}
                          </td>
                          <td className="py-3 px-6 font-mono tabular-nums text-white">
                            ₹{tx.amountINR}
                          </td>
                          <td className="py-3 px-6 font-mono uppercase text-[11px] text-[oklch(0.85_0.12_165)]">
                            {tx.status}
                          </td>
                          <td className="py-3 px-6 text-right">
                            <button
                              onClick={() => downloadInvoiceReceipt(tx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] text-white text-[11px]"
                            >
                              <Download className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>
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
      </div>
    </div>
  );
};
