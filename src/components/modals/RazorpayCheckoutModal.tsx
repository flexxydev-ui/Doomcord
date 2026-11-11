import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  CheckCircle2,
  Lock,
  ExternalLink,
  Gift,
  Copy,
  Check,
  Share2,
  FileText,
  User,
  Mail,
  Globe,
} from 'lucide-react';
import { BillingCycle, UserProfile, GiftRecord, ReceiptRecord } from '../../types';
import { isRootOwner } from '../../lib/dataService';

export interface GiftCheckoutOptions {
  isGift: boolean;
  recipientMode: 'username' | 'email' | 'anyone';
  recipientUsername?: string;
  recipientUid?: string;
  recipientEmail?: string;
  personalMessage?: string;
  paymentMethodLabel: string;
}

export interface CheckoutCompletionResult {
  gift?: GiftRecord;
  claimUrl?: string;
  canonicalGiftUrl?: string;
  receipt?: ReceiptRecord;
}

export interface CheckoutPayload {
  type: 'nitro_subscription' | 'cosmetic_purchase';
  itemId: string;
  itemName: string;
  description: string;
  amountINR: number;
  billingCycle?: BillingCycle;
  tier?: 'basic' | 'nitro';
  initialGiftMode?: boolean;
  prefilledGiftOptions?: GiftCheckoutOptions;
}

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  payload: CheckoutPayload | null;
  currentUser: UserProfile;
  allUsers?: UserProfile[];
  authToken: string | null;
  onClose: () => void;
  onVerifiedSuccess: (
    payload: CheckoutPayload,
    paymentDetails: {
      orderId: string;
      paymentId: string;
      signature: string;
    },
    giftOptions?: GiftCheckoutOptions
  ) => Promise<CheckoutCompletionResult | void>;
  onOpenReceiptModal?: (receipt: ReceiptRecord) => void;
  onOpenAdminPaymentSettings?: () => void;
}

