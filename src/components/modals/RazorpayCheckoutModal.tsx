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

  // Send as a Gift State
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
      ? '1 Year'
      : '1 Month';

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
          `No registered user found with username "@${normalizedUsername}". Check the spelling or choose an unrestricted gift link.`
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
          color: '#8957F5',
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
      : 'Unrestricted Gift Link';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-[#09090D] border border-[#282631] shadow-2xl overflow-hidden text-[#F5F3FA]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0D0D12] border-b border-[#282631]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#17171F] border border-[#8957F5]/30 flex items-center justify-center text-[#8957F5]">
              {sendAsGift ? (
                <Gift className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#F5F3FA]">
                {sendAsGift
                  ? 'APEX — Gift Checkout (INR)'
                  : 'APEX — Checkout (INR)'}
              </h3>
              <span className="text-[10px] text-[#706C7B] font-mono">
                Verified Razorpay Gateway
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {verifiedReceipt ? (
            <div className="text-center py-3 space-y-3.5">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#17171F] border border-[#8957F5]/40 flex items-center justify-center text-[#8957F5]">
                {verifiedReceipt.completion?.gift ? (
                  <Gift className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#F5F3FA]">
                  {verifiedReceipt.completion?.gift
                    ? 'APEX Gift Ready to Share!'
                    : 'Payment Verified'}
                </h4>
                <p className="text-xs text-[#A19DAD] mt-0.5">
                  {verifiedReceipt.completion?.gift
                    ? 'Share the single-use gift link below with the recipient.'
                    : `Your membership (${payload.itemName}) is now active.`}
                </p>
              </div>

              {/* If Purchased as a Gift */}
              {verifiedReceipt.completion?.gift &&
                verifiedReceipt.completion.claimUrl && (
                  <div className="p-3.5 rounded-lg bg-[#101014] border border-[#8957F5]/40 text-left space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#8957F5]">
                        Gift Redemption Link
                      </span>
                      <span className="text-[10px] font-mono text-[#706C7B]">
                        {billingPeriodLabel}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-[#17171F] border border-[#282631] font-mono text-[11px] text-[#F5F3FA] break-all">
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
                        className="flex-1 py-1.5 px-3 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        {copiedGiftUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const shareText = `Here's your DOOMCORD ${payload.itemName} gift: ${verifiedReceipt.completion?.claimUrl}`;
                          navigator.clipboard.writeText(shareText);
                          setCopiedGiftUrl(true);
                          setTimeout(() => setCopiedGiftUrl(false), 2500);
                        }}
                        className="py-1.5 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] text-[#F5F3FA] font-medium text-xs flex items-center gap-1 border border-[#282631]"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                )}

              <div className="p-3 rounded-lg bg-[#101014] border border-[#282631] text-left font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#706C7B]">Order ID:</span>
                  <span className="text-[#F5F3FA]">{verifiedReceipt.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#706C7B]">Payment ID:</span>
                  <span className="text-[#8957F5]">{verifiedReceipt.paymentId}</span>
                </div>
                {verifiedReceipt.completion?.receipt && (
                  <div className="flex justify-between">
                    <span className="text-[#706C7B]">Receipt:</span>
                    <span className="text-[#F5F3FA] font-bold">
                      {verifiedReceipt.completion.receipt.receiptNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#706C7B]">Amount:</span>
                  <span className="text-[#F5F3FA] tabular-nums">
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
                    className="flex-1 py-2 px-3 text-xs font-medium text-[#F5F3FA] bg-[#17171F] hover:bg-[#22212C] rounded-md border border-[#282631] flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8957F5]" />
                    <span>View Receipt</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 py-2 text-xs font-medium text-white bg-[#8957F5] hover:bg-[#7a4be6] rounded-md shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Plan Summary Card */}
              <div className="p-3.5 rounded-lg bg-[#101014] border border-[#282631] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8957F5]">
                    {isSubscription
                      ? sendAsGift
                        ? `APEX Gift · ${billingPeriodLabel}`
                        : `${payload.billingCycle} Membership`
                      : 'Item Order'}
                  </span>
                  <h4 className="text-xs font-semibold text-[#F5F3FA] mt-0.5">
                    {payload.itemName}
                  </h4>
                  <p className="text-[11px] text-[#706C7B]">
                    {payload.description}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="text-lg font-bold text-[#F5F3FA] font-mono tabular-nums">
                    ₹{payload.amountINR}
                  </span>
                  <span className="block text-[10px] text-[#706C7B] font-mono">
                    INR
                  </span>
                </div>
              </div>

              {/* SEND AS A GIFT CHECKBOX */}
              {isSubscription && (
                <div
                  className={`p-3.5 rounded-lg border transition-all ${
                    sendAsGift
                      ? 'bg-[#17171F] border-[#8957F5]/50'
                      : 'bg-[#101014] border-[#282631]'
                  }`}
                >
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isRootOwner(currentUser) ? true : sendAsGift}
                      disabled={isRootOwner(currentUser)}
                      onChange={(e) => setSendAsGift(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#8957F5] rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#F5F3FA] flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5 text-[#8957F5]" />
                          <span>Send as a gift</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#A47BFF]">
                          · {billingPeriodLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#706C7B] mt-0.5 leading-relaxed">
                        Purchase this membership for someone else and generate a shareable gift link.
                      </p>
                    </div>
                  </label>

                  {/* Expanded Gift Configuration */}
                  {sendAsGift && (
                    <div className="mt-3 pt-3 border-t border-[#282631] space-y-3">
                      <div>
                        <label className="text-xs font-medium text-[#F5F3FA] block mb-1.5">
                          Recipient Type
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { id: 'username', label: 'Username', icon: User },
                            { id: 'email', label: 'Email', icon: Mail },
                            { id: 'anyone', label: 'Link Only', icon: Globe },
                          ].map((opt) => {
                            const Icon = opt.icon;
                            const active = recipientMode === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setRecipientMode(opt.id as any)}
                                className={`flex items-center gap-1.5 p-2 rounded-md border text-xs transition-colors text-left ${
                                  active
                                    ? 'bg-[#22212C] border-[#8957F5] text-[#F5F3FA]'
                                    : 'bg-[#101014] border-[#282631] text-[#A19DAD] hover:text-[#F5F3FA]'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 text-[#8957F5] shrink-0" />
                                <span>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {recipientMode === 'username' && (
                        <div>
                          <label className="text-[11px] font-medium text-[#A19DAD] block mb-1">
                            Recipient's Username
                          </label>
                          <input
                            type="text"
                            value={recipientUsername}
                            onChange={(e) => setRecipientUsername(e.target.value)}
                            placeholder="@username"
                            className="w-full bg-[#101014] text-[#F5F3FA] text-xs font-mono px-3 py-1.5 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
                          />
                        </div>
                      )}

                      {recipientMode === 'email' && (
                        <div>
                          <label className="text-[11px] font-medium text-[#A19DAD] block mb-1">
                            Recipient's Email
                          </label>
                          <input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="recipient@example.com"
                            className="w-full bg-[#101014] text-[#F5F3FA] text-xs font-mono px-3 py-1.5 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="text-[11px] font-medium text-[#A19DAD] block mb-1">
                          Personal Message
                        </label>
                        <input
                          type="text"
                          value={personalMessage}
                          onChange={(e) => setPersonalMessage(e.target.value)}
                          placeholder="Add a message..."
                          className="w-full bg-[#101014] text-[#F5F3FA] text-xs px-3 py-1.5 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Methods */}
              <div>
                <label className="text-xs font-medium text-[#A19DAD] block mb-1.5">
                  Payment Method
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
                        className={`flex flex-col items-center gap-1 p-2 rounded-md border text-xs transition-colors ${
                          active
                            ? 'bg-[#17171F] border-[#8957F5] text-[#F5F3FA]'
                            : 'bg-[#101014] border-[#282631] text-[#A19DAD] hover:text-[#F5F3FA]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-[#8957F5]" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Consent for Self Subscriptions */}
              {isSubscription && !sendAsGift && (
                <label className="flex items-start gap-2 p-2.5 rounded-md bg-[#101014] border border-[#282631] cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={recurringConsent}
                    onChange={(e) => setRecurringConsent(e.target.checked)}
                    className="mt-0.5 accent-[#8957F5]"
                  />
                  <span className="text-[#A19DAD] text-[11px] leading-relaxed">
                    I authorize recurring {payload.billingCycle} charges of{' '}
                    <strong className="text-[#F5F3FA] font-mono">
                      ₹{payload.amountINR} INR
                    </strong>{' '}
                    via Razorpay Subscriptions until cancelled in Settings.
                  </span>
                </label>
              )}

              {errorMessage && (
                <div className="p-2.5 rounded-md bg-[#ED4245]/15 border border-[#ED4245]/40 text-xs text-[#ED4245]">
                  {errorMessage}
                </div>
              )}

              {/* Footer Action */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-[10px] text-[#706C7B]">
                  <Lock className="w-3 h-3 text-[#8957F5]" />
                  <span>256-bit Secure Gateway</span>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchRazorpay}
                  disabled={processing}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#8957F5] hover:bg-[#7a4be6] rounded-md shadow-sm disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  {sendAsGift && <Gift className="w-3.5 h-3.5" />}
                  <span>
                    {processing
                      ? 'Connecting...'
                      : sendAsGift
                      ? 'Purchase Gift'
                      : isSubscription
                      ? `Purchase ${planNameLabel}`
                      : `Purchase (₹${payload.amountINR})`}
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
