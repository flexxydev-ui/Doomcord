import React, { useState } from 'react';
import {
  Check,
  Crown,
  Shield,
  Download,
  RefreshCw,
  XCircle,
  ShoppingBag,
  Receipt,
  Gift,
  FileText,
  Infinity as InfinityIcon,
  User,
  Mail,
  Globe,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  NitroPlanConfig,
  UserProfile,
  TransactionRecord,
  ReceiptRecord,
} from '../../types';
import { CheckoutPayload, GiftCheckoutOptions } from '../modals/RazorpayCheckoutModal';
import { isRootOwner, formatApexTierName } from '../../lib/dataService';

interface NitroViewProps {
  currentUser: UserProfile;
  allUsers?: UserProfile[];
  plans: NitroPlanConfig[];
  userTransactions: TransactionRecord[];
  userReceipts?: ReceiptRecord[];
  onStartCheckout: (payload: CheckoutPayload) => void;
  onCancelAutoRenew: () => Promise<void>;
  onReactivateAutoRenew: () => Promise<void>;
  onDowngradeToFree: () => Promise<void>;
  onOpenShop: () => void;
  onOpenGiftVault?: (initialToken?: string) => void;
  onOpenOwnerGiftingAdmin?: () => void;
  onSelectReceipt?: (receipt: ReceiptRecord) => void;
}