interface GatewayStatus {
  configured: boolean;
  webhookConfigured: boolean;
  mode: 'live' | 'test' | 'unconfigured';
  keyIdPublic: string | null;
  merchantUpiId: string;
  currency: string;
  supportedMethods: string[];
  missingSteps: string[];
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  payload,
  currentUser,
  allUsers = [],
  authToken,
  onClose,
  onVerifiedSuccess,
  onOpenReceiptModal,
  onOpenAdminPaymentSettings,
}) => {
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [recurringConsent, setRecurringConsent] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // #3 Send as a Gift State
  const [sendAsGift, setSendAsGift] = useState(false);
  const [recipientMode, setRecipientMode] = useState<'username' | 'email' | 'anyone'>('anyone');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState(
    'Enjoy your DOOMCORD APEX membership! Rise Above. Stand Apart.'
  );

  // Post-payment confirmation state
  const [verifiedReceipt, setVerifiedReceipt] = useState<{
    orderId: string;
    paymentId: string;
    completion?: CheckoutCompletionResult;
  } | null>(null);
  const [copiedGiftUrl, setCopiedGiftUrl] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      setVerifiedReceipt(null);
      setRecurringConsent(false);
      setSendAsGift(false);
      setRecipientUsername('');
      setRecipientEmail('');
      return;
    }

    if (payload?.prefilledGiftOptions) {
      const pre = payload.prefilledGiftOptions;
      setSendAsGift(pre.isGift || isRootOwner(currentUser));
      setRecipientMode(pre.recipientMode || 'anyone');
      setRecipientUsername(pre.recipientUsername || '');
      setRecipientEmail(pre.recipientEmail || '');
      if (pre.personalMessage) setPersonalMessage(pre.personalMessage);
    } else if (payload?.initialGiftMode || isRootOwner(currentUser)) {
      setSendAsGift(true);
    } else {
      setSendAsGift(false);
    }

    setLoadingStatus(true);
    fetch('/api/razorpay/status')
      .then((r) => r.json())
      .then((data) => {
        setGatewayStatus(data);
        setLoadingStatus(false);
      })
      .catch(() => {
        setLoadingStatus(false);
      });
  }, [isOpen, payload, currentUser]);

  if (!isOpen || !payload) return null;

  const isSubscription = payload.type === 'nitro_subscription';
  const planNameLabel =
    payload.tier === 'basic'
      ? 'APEX'
      : payload.tier === 'nitro'
      ? 'APEX+'
      : payload.itemName;

  const billingPeriodLabel =
    payload.billingCycle === 'yearly'
      ? '1 Yearly Billing Period (1 Year)'
      : '1 Monthly Billing Period (1 Month)';

  const methodLabels: Record<'upi' | 'card' | 'netbanking' | 'wallet', string> = {
    upi: 'Razorpay UPI / AutoPay',
    card: 'Razorpay Credit / Debit Card',
    netbanking: 'Razorpay NetBanking',
    wallet: 'Razorpay Wallets',
  };

  const normalizedUsername = recipientUsername.trim().replace(/^@/, '').toLowerCase();
  const matchedRecipientUser =
    normalizedUsername.length > 0
      ? allUsers.find((u) => u.username.toLowerCase() === normalizedUsername)
      : undefined;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const validateGiftInputs = (): boolean => {
    if (!sendAsGift) return true;
    if (recipientMode === 'username') {
      if (!normalizedUsername) {
        setErrorMessage(
          "Please enter the recipient's Doomcord username or choose an unrestricted gift link."
        );
        return false;
      }
      if (allUsers.length > 0 && !matchedRecipientUser) {
        setErrorMessage(
          `No registered Doomcord user found with username "@${normalizedUsername}". Check the spelling or choose an unrestricted gift link.`
        );
        return false;
      }
    }
    if (
      recipientMode === 'email' &&
      (!recipientEmail.trim() || !recipientEmail.includes('@'))
    ) {
      setErrorMessage(
        'Please enter a valid recipient email address or choose an unrestricted gift link.'
      );
      return false;
    }
    return true;
  };

  const handleLaunchRazorpay = async () => {
    setErrorMessage(null);

    if (!validateGiftInputs()) {
      return;
    }

    if (isSubscription && !sendAsGift && !recurringConsent) {
      setErrorMessage(
        'Please confirm explicit consent for recurring billing and auto-renewal terms before proceeding.'
      );
      return;
    }

    setProcessing(true);
    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify({
          amountINR: payload.amountINR,
          type: sendAsGift ? 'apex_gift_purchase' : payload.type,
          itemId: payload.itemId,
          itemName: sendAsGift
            ? `${payload.itemName} (APEX Gift)`
            : payload.itemName,
          billingCycle: payload.billingCycle || 'none',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setErrorMessage(
          orderData.message ||
            orderData.error ||
            'Razorpay order could not be created. Verify API credentials in Admin Payment Settings.'
        );
        setProcessing(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage(
          'Unable to load Razorpay Checkout SDK. Check your network connection.'
        );
        setProcessing(false);
        return;
      }

      const giftOpts: GiftCheckoutOptions = {
        isGift: sendAsGift,
        recipientMode,
        recipientUsername:
          recipientMode === 'username' ? normalizedUsername : undefined,
        recipientUid:
          recipientMode === 'username' && matchedRecipientUser
            ? matchedRecipientUser.uid
            : undefined,
        recipientEmail:
          recipientMode === 'email'
            ? recipientEmail.trim().toLowerCase()
            : undefined,
        personalMessage: personalMessage.trim(),
        paymentMethodLabel: methodLabels[selectedMethod],
      };

      const options = {
        key: orderData.keyId,
        amount: orderData.amountPaise || orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'DOOMCORD APEX',
        description: sendAsGift
          ? `APEX GIFT: ${payload.itemName} (${billingPeriodLabel})`
          : `${payload.itemName} (${
              payload.billingCycle ? payload.billingCycle.toUpperCase() : 'One-Time'
            })`,
        order_id: orderData.orderId,
        prefill: {
          name: currentUser.displayName,
          email: currentUser.email,
        },
        notes: {
          merchant_upi_id: orderData.merchantUpiId || 'adrenoxshriyans@fam',
          user_id: currentUser.uid,
          item_id: payload.itemId,
          is_gift: sendAsGift ? 'true' : 'false',
        },
        theme: {
          color: '#8BE2B8',
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: authToken ? `Bearer ${authToken}` : '',
              },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) {
              setErrorMessage(
                verifyData.error ||
                  'Server-side cryptographic signature verification failed.'
              );
              setProcessing(false);
              return;
            }

            const result = await onVerifiedSuccess(
              payload,
              {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
              giftOpts
            );

            setVerifiedReceipt({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              completion: result || undefined,
            });
          } catch (err: any) {
            setErrorMessage(err.message || 'Verification failed.');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        setErrorMessage(
          resp?.error?.description || 'Payment failed in Razorpay Checkout.'
        );
        setProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Unexpected error during Razorpay Checkout initialization.'
      );
      setProcessing(false);
    }
  };

  const recipientSummaryLabel =
    recipientMode === 'username' && normalizedUsername
      ? `@${normalizedUsername}`
      : recipientMode === 'email' && recipientEmail.trim()
      ? recipientEmail.trim()
      : 'Unrestricted Gift Link (Shareable with anyone)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-[#101A17] border border-white/[0.08] shadow-2xl overflow-hidden text-[#F0F5F1]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111B17] border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#192620] border border-[#8BE2B8]/30 flex items-center justify-center text-[#8BE2B8]">
              {sendAsGift ? (
                <Gift className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-[#F0F5F1]">
                {sendAsGift
                  ? 'DOOMCORD APEX — Gift Purchase Checkout (INR)'
                  : 'DOOMCORD APEX — Official Checkout (INR)'}
              </h3>
              <span className="text-[11px] text-[#718478] font-mono">
                Merchant UPI Reference:{' '}
                {gatewayStatus?.merchantUpiId || 'adrenoxshriyans@fam'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9BAEA2] hover:text-[#F0F5F1] hover:bg-[#192620]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {verifiedReceipt ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#192620] border border-[#8BE2B8]/40 flex items-center justify-center text-[#8BE2B8]">
                {verifiedReceipt.completion?.gift ? (
                  <Gift className="w-8 h-8" />
                ) : (
                  <CheckCircle2 className="w-8 h-8" />
                )}
              </div>

              <div>
                <h4 className="text-base font-display font-bold text-[#F0F5F1]">
                  {verifiedReceipt.completion?.gift
                    ? 'APEX Gift Purchased & Ready to Share!'
                    : 'Payment Cryptographically Verified'}
                </h4>
                <p className="text-xs text-[#9BAEA2] mt-1">
                  {verifiedReceipt.completion?.gift
                    ? 'Your membership was NOT activated on your account. Share the unique gift link below so the recipient can claim their APEX benefits.'
                    : `Your entitlement (${payload.itemName}) is now active on your account.`}
                </p>
              </div>

              {/* If Purchased as a Gift: Show Unique Gift Link & Copy/Share Actions */}
              {verifiedReceipt.completion?.gift &&
                verifiedReceipt.completion.claimUrl && (
                  <div className="p-4 rounded-xl bg-[#141F1B] border border-[#8BE2B8]/40 text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8BE2B8]">
                        Unique Single-Use Gift Redemption Link
                      </span>
                      <span className="text-[10px] font-mono text-[#9BAEA2]">
                        {billingPeriodLabel}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#101A17] border border-white/10 font-mono text-[11px] text-[#F0F5F1] break-all">
                      {verifiedReceipt.completion.canonicalGiftUrl}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            verifiedReceipt.completion?.claimUrl || ''
                          );
                          setCopiedGiftUrl(true);
                          setTimeout(() => setCopiedGiftUrl(false), 2500);
                        }}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#8BE2B8] text-[#101A17] font-semibold text-xs flex items-center justify-center gap-1.5"
                      >
                        {copiedGiftUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied Gift Link!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Gift Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const shareText = `I sent you a ${payload.itemName} gift on DOOMCORD APEX! Claim it here: ${verifiedReceipt.completion?.claimUrl}`;
                          navigator.clipboard.writeText(shareText);
                          setCopiedGiftUrl(true);
                          setTimeout(() => setCopiedGiftUrl(false), 2500);
                        }}
                        className="py-2 px-3 rounded-lg bg-[#192620] hover:bg-[#24362C] text-[#F0F5F1] font-semibold text-xs flex items-center gap-1.5 border border-white/10"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Gift</span>
                      </button>
                    </div>
                  </div>
                )}

              <div className="p-3.5 rounded-xl bg-[#141F1B] border border-white/[0.06] text-left font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#718478]">Order ID:</span>
                  <span className="text-[#F0F5F1]">{verifiedReceipt.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#718478]">Payment ID:</span>
                  <span className="text-[#8BE2B8]">{verifiedReceipt.paymentId}</span>
                </div>
                {verifiedReceipt.completion?.receipt && (
                  <div className="flex justify-between">
                    <span className="text-[#718478]">Official Receipt ID:</span>
                    <span className="text-[#F0F5F1] font-bold">
                      {verifiedReceipt.completion.receipt.receiptNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#718478]">Amount Paid:</span>
                  <span className="text-[#F0F5F1] tabular-nums">
                    ₹{payload.amountINR} INR
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {verifiedReceipt.completion?.receipt && onOpenReceiptModal && (
                  <button
                    type="button"
                    onClick={() => {
                      const rec = verifiedReceipt.completion?.receipt;
                      if (rec) {
                        onClose();
                        onOpenReceiptModal(rec);
                      }
                    }}
                    className="flex-1 py-2.5 px-4 text-xs font-semibold text-[#F0F5F1] bg-[#192620] hover:bg-[#24362C] rounded-lg border border-white/10 flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8BE2B8]" />
                    <span>View Official Receipt</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 text-xs font-semibold text-[#101A17] bg-[#8BE2B8] rounded-lg"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Selected Membership Plan Summary Card */}
              <div className="p-4 rounded-xl bg-[#141F1B] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8BE2B8]">
                    {isSubscription
                      ? sendAsGift
                        ? `APEX Gift · ${billingPeriodLabel}`
                        : `Recurring ${payload.billingCycle} Membership`
                      : 'One-Time APEX Collection Order'}
                  </span>
                  <h4 className="text-sm font-display font-bold text-[#F0F5F1] mt-0.5">
                    {payload.itemName}
                  </h4>
                  <p className="text-xs text-[#9BAEA2] mt-0.5">
                    {payload.description}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-xl font-display font-bold text-[#F0F5F1] font-mono tabular-nums">
                    ₹{payload.amountINR}
                  </span>
                  <span className="block text-[10px] text-[#718478] font-mono">
                    INR{' '}
                    {isSubscription
                      ? `/ ${payload.billingCycle === 'yearly' ? 'yr' : 'mo'}`
                      : ''}
                  </span>
                </div>
              </div>

              {/* 2. SEND AS A GIFT CHECKBOX (#3) */}
              {isSubscription && (
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    sendAsGift
                      ? 'bg-[#192620] border-[#8BE2B8]/50'
                      : 'bg-[#141F1B] border-white/[0.07]'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isRootOwner(currentUser) ? true : sendAsGift}
                      disabled={isRootOwner(currentUser)}
                      onChange={(e) => setSendAsGift(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#8BE2B8] rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F0F5F1] flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-[#8BE2B8]" />
                          <span>Send as a gift</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#8BE2B8]">
                          · {billingPeriodLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9BAEA2] mt-0.5 leading-relaxed">
                        Give someone special access to Doomcord premium features. Purchase APEX or APEX+ for another person.
                      </p>
                    </div>
                  </label>

                  {/* Expanded Gift Configuration Section */}
                  {sendAsGift && (
                    <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-4">
                      <div>
                        <label className="text-xs font-bold text-[#F0F5F1] block mb-2">
                          Gift this membership to someone
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            {
                              id: 'username',
                              label: 'Doomcord Username',
                              icon: User,
                            },
                            {
                              id: 'email',
                              label: 'Recipient Email',
                              icon: Mail,
                            },
                            {
                              id: 'anyone',
                              label: 'Unrestricted Link',
                              icon: Globe,
                            },
                          ].map((opt) => {
                            const Icon = opt.icon;
                            const active = recipientMode === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setRecipientMode(opt.id as any)}
                                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition-colors text-left ${
                                  active
                                    ? 'bg-[#24362C] border-[#8BE2B8] text-[#F0F5F1] font-semibold'
                                    : 'bg-[#101A17] border-white/[0.06] text-[#9BAEA2] hover:text-[#F0F5F1]'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 text-[#8BE2B8] shrink-0" />
                                <span className="truncate">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {recipientMode === 'username' && (
                        <div>
                          <label className="text-[11px] font-semibold text-[#F0F5F1] block mb-1">
                            Recipient's Doomcord Username
                          </label>
                          <input
                            type="text"
                            value={recipientUsername}
                            onChange={(e) => setRecipientUsername(e.target.value)}
                            placeholder="e.g. shadow_walker"
                            className="w-full bg-[#101A17] text-[#F0F5F1] text-xs font-mono px-3.5 py-2 rounded-lg border border-white/10 outline-none focus:border-[#8BE2B8]"
                          />
                        </div>
                      )}

                      {recipientMode === 'email' && (
                        <div>
                          <label className="text-[11px] font-semibold text-[#F0F5F1] block mb-1">
                            Recipient's Account Email
                          </label>
                          <input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="friend@domain.com"
                            className="w-full bg-[#101A17] text-[#F0F5F1] text-xs font-mono px-3.5 py-2 rounded-lg border border-white/10 outline-none focus:border-[#8BE2B8]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] font-semibold text-[#F0F5F1] block mb-1">
                          Personal Gift Message (Optional)
                        </label>
                        <input
                          type="text"
                          value={personalMessage}
                          onChange={(e) => setPersonalMessage(e.target.value)}
                          placeholder="Write a personal message for the recipient..."
                          className="w-full bg-[#101A17] text-[#F0F5F1] text-xs px-3.5 py-2 rounded-lg border border-white/10 outline-none focus:border-[#8BE2B8]"
                        />
                      </div>

                      {/* Live Gift Summary Preview */}
                      <div className="p-3.5 rounded-xl bg-[#101A17] border border-[#8BE2B8]/30 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#8BE2B8]">
                          <span>Live Gift Summary Preview</span>
                          <span>DOOMCORD APEX GIFT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#9BAEA2]">Selected Membership:</span>
                          <span className="text-[#F0F5F1] font-bold">
                            {payload.itemName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#9BAEA2]">Membership Duration:</span>
                          <span className="text-[#F0F5F1] font-mono">
                            {billingPeriodLabel}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#9BAEA2]">Intended Recipient:</span>
                          <span className="text-[#8BE2B8] font-mono">
                            {recipientSummaryLabel}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#9BAEA2]">Payment Method:</span>
                          <span className="text-[#F0F5F1] font-mono">
                            {methodLabels[selectedMethod]}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-white/10">
                          <span className="text-[#F0F5F1] font-bold">
                            Total Gift Price:
                          </span>
                          <span className="text-[#8BE2B8] font-bold font-mono tabular-nums">
                            ₹{payload.amountINR} INR
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Supported Payment Methods Selector */}
              <div>
                <label className="text-xs font-semibold text-[#F0F5F1] block mb-2">
                  Preferred Payment Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / AutoPay', icon: Smartphone },
                    { id: 'card', label: 'Cards', icon: CreditCard },
                    { id: 'netbanking', label: 'NetBanking', icon: Building2 },
                    { id: 'wallet', label: 'Wallets', icon: Wallet },
                  ].map((m) => {
                    const Icon = m.icon;
                    const active = selectedMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethod(m.id as any)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs transition-colors ${
                          active
                            ? 'bg-[#24362C] border-[#8BE2B8] text-[#F0F5F1] font-semibold'
                            : 'bg-[#141F1B] border-white/[0.06] text-[#9BAEA2] hover:text-[#F0F5F1]'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#8BE2B8]" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explicit Recurring Consent for Self Subscriptions */}
              {isSubscription && !sendAsGift && (
                <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#141F1B] border border-white/[0.06] cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={recurringConsent}
                    onChange={(e) => setRecurringConsent(e.target.checked)}
                    className="mt-0.5 accent-[#8BE2B8]"
                  />
                  <span className="text-[#9BAEA2] leading-relaxed">
                    I authorize recurring {payload.billingCycle} charges of{' '}
                    <strong className="text-[#F0F5F1] font-mono">
                      ₹{payload.amountINR} INR
                    </strong>{' '}
                    via Razorpay Subscriptions / UPI AutoPay until cancelled in APEX Membership Management.
                  </span>
                </label>
              )}

              {/* Gateway Configuration Warning if API Keys are missing */}
              {!loadingStatus && gatewayStatus && !gatewayStatus.configured && (
                <div className="p-4 rounded-xl bg-[#D9BB79]/15 border border-[#D9BB79]/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D9BB79]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Razorpay API Keys Not Configured Yet</span>
                  </div>
                  <p className="text-[11px] text-[#F0F5F1] leading-relaxed">
                    Doomcord strictly enforces real server-side payment verification and never fakes live payment completions. To enable live or test Razorpay Checkout:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-[#9BAEA2] space-y-1 font-mono">
                    {(gatewayStatus.missingSteps || []).map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                  {(currentUser.role === 'root_owner' ||
                    currentUser.role === 'secondary_owner' ||
                    currentUser.role === 'owner' ||
                    currentUser.role === 'admin') &&
                    onOpenAdminPaymentSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAdminPaymentSettings();
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D9BB79] text-[#101A17] font-semibold text-xs"
                      >
                        <span>Configure Razorpay Keys in Admin Console</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#E57373]/15 border border-[#E57373]/40 text-xs text-[#E57373]">
                  {errorMessage}
                </div>
              )}

              {/* Footer Action (#3: "Purchase Gift" when checked, "Purchase APEX" / "Purchase APEX+" when unchecked) */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-[#718478]">
                  <Lock className="w-3.5 h-3.5 text-[#8BE2B8]" />
                  <span>256-bit HMAC-SHA256 Server Verification</span>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchRazorpay}
                  disabled={processing}
                  className="px-5 py-2.5 text-xs font-bold text-[#101A17] bg-[#8BE2B8] hover:bg-[#7AD4A8] rounded-lg shadow-lg disabled:opacity-40 transition-colors flex items-center gap-2"
                >
                  {sendAsGift && <Gift className="w-3.5 h-3.5" />}
                  <span>
                    {processing
                      ? 'Connecting to Razorpay...'
                      : sendAsGift
                      ? 'Purchase Gift'
                      : isSubscription
                      ? `Purchase ${planNameLabel}`
                      : `Purchase Item (₹${payload.amountINR})`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
