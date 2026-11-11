import React, { useState } from 'react';
import {
  Check,
  Crown,
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

  // On-page Membership Purchase & Send as a Gift State
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
    <div className="flex-1 flex flex-col h-full bg-[#09090D] text-[#F5F3FA] overflow-y-auto">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 h-14 px-6 bg-[#09090D]/90 backdrop-blur-md border-b border-[#282631] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#17171F] border border-[#8957F5]/30 flex items-center justify-center text-[#8957F5]">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#F5F3FA]">
                DOOMCORD APEX
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A47BFF]">
                · RISE ABOVE. STAND APART.
              </span>
            </div>
            <p className="text-[11px] text-[#706C7B] hidden sm:block">
              Memberships, custom profiles, 500 MB uploads & instant gifting
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-md bg-[#101014] border border-[#282631]">
            <button
              onClick={() => setActiveSubTab('plans')}
              className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                activeSubTab === 'plans'
                  ? 'bg-[#17171F] text-[#F5F3FA]'
                  : 'text-[#A19DAD] hover:text-[#F5F3FA]'
              }`}
            >
              {isMainOwner ? 'Owner Status & Gifting' : 'APEX Plans'}
            </button>
            <button
              onClick={() => setActiveSubTab('manage')}
              className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                activeSubTab === 'manage'
                  ? 'bg-[#17171F] text-[#F5F3FA]'
                  : 'text-[#A19DAD] hover:text-[#F5F3FA]'
              }`}
            >
              Receipts ({userReceipts.length})
            </button>
          </div>

          {onOpenGiftVault && (
            <button
              onClick={() => onOpenGiftVault()}
              className="h-7 px-3 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA] flex items-center gap-1.5 transition-colors"
            >
              <Gift className="w-3.5 h-3.5 text-[#A47BFF]" />
              <span>Redeem Gift</span>
            </button>
          )}

          <button
            onClick={onOpenShop}
            className="h-7 px-3 rounded bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA] flex items-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#8957F5]" />
            <span>Shop</span>
          </button>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Quick Gift Link / Code Redemption Bar */}
        {onOpenGiftVault && (
          <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#8957F5] shrink-0" />
              <span className="text-xs font-medium text-[#F5F3FA]">
                Have an APEX Gift URL or Redemption Token?
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={quickGiftCode}
                onChange={(e) => setQuickGiftCode(e.target.value)}
                placeholder="Paste gift URL or claim token..."
                className="flex-1 sm:w-72 h-8 bg-[#17171F] text-[#F5F3FA] text-xs font-mono px-3 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
              />
              <button
                onClick={() => onOpenGiftVault(quickGiftCode.trim())}
                className="h-8 px-3.5 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white font-medium text-xs shrink-0 shadow-sm transition-colors"
              >
                Claim
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'plans' ? (
          <>
            {/* MAIN OWNER ACCOUNT — AUTOMATIC APEX+ */}
            {isMainOwner ? (
              <section className="rounded-xl bg-[#101014] border border-[#8957F5]/40 p-6 md:p-8 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-[#282631]">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#17171F] border border-[#8957F5]/40 text-xs font-mono uppercase tracking-wider text-[#A47BFF]">
                      <InfinityIcon className="w-3.5 h-3.5" />
                      <span>OWNER_PERMANENT_APEX · ROOT_OWNER</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#F5F3FA] tracking-tight">
                      APEX+ UNLOCKED
                    </h2>
                    <div className="text-xs font-mono font-semibold text-[#8957F5]">
                      Permanent Owner Membership
                    </div>
                    <p className="text-xs text-[#A19DAD] max-w-2xl leading-relaxed">
                      Your Main Owner account holds the permanent <code className="font-mono text-[#C4B1FF]">OWNER_PERMANENT_APEX</code> entitlement. All current and future APEX and APEX+ features, 500 MB uploads, 4,000-character messages, animated banners, and 100% of cosmetics are permanently unlocked with no expiration and no subscription payment required.
                    </p>
                  </div>

                  {onOpenOwnerGiftingAdmin && (
                    <button
                      onClick={onOpenOwnerGiftingAdmin}
                      className="h-9 px-4 rounded-lg bg-[#8957F5] hover:bg-[#7a4be6] text-white font-medium text-xs shrink-0 flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Issue Free Lifetime Gifts in Admin</span>
                    </button>
                  )}
                </div>

                {/* Capabilities Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      title: 'APEX+ Identity',
                      desc: 'Animated APEX+ badge, custom themes & per-community profiles',
                    },
                    {
                      title: '500 MB Uploads',
                      desc: 'Maximum media upload capacity across all conversations',
                    },
                    {
                      title: '4,000-Char Messages',
                      desc: 'Extended message composer length and HD voice audio priority',
                    },
                    {
                      title: 'All Cosmetics',
                      desc: 'Every avatar decoration, profile effect, nameplate & banner unlocked',
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-[#17171F] border border-[#282631] space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8957F5]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-[#A19DAD] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              /* REGULAR USER MEMBERSHIP PLANS DISPLAY */
              <>
                <div className="p-5 rounded-xl bg-[#101014] border border-[#282631] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="space-y-1">
                    <div className="text-xs font-mono uppercase tracking-wider text-[#8957F5]">
                      Current Tier: DOOMCORD {formatApexTierName(currentUser.nitroTier)}
                    </div>
                    <h2 className="text-xl font-bold text-[#F5F3FA]">
                      Choose Your DOOMCORD APEX Membership
                    </h2>
                    <p className="text-xs text-[#A19DAD] max-w-xl">
                      Unlock animated avatars, custom themes, larger uploads, and exclusive cosmetics. Purchase for yourself or check "Send as a gift" below.
                    </p>
                  </div>

                  {/* Monthly / Yearly Billing Toggle */}
                  <div className="flex items-center gap-1 p-0.5 rounded-md bg-[#17171F] border border-[#282631] shrink-0">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`h-7 px-3 text-xs font-medium rounded transition-colors ${
                        billingCycle === 'monthly'
                          ? 'bg-[#22212C] text-[#F5F3FA]'
                          : 'text-[#A19DAD] hover:text-[#F5F3FA]'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`h-7 px-3 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                        billingCycle === 'yearly'
                          ? 'bg-[#8957F5] text-white shadow-sm'
                          : 'text-[#A19DAD] hover:text-[#F5F3FA]'
                      }`}
                    >
                      <span>Yearly</span>
                      <span className="text-[10px] font-mono opacity-90">Save ~15%</span>
                    </button>
                  </div>
                </div>

                {/* Plan Cards Grid: Doomcord Free, APEX, APEX+ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
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
                        className={`flex flex-col justify-between p-5 rounded-xl border transition-all ${
                          plan.tier !== 'free' ? 'cursor-pointer' : ''
                        } ${
                          isSelectedForCheckout
                            ? 'bg-[#17171F] border-[#8957F5] shadow-lg'
                            : isPlus
                            ? 'bg-[#101014] border-[#8957F5]/30'
                            : 'bg-[#101014] border-[#282631]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8957F5]">
                              {plan.tier === 'free'
                                ? 'Base Tier'
                                : isBasic
                                ? 'Essential Premium'
                                : 'Maximum Prestige'}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono text-[#C4B1FF]">
                                Current Plan
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-[#F5F3FA]">
                            {displayPlanName}
                          </h3>
                          <p className="text-xs text-[#A19DAD] mt-0.5 min-h-[30px]">
                            {plan.tagline}
                          </p>

                          <div className="my-4 pb-4 border-b border-[#282631] flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-[#F5F3FA] font-mono tabular-nums">
                              ₹{price}
                            </span>
                            <span className="text-xs text-[#706C7B] font-mono">
                              {plan.tier === 'free'
                                ? 'Forever'
                                : billingCycle === 'yearly'
                                ? '/ year'
                                : '/ month'}
                            </span>
                          </div>

                          <ul className="space-y-2 mb-5">
                            {plan.benefits.map((benefit, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs text-[#F5F3FA]"
                              >
                                <Check className="w-3.5 h-3.5 text-[#8957F5] shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2">
                          {plan.tier === 'free' ? (
                            <button
                              disabled
                              className="w-full h-8 px-3 rounded-md bg-[#17171F] text-[#706C7B] text-xs font-medium cursor-default"
                            >
                              {isCurrent ? 'Current Plan' : 'Free Forever'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTier(plan.tier as 'basic' | 'nitro');
                                handleProceedToCheckout(plan, billingCycle, sendAsGift);
                              }}
                              className={`w-full h-8 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                                isPlus
                                  ? 'bg-[#8957F5] hover:bg-[#7a4be6] text-white'
                                  : 'bg-[#17171F] hover:bg-[#22212C] text-[#F5F3FA] border border-[#282631]'
                              }`}
                            >
                              {sendAsGift ? (
                                <>
                                  <Gift className="w-3.5 h-3.5" />
                                  <span>Gift (₹{price})</span>
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

            {/* MEMBERSHIP PURCHASE & SEND AS A GIFT CHECKOUT MODULE */}
            <section className="rounded-xl bg-[#101014] border border-[#282631] p-5 md:p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#282631]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8957F5]">
                    {isMainOwner
                      ? 'Owner Gift Purchase Checkout (INR)'
                      : 'Checkout Configuration'}
                  </span>
                  <h3 className="text-base font-semibold text-[#F5F3FA] mt-0.5">
                    {isMainOwner
                      ? 'Purchase an APEX Gift for Another User'
                      : 'Configure Your APEX Membership or Gift'}
                  </h3>
                  <p className="text-xs text-[#A19DAD] mt-0.5">
                    {isMainOwner
                      ? 'Select plan and recipient details below to purchase verifiable Razorpay gift links.'
                      : 'Choose your desired plan and duration. Check "Send as a gift" to purchase for someone else.'}
                  </p>
                </div>

                {/* 4-Product Selector Pills */}
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
                        className={`p-2 rounded-md border text-left transition-colors ${
                          isSelected
                            ? 'bg-[#17171F] border-[#8957F5] text-[#F5F3FA]'
                            : 'bg-[#101014] border-[#282631] text-[#A19DAD] hover:text-[#F5F3FA]'
                        }`}
                      >
                        <div className="text-[11px] font-medium whitespace-nowrap">
                          {prod.label}
                        </div>
                        <div className="text-xs font-mono font-bold text-[#8957F5] tabular-nums">
                          ₹{prod.price}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SEND AS A GIFT CHECKBOX */}
              <div
                className={`p-4 rounded-lg border transition-all ${
                  sendAsGift
                    ? 'bg-[#17171F] border-[#8957F5]/50'
                    : 'bg-[#101014] border-[#282631]'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isMainOwner ? true : sendAsGift}
                    disabled={isMainOwner}
                    onChange={(e) => {
                      setSendAsGift(e.target.checked);
                      setValidationError(null);
                    }}
                    className="mt-0.5 w-4 h-4 accent-[#8957F5] rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#F5F3FA] flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-[#8957F5]" />
                        <span>Send as a gift</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#A47BFF]">
                        · {activePlanName} ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A19DAD] mt-0.5 leading-relaxed">
                      Give someone access to premium Doomcord benefits. Purchase this membership for someone else.
                    </p>
                  </div>
                </label>

                {/* Expanded Gift Options */}
                {(sendAsGift || isMainOwner) && (
                  <div className="mt-4 pt-4 border-t border-[#282631] space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-[#F5F3FA] mb-2">
                        Who are you gifting this to?
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(
                          [
                            {
                              id: 'username',
                              label: 'Doomcord Username',
                              desc: 'Restrict to @username',
                              icon: User,
                            },
                            {
                              id: 'email',
                              label: 'Recipient Email',
                              desc: 'Restrict to email',
                              icon: Mail,
                            },
                            {
                              id: 'anyone',
                              label: 'Unrestricted Link',
                              desc: 'Anyone with the link',
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
                              className={`p-2.5 rounded-md border text-left transition-colors ${
                                active
                                  ? 'bg-[#22212C] border-[#8957F5] text-[#F5F3FA]'
                                  : 'bg-[#101014] border-[#282631] text-[#A19DAD] hover:text-[#F5F3FA]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 text-xs font-medium text-[#F5F3FA]">
                                <Icon className="w-3.5 h-3.5 text-[#8957F5] shrink-0" />
                                <span>{opt.label}</span>
                              </div>
                              <p className="text-[10px] text-[#706C7B] mt-0.5">
                                {opt.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recipientMode === 'username' && (
                        <div>
                          <label className="text-xs font-medium text-[#F5F3FA] block mb-1">
                            Recipient's Username
                          </label>
                          <input
                            type="text"
                            value={recipientUsername}
                            onChange={(e) => {
                              setRecipientUsername(e.target.value);
                              setValidationError(null);
                            }}
                            placeholder="@username"
                            className="w-full h-8 bg-[#101014] text-[#F5F3FA] text-xs font-mono px-3 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
                          />
                          {normalizedUsername && (
                            <div className="mt-1 text-[10px] font-mono">
                              {matchedRecipientUser ? (
                                <span className="text-[#8957F5] flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Found: {matchedRecipientUser.displayName} (@{matchedRecipientUser.username})
                                </span>
                              ) : (
                                <span className="text-[#A47BFF]">
                                  Will verify @{normalizedUsername} upon redemption
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {recipientMode === 'email' && (
                        <div>
                          <label className="text-xs font-medium text-[#F5F3FA] block mb-1">
                            Recipient Email
                          </label>
                          <input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => {
                              setRecipientEmail(e.target.value);
                              setValidationError(null);
                            }}
                            placeholder="recipient@example.com"
                            className="w-full h-8 bg-[#101014] text-[#F5F3FA] text-xs font-mono px-3 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
                          />
                        </div>
                      )}

                      <div className={recipientMode === 'anyone' ? 'md:col-span-2' : ''}>
                        <label className="text-xs font-medium text-[#F5F3FA] block mb-1">
                          Personal Message (Optional)
                        </label>
                        <input
                          type="text"
                          value={personalMessage}
                          onChange={(e) => setPersonalMessage(e.target.value)}
                          placeholder="Add a personalized message..."
                          className="w-full h-8 bg-[#101014] text-[#F5F3FA] text-xs px-3 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {validationError && (
                <div className="p-3 rounded-md bg-[#ED4245]/15 border border-[#ED4245]/40 text-xs text-[#ED4245] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Checkout Summary & Action Button */}
              <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#706C7B] block">
                      Plan
                    </span>
                    <span className="font-semibold text-[#F5F3FA] text-xs mt-0.5 block">
                      DOOMCORD {activePlanName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#706C7B] block">
                      Duration
                    </span>
                    <span className="font-mono text-[#F5F3FA] mt-0.5 block">
                      {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#706C7B] block">
                      Payment
                    </span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="mt-0.5 bg-[#17171F] text-[#F5F3FA] text-xs rounded px-2 py-0.5 border border-[#282631] outline-none"
                    >
                      <option value="Razorpay UPI / AutoPay">Razorpay UPI / AutoPay</option>
                      <option value="Razorpay Credit / Debit Card">Razorpay Card</option>
                      <option value="Razorpay NetBanking">Razorpay NetBanking</option>
                      <option value="Razorpay Wallets">Razorpay Wallets</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#706C7B] block">
                      Total
                    </span>
                    <span className="font-mono font-bold text-[#8957F5] text-sm tabular-nums mt-0.5 block">
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
                    className="w-full lg:w-auto h-9 px-5 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors whitespace-nowrap"
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
            <div className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
              <div className="px-5 py-3 bg-[#0D0D12] border-b border-[#282631]">
                <h3 className="text-xs font-semibold text-[#F5F3FA]">
                  DOOMCORD APEX — Feature Comparison
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#282631] text-[#A19DAD]">
                      <th className="py-2.5 px-5 font-semibold">Feature</th>
                      <th className="py-2.5 px-5 font-semibold">Free (₹0)</th>
                      <th className="py-2.5 px-5 font-semibold">APEX (₹49/mo)</th>
                      <th className="py-2.5 px-5 font-semibold text-[#8957F5]">
                        APEX+ (₹99/mo)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282631]/60 text-[#F5F3FA]">
                    <tr>
                      <td className="py-2 px-5 font-medium">Badge</td>
                      <td className="py-2 px-5 text-[#706C7B]">Standard</td>
                      <td className="py-2 px-5">APEX Badge</td>
                      <td className="py-2 px-5 text-[#8957F5] font-semibold">
                        Animated APEX+ Badge
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-5 font-medium">Max Upload</td>
                      <td className="py-2 px-5 font-mono tabular-nums">25 MB</td>
                      <td className="py-2 px-5 font-mono tabular-nums">50 MB</td>
                      <td className="py-2 px-5 font-mono tabular-nums text-[#8957F5] font-semibold">
                        500 MB
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-5 font-medium">Message Length</td>
                      <td className="py-2 px-5 font-mono tabular-nums">2,000 chars</td>
                      <td className="py-2 px-5 font-mono tabular-nums">2,500 chars</td>
                      <td className="py-2 px-5 font-mono tabular-nums text-[#8957F5] font-semibold">
                        4,000 chars
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-5 font-medium">Avatars & Banners</td>
                      <td className="py-2 px-5 text-[#706C7B]">Static</td>
                      <td className="py-2 px-5">Animated Avatar</td>
                      <td className="py-2 px-5 text-[#8957F5] font-semibold">
                        Animated Avatar & Banner
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-5 font-medium">Shop Discount</td>
                      <td className="py-2 px-5 font-mono tabular-nums">0%</td>
                      <td className="py-2 px-5 font-mono tabular-nums">10% off</td>
                      <td className="py-2 px-5 font-mono tabular-nums text-[#8957F5] font-semibold">
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
          <div className="space-y-5">
            <div className="p-5 rounded-xl bg-[#101014] border border-[#282631] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8957F5]">
                  Membership Status
                </span>
                <h3 className="text-base font-semibold text-[#F5F3FA]">
                  {isMainOwner
                    ? 'APEX+ UNLOCKED — Permanent Owner Membership'
                    : `DOOMCORD ${formatApexTierName(currentUser.nitroTier)}`}
                </h3>
                <p className="text-xs text-[#A19DAD] font-mono">
                  {isMainOwner ? (
                    'Entitlement: OWNER_PERMANENT_APEX · LIFETIME — NO EXPIRATION'
                  ) : (
                    <>
                      Billing: {currentUser.nitroBillingCycle || 'none'} · Auto-Renewal:{' '}
                      {currentUser.nitroAutoRenew ? 'Enabled' : 'Disabled'}
                      {currentUser.nitroExpiresAt
                        ? ` · Expires: ${new Date(currentUser.nitroExpiresAt).toLocaleDateString()}`
                        : currentUser.nitroTier !== 'free'
                        ? ' · LIFETIME'
                        : ''}
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {!isMainOwner && currentUser.nitroTier !== 'free' && (
                  <>
                    {currentUser.nitroAutoRenew ? (
                      <button
                        onClick={onCancelAutoRenew}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ED4245]/15 border border-[#ED4245]/40 text-xs font-medium text-[#ED4245]"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel Auto-Renewal</span>
                      </button>
                    ) : (
                      <button
                        onClick={onReactivateAutoRenew}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#8957F5]/15 border border-[#8957F5]/40 text-xs font-medium text-[#8957F5]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reactivate Membership</span>
                      </button>
                    )}

                    <button
                      onClick={onDowngradeToFree}
                      className="px-3 py-1.5 rounded-md bg-[#17171F] hover:bg-[#22212C] text-xs text-[#A19DAD] hover:text-[#F5F3FA] border border-[#282631]"
                    >
                      Downgrade to Free
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Official Doomcord Receipts */}
            <div className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
              <div className="px-5 py-3 bg-[#0D0D12] border-b border-[#282631] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8957F5]" />
                  <h3 className="text-xs font-semibold text-[#F5F3FA]">
                    Official Receipts
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#706C7B] tabular-nums">
                  {userReceipts.length} receipt{userReceipts.length === 1 ? '' : 's'}
                </span>
              </div>

              {userReceipts.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#706C7B]">
                  No receipts recorded for your account yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#282631] text-[#A19DAD]">
                        <th className="py-2.5 px-5">Receipt #</th>
                        <th className="py-2.5 px-5">Type / Title</th>
                        <th className="py-2.5 px-5">Recipient</th>
                        <th className="py-2.5 px-5">Duration</th>
                        <th className="py-2.5 px-5">Amount</th>
                        <th className="py-2.5 px-5">Status</th>
                        <th className="py-2.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#282631]/60">
                      {userReceipts.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#17171F]">
                          <td className="py-2.5 px-5 font-mono font-medium text-[#8957F5]">
                            {rec.receiptNumber}
                          </td>
                          <td className="py-2.5 px-5">
                            <div className="font-medium text-[#F5F3FA]">{rec.title}</div>
                            <div className="text-[10px] text-[#706C7B]">
                              {rec.receiptType}
                            </div>
                          </td>
                          <td className="py-2.5 px-5 font-mono text-[11px] text-[#A19DAD]">
                            {rec.purchaseNature === 'gift_purchase' ||
                            rec.purchaseNature === 'complimentary_owner_gift'
                              ? `Gift → ${rec.giftRecipientInfo || 'Link'}`
                              : `@${rec.customerUsername}`}
                          </td>
                          <td className="py-2.5 px-5 font-mono text-[11px] text-[#F5F3FA]">
                            {rec.serviceExpiryDate === null
                              ? 'LIFETIME'
                              : rec.serviceDurationLabel}
                          </td>
                          <td className="py-2.5 px-5 font-mono tabular-nums text-[#F5F3FA]">
                            {rec.paymentStatus === 'Complimentary'
                              ? '₹0'
                              : `₹${rec.totalAmountINR}`}
                          </td>
                          <td className="py-2.5 px-5 font-mono uppercase text-[10px] text-[#8957F5]">
                            {rec.paymentStatus}
                          </td>
                          <td className="py-2.5 px-5 text-right">
                            {onSelectReceipt && (
                              <button
                                onClick={() => onSelectReceipt(rec)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#17171F] hover:bg-[#22212C] text-[#F5F3FA] text-[11px] border border-[#282631]"
                              >
                                <FileText className="w-3 h-3 text-[#8957F5]" />
                                <span>View</span>
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

            {/* Verified Transaction History */}
            <div className="rounded-xl bg-[#101014] border border-[#282631] overflow-hidden">
              <div className="px-5 py-3 bg-[#0D0D12] border-b border-[#282631] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#8957F5]" />
                  <h3 className="text-xs font-semibold text-[#F5F3FA]">
                    Transaction Ledger
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#706C7B] tabular-nums">
                  {userTransactions.length} transaction{userTransactions.length === 1 ? '' : 's'}
                </span>
              </div>

              {userTransactions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#706C7B]">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#282631] text-[#A19DAD]">
                        <th className="py-2.5 px-5">Date</th>
                        <th className="py-2.5 px-5">Item</th>
                        <th className="py-2.5 px-5">Payment ID</th>
                        <th className="py-2.5 px-5">Amount</th>
                        <th className="py-2.5 px-5">Status</th>
                        <th className="py-2.5 px-5 text-right">Export</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#282631]/60">
                      {userTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#17171F]">
                          <td className="py-2.5 px-5 font-mono tabular-nums text-[#A19DAD]">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-5 font-medium text-[#F5F3FA]">
                            {tx.itemName}
                          </td>
                          <td className="py-2.5 px-5 font-mono text-[10px] text-[#706C7B]">
                            {tx.razorpayPaymentId || tx.razorpayOrderId || tx.id}
                          </td>
                          <td className="py-2.5 px-5 font-mono tabular-nums text-[#F5F3FA]">
                            ₹{tx.amountINR}
                          </td>
                          <td className="py-2.5 px-5 font-mono uppercase text-[10px] text-[#8957F5]">
                            {tx.status}
                          </td>
                          <td className="py-2.5 px-5 text-right">
                            <button
                              onClick={() => downloadInvoiceReceipt(tx)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#17171F] hover:bg-[#22212C] text-[#F5F3FA] text-[10px] border border-[#282631]"
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