export const NitroView: React.FC<NitroViewProps> = ({
  currentUser,
  allUsers = [],
  plans,
  userTransactions,
  userReceipts = [],
  onStartCheckout,
  onCancelAutoRenew,
  onReactivateAutoRenew,
  onDowngradeToFree,
  onOpenShop,
  onOpenGiftVault,
  onOpenOwnerGiftingAdmin,
  onSelectReceipt,
}) => {
  // Strictly identify Main Owner using protected root_owner role and authentication UUID
  const isMainOwner = isRootOwner(currentUser);

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<'basic' | 'nitro'>('nitro');
  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'manage'>('plans');
  const [quickGiftCode, setQuickGiftCode] = useState('');

  // On-page Membership Purchase & Send as a Gift State (#3)
  const [sendAsGift, setSendAsGift] = useState<boolean>(isMainOwner);
  const [recipientMode, setRecipientMode] = useState<'username' | 'email' | 'anyone'>('anyone');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState(
    'Enjoy your DOOMCORD APEX membership! Rise Above. Stand Apart.'
  );
  const [paymentMethod, setPaymentMethod] = useState<
    'Razorpay UPI / AutoPay' | 'Razorpay Credit / Debit Card' | 'Razorpay NetBanking' | 'Razorpay Wallets'
  >('Razorpay UPI / AutoPay');
  const [validationError, setValidationError] = useState<string | null>(null);

  const freePlan = plans.find((p) => p.tier === 'free') || plans[0];
  const basicPlan = plans.find((p) => p.tier === 'basic') || plans[1];
  const nitroPlan = plans.find((p) => p.tier === 'nitro') || plans[2];

  const activeSelectedPlan = selectedTier === 'basic' ? basicPlan : nitroPlan;
  const activePlanName = selectedTier === 'basic' ? 'APEX' : 'APEX+';
  const activePriceINR = activeSelectedPlan
    ? billingCycle === 'yearly'
      ? activeSelectedPlan.yearlyPriceINR
      : activeSelectedPlan.monthlyPriceINR
    : selectedTier === 'basic'
    ? billingCycle === 'yearly'
      ? 499
      : 49
    : billingCycle === 'yearly'
    ? 999
    : 99;

  const billingDurationLabel =
    billingCycle === 'yearly' ? '1 Yearly Billing Period (12 Months)' : '1 Monthly Billing Period (1 Month)';

  // Live recipient username lookup against registered users
  const normalizedUsername = recipientUsername.trim().replace(/^@/, '').toLowerCase();
  const matchedRecipientUser =
    normalizedUsername.length > 0
      ? allUsers.find((u) => u.username.toLowerCase() === normalizedUsername)
      : undefined;

  const handleProceedToCheckout = (
    planOverride?: NitroPlanConfig,
    cycleOverride?: 'monthly' | 'yearly',
    forceGift?: boolean
  ) => {
    setValidationError(null);
    const plan = planOverride || activeSelectedPlan;
    if (!plan || plan.tier === 'free') return;

    const cycle = cycleOverride || billingCycle;
    const isGiftFlow = isMainOwner ? true : forceGift !== undefined ? forceGift : sendAsGift;
    const planDisplayTitle = plan.tier === 'basic' ? 'APEX' : 'APEX+';
    const price = cycle === 'yearly' ? plan.yearlyPriceINR : plan.monthlyPriceINR;

    if (isGiftFlow) {
      if (recipientMode === 'username') {
        if (!normalizedUsername) {
          setValidationError("Please enter the recipient's Doomcord username.");
          return;
        }
        if (allUsers.length > 0 && !matchedRecipientUser) {
          setValidationError(
            `No registered Doomcord user found with username "@${normalizedUsername}". Check the spelling or choose an unrestricted gift link.`
          );
          return;
        }
      }
      if (recipientMode === 'email') {
        if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
          setValidationError('Please enter a valid recipient email address.');
          return;
        }
      }
    }

    const prefilledGiftOptions: GiftCheckoutOptions = {
      isGift: isGiftFlow,
      recipientMode,
      recipientUsername: recipientMode === 'username' ? normalizedUsername : undefined,
      recipientUid:
        recipientMode === 'username' && matchedRecipientUser
          ? matchedRecipientUser.uid
          : undefined,
      recipientEmail:
        recipientMode === 'email' ? recipientEmail.trim().toLowerCase() : undefined,
      personalMessage: personalMessage.trim(),
      paymentMethodLabel: paymentMethod,
    };

    onStartCheckout({
      type: 'nitro_subscription',
      itemId: plan.id,
      itemName: `${planDisplayTitle} ${cycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
      description: plan.tagline,
      amountINR: price,
      billingCycle: cycle,
      tier: plan.tier === 'basic' ? 'basic' : 'nitro',
      initialGiftMode: isGiftFlow,
      prefilledGiftOptions,
    });
  };

  const downloadInvoiceReceipt = (tx: TransactionRecord) => {
    const receiptText = [
      '====================================================',
      '           DOOMCORD APEX OFFICIAL RECEIPT           ',
      '              RISE ABOVE. STAND APART.              ',
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
    a.download = `doomcord_apex_receipt_${tx.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#101A17] text-[#F0F5F1] overflow-y-auto">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 h-16 px-8 bg-[#101A17]/95 backdrop-blur-md border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#192620] border border-[#D9BB79]/30 flex items-center justify-center text-[#D9BB79]">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-display font-bold text-[#F0F5F1]">
                DOOMCORD APEX
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8BE2B8]">
                · RISE ABOVE. STAND APART.
              </span>
            </div>
            <p className="text-xs text-[#9BAEA2] hidden sm:block">
              APEX & APEX+ memberships, custom profiles, 500 MB uploads & instant gift links
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#141F1B] border border-white/[0.06]">
            <button
              onClick={() => setActiveSubTab('plans')}
              className={`h-7 px-3 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'plans'
                  ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
              }`}
            >
              {isMainOwner ? 'Owner Membership & Gifting' : 'APEX Plans & Purchase'}
            </button>
            <button
              onClick={() => setActiveSubTab('manage')}
              className={`h-7 px-3 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'manage'
                  ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
              }`}
            >
              Membership & Receipts ({userReceipts.length})
            </button>
          </div>

          {onOpenGiftVault && (
            <button
              onClick={() => onOpenGiftVault()}
              className="h-8 px-3 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.08] text-xs font-medium text-[#F0F5F1] flex items-center gap-1.5"
            >
              <Gift className="w-3.5 h-3.5 text-[#D9BB79]" />
              <span>Redeem Gift</span>
            </button>
          )}

          <button
            onClick={onOpenShop}
            className="h-8 px-3 rounded-lg bg-[#192620] hover:bg-[#24362C] border border-white/[0.08] text-xs font-medium text-[#F0F5F1] flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#8BE2B8]" />
            <span>APEX Collection</span>
          </button>
        </div>
      </header>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Quick Gift Link / Code Redemption Bar */}
        {onOpenGiftVault && (
          <div className="p-4 rounded-xl bg-[#141F1B] border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Gift className="w-4 h-4 text-[#8BE2B8] shrink-0" />
              <span className="text-xs font-semibold text-[#F0F5F1]">
                Have an APEX Gift URL or Redemption Token?
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={quickGiftCode}
                onChange={(e) => setQuickGiftCode(e.target.value)}
                placeholder="Paste https://doomcord.com/gift/APEX-... or token"
                className="flex-1 sm:w-80 h-9 bg-[#101A17] text-[#F0F5F1] text-xs font-mono px-3 rounded-lg border border-white/[0.08] outline-none focus:border-[#8BE2B8]"
              />
              <button
                onClick={() => onOpenGiftVault(quickGiftCode.trim())}
                className="h-9 px-4 rounded-lg bg-[#8BE2B8] text-[#101A17] font-semibold text-xs shrink-0"
              >
                Inspect & Claim
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'plans' ? (
          <>
            {/* REQUIREMENT #6: MAIN OWNER ACCOUNT — AUTOMATIC APEX+ */}
            {isMainOwner ? (
              <section className="rounded-xl bg-[#141F1B] border border-[#D9BB79]/40 p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#192620] border border-[#D9BB79]/40 text-xs font-mono uppercase tracking-wider text-[#D9BB79]">
                      <InfinityIcon className="w-4 h-4" />
                      <span>OWNER_PERMANENT_APEX · ROOT_OWNER</span>
                    </div>
                    <h2 className="text-3xl font-display font-bold text-[#F0F5F1] tracking-tight">
                      APEX+ UNLOCKED
                    </h2>
                    <div className="text-sm font-mono font-semibold text-[#8BE2B8]">
                      Permanent Owner Membership
                    </div>
                    <p className="text-xs text-[#9BAEA2] max-w-2xl leading-relaxed">
                      Your Main Owner account (<code className="font-mono text-[#F0F5F1]">{currentUser.uid}</code>) holds the permanent <code className="font-mono text-[#D9BB79]">OWNER_PERMANENT_APEX</code> entitlement. All current and future APEX and APEX+ features, 500 MB uploads, 4,000-character messages, animated banners, and 100% of the APEX Collection are permanently unlocked with no expiration and no subscription payment required.
                    </p>
                  </div>

                  {onOpenOwnerGiftingAdmin && (
                    <button
                      onClick={onOpenOwnerGiftingAdmin}
                      className="h-10 px-4 rounded-xl bg-[#D9BB79] hover:bg-[#E5C98B] text-[#101A17] font-semibold text-xs shrink-0 flex items-center gap-2 transition-colors"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Issue Free Lifetime Gifts in Admin Studio</span>
                    </button>
                  )}
                </div>

                {/* Unlocked Owner Capabilities Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: 'APEX+ Badge & Identity',
                      desc: 'Animated prismatic APEX+ badge, custom themes & per-community profiles unlocked',
                    },
                    {
                      title: '500 MB Uploads',
                      desc: 'Maximum file & media upload capacity across all channels and direct messages',
                    },
                    {
                      title: '4,000-Char Messages',
                      desc: 'Extended message composer length and HD voice/stage priority',
                    },
                    {
                      title: '100% APEX Collection',
                      desc: 'Every avatar frame, profile effect, nameplate & banner unlocked permanently',
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#192620] border border-white/[0.06] space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8BE2B8]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-[#9BAEA2] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              /* REGULAR USER MEMBERSHIP PLANS DISPLAY (#2 OFFICIAL APEX PRICING) */
              <>
                <div className="p-6 rounded-xl bg-[#141F1B] border border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono uppercase tracking-wider text-[#8BE2B8]">
                      Current Tier: DOOMCORD {formatApexTierName(currentUser.nitroTier)}
                    </div>
                    <h2 className="text-2xl font-display font-bold text-[#F0F5F1]">
                      Choose Your DOOMCORD APEX Membership
                    </h2>
                    <p className="text-xs text-[#9BAEA2] max-w-xl">
                      Unlock animated avatars, custom profile themes, larger uploads, and exclusive APEX Collection discounts. Purchase for yourself or check "Send as a gift" below to surprise another user.
                    </p>
                  </div>

                  {/* Monthly / Yearly Billing Toggle */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#101A17] border border-white/[0.08] shrink-0">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`h-9 px-4 text-xs font-semibold rounded-lg transition-colors ${
                        billingCycle === 'monthly'
                          ? 'bg-[#24362C] text-[#F0F5F1]'
                          : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
                      }`}
                    >
                      Monthly Billing
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`h-9 px-4 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                        billingCycle === 'yearly'
                          ? 'bg-[#8BE2B8] text-[#101A17]'
                          : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
                      }`}
                    >
                      <span>Yearly Billing</span>
                      <span className="text-[10px] font-mono opacity-90">Save ~15%</span>
                    </button>
                  </div>
                </div>

                {/* Plan Cards Grid: Doomcord Free, APEX, APEX+ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  {[freePlan, basicPlan, nitroPlan].filter(Boolean).map((plan) => {
                    const isCurrent = currentUser.nitroTier === plan.tier;
                    const isPlus = plan.tier === 'nitro';
                    const isBasic = plan.tier === 'basic';
                    const isSelectedForCheckout =
                      plan.tier !== 'free' && selectedTier === plan.tier;
                    const price =
                      billingCycle === 'yearly'
                        ? plan.yearlyPriceINR
                        : plan.monthlyPriceINR;
                    const displayPlanName =
                      plan.tier === 'free'
                        ? 'Doomcord Free'
                        : plan.tier === 'basic'
                        ? 'APEX'
                        : 'APEX+';

                    return (
                      <div
                        key={plan.id}
                        onClick={() => {
                          if (plan.tier === 'basic' || plan.tier === 'nitro') {
                            setSelectedTier(plan.tier);
                          }
                        }}
                        className={`flex flex-col justify-between p-6 rounded-xl border transition-all ${
                          plan.tier !== 'free' ? 'cursor-pointer' : ''
                        } ${
                          isSelectedForCheckout
                            ? 'bg-[#192620] border-[#8BE2B8] shadow-xl'
                            : isPlus
                            ? 'bg-[#141F1B] border-[#D9BB79]/30'
                            : 'bg-[#141F1B] border-white/[0.07]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8BE2B8]">
                              {plan.tier === 'free'
                                ? 'Base Tier'
                                : isBasic
                                ? 'Standard Premium'
                                : 'Maximum Prestige'}
                            </span>
                            {isCurrent && (
                              <span className="text-[11px] font-mono text-[#D9BB79]">
                                Active Plan
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl font-display font-bold text-[#F0F5F1]">
                            {displayPlanName}
                          </h3>
                          <p className="text-xs text-[#9BAEA2] mt-1 min-h-[32px]">
                            {plan.tagline}
                          </p>

                          <div className="my-5 pb-5 border-b border-white/[0.06] flex items-baseline gap-1.5">
                            <span className="text-3xl font-display font-bold text-[#F0F5F1] font-mono tabular-nums">
                              ₹{price}
                            </span>
                            <span className="text-xs text-[#718478] font-mono">
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
                                className="flex items-start gap-2.5 text-xs text-[#F0F5F1]"
                              >
                                <Check className="w-4 h-4 text-[#8BE2B8] shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          {plan.tier === 'free' ? (
                            <button
                              disabled
                              className="w-full h-10 px-4 rounded-lg bg-[#192620] text-[#718478] text-xs font-semibold cursor-default"
                            >
                              {isCurrent ? 'Your Current Plan' : 'Included Base Tier'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTier(plan.tier as 'basic' | 'nitro');
                                handleProceedToCheckout(plan, billingCycle, sendAsGift);
                              }}
                              className={`w-full h-10 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
                                isPlus
                                  ? 'bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17]'
                                  : 'bg-[#24362C] hover:bg-[#2E4538] text-[#F0F5F1] border border-white/10'
                              }`}
                            >
                              {sendAsGift ? (
                                <>
                                  <Gift className="w-3.5 h-3.5" />
                                  <span>Purchase Gift (₹{price})</span>
                                </>
                              ) : (
                                <span>
                                  Purchase {displayPlanName} (₹{price})
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* REQUIREMENT #3 & #6: DEDICATED MEMBERSHIP PURCHASE & SEND AS A GIFT CHECKOUT MODULE */}
            <section className="rounded-xl bg-[#141F1B] border border-white/[0.08] p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#8BE2B8]">
                    {isMainOwner
                      ? 'Owner Gift Purchase Checkout (INR)'
                      : 'Membership Checkout & Gifting Configuration'}
                  </span>
                  <h3 className="text-xl font-display font-bold text-[#F0F5F1] mt-0.5">
                    {isMainOwner
                      ? 'Purchase an APEX or APEX+ Gift for Another User'
                      : 'Configure Your APEX Membership or Gift Purchase'}
                  </h3>
                  <p className="text-xs text-[#9BAEA2] mt-0.5">
                    {isMainOwner
                      ? 'Your personal APEX+ membership is permanently unlocked. You can purchase verifiable Razorpay gift links for other users below, or issue ₹0 complimentary gifts from the Admin Studio.'
                      : 'Select your desired plan and billing period below. Check "Send as a gift" to purchase for a friend.'}
                  </p>
                </div>

                {/* 4-Product Selector Pills: APEX Monthly, APEX Yearly, APEX+ Monthly, APEX+ Yearly */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
                  {(
                    [
                      {
                        tier: 'basic' as const,
                        cycle: 'monthly' as const,
                        label: 'APEX Monthly',
                        price: basicPlan?.monthlyPriceINR ?? 49,
                      },
                      {
                        tier: 'basic' as const,
                        cycle: 'yearly' as const,
                        label: 'APEX Yearly',
                        price: basicPlan?.yearlyPriceINR ?? 499,
                      },
                      {
                        tier: 'nitro' as const,
                        cycle: 'monthly' as const,
                        label: 'APEX+ Monthly',
                        price: nitroPlan?.monthlyPriceINR ?? 99,
                      },
                      {
                        tier: 'nitro' as const,
                        cycle: 'yearly' as const,
                        label: 'APEX+ Yearly',
                        price: nitroPlan?.yearlyPriceINR ?? 999,
                      },
                    ] as const
                  ).map((prod) => {
                    const isSelected =
                      selectedTier === prod.tier && billingCycle === prod.cycle;
                    return (
                      <button
                        key={`${prod.tier}_${prod.cycle}`}
                        type="button"
                        onClick={() => {
                          setSelectedTier(prod.tier);
                          setBillingCycle(prod.cycle);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? 'bg-[#24362C] border-[#8BE2B8] text-[#F0F5F1]'
                            : 'bg-[#101A17] border-white/[0.07] text-[#9BAEA2] hover:text-[#F0F5F1]'
                        }`}
                      >
                        <div className="text-xs font-semibold whitespace-nowrap">
                          {prod.label}
                        </div>
                        <div className="text-xs font-mono font-bold text-[#8BE2B8] tabular-nums mt-0.5">
                          ₹{prod.price}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SEND AS A GIFT CHECKBOX — Placed below selected membership plan and above checkout summary & payment button */}
              <div
                className={`p-5 rounded-xl border transition-all duration-200 ${
                  sendAsGift
                    ? 'bg-[#192620] border-[#8BE2B8]/50'
                    : 'bg-[#101A17] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <label className="flex items-start gap-3.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isMainOwner ? true : sendAsGift}
                    disabled={isMainOwner}
                    onChange={(e) => {
                      setSendAsGift(e.target.checked);
                      setValidationError(null);
                    }}
                    className="mt-0.5 w-4 h-4 accent-[#8BE2B8] rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-display font-bold text-[#F0F5F1] flex items-center gap-2">
                        <Gift className="w-4 h-4 text-[#8BE2B8]" />
                        <span>Send as a gift</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#8BE2B8]">
                        · {activePlanName} ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})
                      </span>
                    </div>
                    <p className="text-xs text-[#9BAEA2] mt-1 leading-relaxed">
                      Give someone special access to Doomcord premium features. Purchase APEX or APEX+ for another person.
                    </p>
                  </div>
                </label>

                {/* WHEN THE CHECKBOX IS CHECKED: Expand Gift Configuration Section */}
                {(sendAsGift || isMainOwner) && (
                  <div className="mt-5 pt-5 border-t border-white/[0.08] space-y-5 transition-all duration-200">
                    <div>
                      <h4 className="text-sm font-display font-bold text-[#F0F5F1] mb-2.5">
                        Gift this membership to someone
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {(
                          [
                            {
                              id: 'username',
                              label: '1. Doomcord Username',
                              desc: 'Restrict to an existing @username',
                              icon: User,
                            },
                            {
                              id: 'email',
                              label: '2. Recipient Email',
                              desc: 'Restrict to a specific email address',
                              icon: Mail,
                            },
                            {
                              id: 'anyone',
                              label: '3. Unrestricted Gift Link',
                              desc: 'Shareable single-use link for anyone',
                              icon: Globe,
                            },
                          ] as const
                        ).map((opt) => {
                          const Icon = opt.icon;
                          const active = recipientMode === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setRecipientMode(opt.id);
                                setValidationError(null);
                              }}
                              className={`p-3 rounded-xl border text-left transition-colors ${
                                active
                                  ? 'bg-[#24362C] border-[#8BE2B8] text-[#F0F5F1]'
                                  : 'bg-[#141F1B] border-white/[0.06] text-[#9BAEA2] hover:text-[#F0F5F1]'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs font-semibold text-[#F0F5F1]">
                                <Icon className="w-3.5 h-3.5 text-[#8BE2B8] shrink-0" />
                                <span>{opt.label}</span>
                              </div>
                              <p className="text-[11px] text-[#718478] mt-1">
                                {opt.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recipient Input + Validation + Personal Message */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recipientMode === 'username' && (
                        <div>
                          <label className="text-xs font-medium text-[#F0F5F1] block mb-1.5">
                            Recipient's Doomcord Username
                          </label>
                          <input
                            type="text"
                            value={recipientUsername}
                            onChange={(e) => {
                              setRecipientUsername(e.target.value);
                              setValidationError(null);
                            }}
                            placeholder="@username"
                            className="w-full h-10 bg-[#101A17] text-[#F0F5F1] text-xs font-mono px-3.5 rounded-lg border border-white/[0.08] outline-none focus:border-[#8BE2B8]"
                          />
                          {normalizedUsername && (
                            <div className="mt-1.5 text-[11px] font-mono">
                              {matchedRecipientUser ? (
                                <span className="text-[#8BE2B8] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Verified user: {matchedRecipientUser.displayName} (@
                                  {matchedRecipientUser.username})
                                </span>
                              ) : (
                                <span className="text-[#D9BB79]">
                                  Username @{normalizedUsername} will be verified on claim
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {recipientMode === 'email' && (
                        <div>
                          <label className="text-xs font-medium text-[#F0F5F1] block mb-1.5">
                            Recipient's Email Address
                          </label>
                          <input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => {
                              setRecipientEmail(e.target.value);
                              setValidationError(null);
                            }}
                            placeholder="recipient@domain.com"
                            className="w-full h-10 bg-[#101A17] text-[#F0F5F1] text-xs font-mono px-3.5 rounded-lg border border-white/[0.08] outline-none focus:border-[#8BE2B8]"
                          />
                        </div>
                      )}

                      <div className={recipientMode === 'anyone' ? 'md:col-span-2' : ''}>
                        <label className="text-xs font-medium text-[#F0F5F1] block mb-1.5">
                          Optional Personal Gift Message
                        </label>
                        <input
                          type="text"
                          value={personalMessage}
                          onChange={(e) => setPersonalMessage(e.target.value)}
                          placeholder="Add a personal note for the recipient..."
                          className="w-full h-10 bg-[#101A17] text-[#F0F5F1] text-xs px-3.5 rounded-lg border border-white/[0.08] outline-none focus:border-[#8BE2B8]"
                        />
                      </div>
                    </div>

                    {/* Live Gift Preview Card */}
                    <div className="p-4 rounded-xl bg-[#101A17] border border-[#D9BB79]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[#192620] border border-[#D9BB79]/40 flex items-center justify-center text-[#D9BB79] shrink-0">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-wider text-[#D9BB79]">
                            Live Gift Preview · Single-Use Redemption Link
                          </div>
                          <div className="text-sm font-display font-bold text-[#F0F5F1] mt-0.5">
                            DOOMCORD {activePlanName} Gift ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})
                          </div>
                          <p className="text-xs text-[#9BAEA2] italic mt-1">
                            “{personalMessage || 'Enjoy your DOOMCORD APEX membership!'}”
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0 font-mono">
                        <div className="text-xs text-[#9BAEA2]">
                          Duration: {billingDurationLabel}
                        </div>
                        <div className="text-lg font-bold text-[#8BE2B8] tabular-nums mt-0.5">
                          ₹{activePriceINR} INR
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {validationError && (
                <div className="p-3.5 rounded-lg bg-[#E57373]/15 border border-[#E57373]/40 text-xs text-[#E57373] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Checkout Summary & Action Button (#3: Unchecked vs Checked) */}
              <div className="p-5 rounded-xl bg-[#101A17] border border-white/[0.07] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-xs">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#718478] block">
                      Selected Membership
                    </span>
                    <span className="font-display font-bold text-[#F0F5F1] text-sm mt-0.5 block">
                      DOOMCORD {activePlanName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#718478] block">
                      Billing Duration
                    </span>
                    <span className="font-mono text-[#F0F5F1] mt-0.5 block">
                      {billingCycle === 'yearly' ? 'Yearly (1 Year)' : 'Monthly (1 Month)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#718478] block">
                      Payment Method
                    </span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mt-0.5 bg-[#141F1B] text-[#F0F5F1] text-xs rounded px-2 py-1 border border-white/10 outline-none"
                    >
                      <option value="Razorpay UPI / AutoPay">Razorpay UPI / AutoPay</option>
                      <option value="Razorpay Credit / Debit Card">Razorpay Card</option>
                      <option value="Razorpay NetBanking">Razorpay NetBanking</option>
                      <option value="Razorpay Wallets">Razorpay Wallets</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#718478] block">
                      Total Price
                    </span>
                    <span className="font-mono font-bold text-[#8BE2B8] text-base tabular-nums mt-0.5 block">
                      ₹{activePriceINR} INR
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleProceedToCheckout(
                        activeSelectedPlan,
                        billingCycle,
                        isMainOwner ? true : sendAsGift
                      )
                    }
                    className="w-full lg:w-auto h-11 px-6 rounded-xl bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17] font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors whitespace-nowrap"
                  >
                    {sendAsGift || isMainOwner ? (
                      <>
                        <Gift className="w-4 h-4" />
                        <span>Purchase Gift</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>
                          {selectedTier === 'basic'
                            ? 'Purchase APEX'
                            : 'Purchase APEX+'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Feature Comparison Matrix */}
            <div className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
              <div className="px-6 py-4 bg-[#111B17] border-b border-white/[0.06]">
                <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                  DOOMCORD APEX — Membership Comparison
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[#9BAEA2]">
                      <th className="py-3.5 px-6 font-semibold">Feature / Benefit</th>
                      <th className="py-3.5 px-6 font-semibold">Doomcord Free (₹0)</th>
                      <th className="py-3.5 px-6 font-semibold">APEX (₹49/mo · ₹499/yr)</th>
                      <th className="py-3.5 px-6 font-semibold text-[#8BE2B8]">
                        APEX+ (₹99/mo · ₹999/yr)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-[#F0F5F1]">
                    <tr>
                      <td className="py-3 px-6 font-medium">Profile Badge</td>
                      <td className="py-3 px-6 text-[#718478]">Standard</td>
                      <td className="py-3 px-6">APEX Badge</td>
                      <td className="py-3 px-6 text-[#8BE2B8] font-semibold">
                        Animated APEX+ Badge
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-6 font-medium">Max File Upload Size</td>
                      <td className="py-3 px-6 font-mono tabular-nums">25 MB</td>
                      <td className="py-3 px-6 font-mono tabular-nums">50 MB</td>
                      <td className="py-3 px-6 font-mono tabular-nums text-[#8BE2B8] font-bold">
                        500 MB
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-6 font-medium">Maximum Message Length</td>
                      <td className="py-3 px-6 font-mono tabular-nums">2,000 chars</td>
                      <td className="py-3 px-6 font-mono tabular-nums">2,500 chars</td>
                      <td className="py-3 px-6 font-mono tabular-nums text-[#8BE2B8] font-bold">
                        4,000 chars
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-6 font-medium">Animated Avatars & Banners</td>
                      <td className="py-3 px-6 text-[#718478]">Static only</td>
                      <td className="py-3 px-6">Animated Avatar</td>
                      <td className="py-3 px-6 text-[#8BE2B8] font-semibold">
                        Animated Avatar + Animated Banner
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-6 font-medium">APEX Collection Member Discount</td>
                      <td className="py-3 px-6 font-mono tabular-nums">0%</td>
                      <td className="py-3 px-6 font-mono tabular-nums">10% off</td>
                      <td className="py-3 px-6 font-mono tabular-nums text-[#8BE2B8] font-bold">
                        20% off
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Membership Management, Official Receipts & Payment History Tab */
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-[#141F1B] border border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8BE2B8]">
                  Current APEX Membership Status
                </span>
                <h3 className="text-xl font-display font-bold text-[#F0F5F1]">
                  {isMainOwner
                    ? 'APEX+ UNLOCKED — Permanent Owner Membership'
                    : `DOOMCORD ${formatApexTierName(currentUser.nitroTier)}`}
                </h3>
                <p className="text-xs text-[#9BAEA2] font-mono">
                  {isMainOwner ? (
                    'Entitlement: OWNER_PERMANENT_APEX · LIFETIME — NO EXPIRATION'
                  ) : (
                    <>
                      Billing Cycle: {currentUser.nitroBillingCycle || 'none'} · Auto-Renewal:{' '}
                      {currentUser.nitroAutoRenew ? 'Enabled' : 'Disabled'}
                      {currentUser.nitroExpiresAt
                        ? ` · Expires: ${new Date(currentUser.nitroExpiresAt).toLocaleDateString()}`
                        : currentUser.nitroTier !== 'free'
                        ? ' · LIFETIME — NO EXPIRATION'
                        : ''}
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isMainOwner && currentUser.nitroTier !== 'free' && (
                  <>
                    {currentUser.nitroAutoRenew ? (
                      <button
                        onClick={onCancelAutoRenew}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E57373]/15 border border-[#E57373]/40 text-xs font-semibold text-[#E57373]"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Auto-Renewal</span>
                      </button>
                    ) : (
                      <button
                        onClick={onReactivateAutoRenew}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#8BE2B8]/15 border border-[#8BE2B8]/40 text-xs font-semibold text-[#8BE2B8]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reactivate Membership</span>
                      </button>
                    )}

                    <button
                      onClick={onDowngradeToFree}
                      className="px-3.5 py-2 rounded-lg bg-[#192620] hover:bg-[#24362C] text-xs text-[#9BAEA2] hover:text-[#F0F5F1]"
                    >
                      Downgrade to Free
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Official Doomcord Receipts (DC-2026-XXXXXX) */}
            <div className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
              <div className="px-6 py-4 bg-[#111B17] border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8BE2B8]" />
                  <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                    Official Doomcord Receipts (DC-2026-XXXXXX)
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#718478] tabular-nums">
                  {userReceipts.length} receipt{userReceipts.length === 1 ? '' : 's'}
                </span>
              </div>

              {userReceipts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#9BAEA2]">
                  No official receipts have been issued to your account yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[#9BAEA2]">
                        <th className="py-3 px-6">Receipt #</th>
                        <th className="py-3 px-6">Type / Title</th>
                        <th className="py-3 px-6">Recipient / Nature</th>
                        <th className="py-3 px-6">Duration / Expiry</th>
                        <th className="py-3 px-6">Amount</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Document</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {userReceipts.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#192620]">
                          <td className="py-3 px-6 font-mono font-bold text-[#8BE2B8]">
                            {rec.receiptNumber}
                          </td>
                          <td className="py-3 px-6">
                            <div className="font-semibold text-[#F0F5F1]">{rec.title}</div>
                            <div className="text-[11px] text-[#718478]">
                              {rec.receiptType}
                            </div>
                          </td>
                          <td className="py-3 px-6 font-mono text-[11px] text-[#9BAEA2]">
                            {rec.purchaseNature === 'gift_purchase' ||
                            rec.purchaseNature === 'complimentary_owner_gift'
                              ? `Gift → ${rec.giftRecipientInfo || 'Link'} (${rec.giftRedemptionStatus || 'unclaimed'})`
                              : `@${rec.customerUsername}`}
                          </td>
                          <td className="py-3 px-6 font-mono text-[11px] text-[#F0F5F1]">
                            {rec.serviceExpiryDate === null
                              ? 'LIFETIME — NO EXPIRATION'
                              : `${rec.serviceDurationLabel} (Exp: ${new Date(
                                  rec.serviceExpiryDate
                                ).toLocaleDateString()})`}
                          </td>
                          <td className="py-3 px-6 font-mono tabular-nums text-[#F0F5F1]">
                            {rec.paymentStatus === 'Complimentary'
                              ? '₹0 (Complimentary)'
                              : `₹${rec.totalAmountINR} INR`}
                          </td>
                          <td className="py-3 px-6 font-mono uppercase text-[11px] text-[#8BE2B8]">
                            {rec.paymentStatus}
                          </td>
                          <td className="py-3 px-6 text-right">
                            {onSelectReceipt && (
                              <button
                                onClick={() => onSelectReceipt(rec)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#192620] hover:bg-[#24362C] text-[#F0F5F1] font-semibold text-[11px] border border-white/10"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#8BE2B8]" />
                                <span>View / Print</span>
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

            {/* Verified Payment & Transaction History */}
            <div className="rounded-xl bg-[#141F1B] border border-white/[0.06] overflow-hidden">
              <div className="px-6 py-4 bg-[#111B17] border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#8BE2B8]" />
                  <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                    Verified Razorpay Transaction Ledger
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#718478] tabular-nums">
                  {userTransactions.length} record{userTransactions.length === 1 ? '' : 's'}
                </span>
              </div>

              {userTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#9BAEA2]">
                  No payment transactions recorded on your account yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[#9BAEA2]">
                        <th className="py-3 px-6">Date</th>
                        <th className="py-3 px-6">Item</th>
                        <th className="py-3 px-6">Order / Payment ID</th>
                        <th className="py-3 px-6">Amount (INR)</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {userTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#192620]">
                          <td className="py-3 px-6 font-mono tabular-nums text-[#9BAEA2]">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-6 font-semibold text-[#F0F5F1]">
                            {tx.itemName}
                          </td>
                          <td className="py-3 px-6 font-mono text-[11px] text-[#718478]">
                            {tx.razorpayPaymentId || tx.razorpayOrderId || tx.id}
                          </td>
                          <td className="py-3 px-6 font-mono tabular-nums text-[#F0F5F1]">
                            ₹{tx.amountINR}
                          </td>
                          <td className="py-3 px-6 font-mono uppercase text-[11px] text-[#8BE2B8]">
                            {tx.status}
                          </td>
                          <td className="py-3 px-6 text-right">
                            <button
                              onClick={() => downloadInvoiceReceipt(tx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#192620] hover:bg-[#24362C] text-[#F0F5F1] text-[11px]"
                            >
                              <Download className="w-3 h-3" />
                              <span>TXT</span>
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
