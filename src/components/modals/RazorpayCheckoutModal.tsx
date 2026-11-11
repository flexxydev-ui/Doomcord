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
} from 'lucide-react';
import { BillingCycle, UserProfile } from '../../types';

export interface CheckoutPayload {
  type: 'nitro_subscription' | 'cosmetic_purchase';
  itemId: string;
  itemName: string;
  description: string;
  amountINR: number;
  billingCycle?: BillingCycle;
  tier?: 'basic' | 'nitro';
}

interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  payload: CheckoutPayload | null;
  currentUser: UserProfile;
  authToken: string | null;
  onClose: () => void;
  onVerifiedSuccess: (
    payload: CheckoutPayload,
    paymentDetails: {
      orderId: string;
      paymentId: string;
      signature: string;
    }
  ) => Promise<void>;
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
  authToken,
  onClose,
  onVerifiedSuccess,
  onOpenAdminPaymentSettings,
}) => {
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [recurringConsent, setRecurringConsent] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedReceipt, setVerifiedReceipt] = useState<{
    orderId: string;
    paymentId: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      setVerifiedReceipt(null);
      setRecurringConsent(false);
      return;
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
  }, [isOpen]);

  if (!isOpen || !payload) return null;

  const isSubscription = payload.type === 'nitro_subscription';

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

  const handleLaunchRazorpay = async () => {
    setErrorMessage(null);

    if (isSubscription && !recurringConsent) {
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
          itemType: payload.type,
          itemId: payload.itemId,
          itemName: payload.itemName,
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
        setErrorMessage('Unable to load Razorpay Checkout SDK. Check your network connection.');
        setProcessing(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Doomcord',
        description: `${payload.itemName} (${payload.billingCycle ? payload.billingCycle.toUpperCase() : 'One-Time'})`,
        order_id: orderData.orderId,
        prefill: {
          name: currentUser.displayName,
          email: currentUser.email,
        },
        notes: {
          merchant_upi_id: orderData.merchantUpiId || 'adrenoxshriyans@fam',
          user_id: currentUser.uid,
          item_id: payload.itemId,
        },
        theme: {
          color: '#10b981',
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
                verifyData.error || 'Server-side cryptographic signature verification failed.'
              );
              setProcessing(false);
              return;
            }

            await onVerifiedSuccess(payload, {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            setVerifiedReceipt({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
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
        setErrorMessage(resp?.error?.description || 'Payment failed in Razorpay Checkout.');
        setProcessing(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unexpected error during Razorpay Checkout initialization.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[oklch(0.14_0.025_162)] border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Razorpay Official Checkout (INR)</h3>
              <span className="text-[11px] text-[oklch(0.7_0.03_155)] font-mono">
                Merchant UPI Reference: {gatewayStatus?.merchantUpiId || 'adrenoxshriyans@fam'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {verifiedReceipt ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[oklch(0.85_0.12_165)]/20 border border-[oklch(0.85_0.12_165)]/40 flex items-center justify-center text-[oklch(0.85_0.12_165)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Payment Cryptographically Verified</h4>
                <p className="text-xs text-[oklch(0.7_0.03_155)] mt-1">
                  Your entitlement ({payload.itemName}) is now permanently recorded on your account.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/5 text-left font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[oklch(0.7_0.03_155)]">Order ID:</span>
                  <span className="text-white">{verifiedReceipt.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[oklch(0.7_0.03_155)]">Payment ID:</span>
                  <span className="text-[oklch(0.85_0.12_165)]">{verifiedReceipt.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[oklch(0.7_0.03_155)]">Amount Paid:</span>
                  <span className="text-white tabular-nums">₹{payload.amountINR} INR</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] rounded-xl"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Order Summary Card */}
              <div className="p-4 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[oklch(0.85_0.12_165)]">
                    {isSubscription ? `Recurring ${payload.billingCycle} Plan` : 'One-Time Cosmetic Order'}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{payload.itemName}</h4>
                  <p className="text-xs text-[oklch(0.7_0.03_155)] mt-0.5">{payload.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-xl font-black text-white font-mono tabular-nums">
                    ₹{payload.amountINR}
                  </span>
                  <span className="block text-[10px] text-[oklch(0.7_0.03_155)] font-mono">
                    INR {isSubscription ? `/ ${payload.billingCycle === 'yearly' ? 'yr' : 'mo'}` : ''}
                  </span>
                </div>
              </div>

              {/* Supported Payment Methods Selector */}
              <div>
                <label className="text-xs font-semibold text-white block mb-2">
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
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs transition-all ${
                          active
                            ? 'bg-[oklch(0.235_0.032_158)] border-[oklch(0.85_0.12_165)] text-white font-semibold'
                            : 'bg-white/5 border-white/5 text-[oklch(0.7_0.03_155)] hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Merchant UPI Reference Box */}
              <div className="p-3.5 rounded-2xl bg-[oklch(0.14_0.025_162)] border border-white/5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[oklch(0.7_0.03_155)]">Verified Merchant UPI ID:</span>
                  <span className="font-mono font-semibold text-[oklch(0.85_0.12_165)]">
                    {gatewayStatus?.merchantUpiId || 'adrenoxshriyans@fam'}
                  </span>
                </div>
                <p className="text-[11px] text-[oklch(0.7_0.03_155)] leading-relaxed">
                  Note: Merchant settlement, KYC onboarding, and UPI AutoPay mandates are governed by the Razorpay Dashboard and verified via server-side HMAC signatures.
                </p>
              </div>

              {/* Explicit Recurring Consent for Subscriptions */}
              {isSubscription && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[oklch(0.235_0.032_158)]/60 border border-white/5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={recurringConsent}
                    onChange={(e) => setRecurringConsent(e.target.checked)}
                    className="mt-0.5 accent-[oklch(0.85_0.12_165)]"
                  />
                  <span className="text-[oklch(0.95_0.015_150)] leading-relaxed">
                    I authorize recurring {payload.billingCycle} charges of{' '}
                    <strong className="text-white font-mono">₹{payload.amountINR} INR</strong> via Razorpay Subscriptions / UPI AutoPay until cancelled in Subscription Management.
                  </span>
                </label>
              )}

              {/* Gateway Configuration Warning if API Keys are missing */}
              {!loadingStatus && gatewayStatus && !gatewayStatus.configured && (
                <div className="p-4 rounded-2xl bg-[oklch(0.84_0.14_85)]/15 border border-[oklch(0.84_0.14_85)]/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[oklch(0.84_0.14_85)]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Razorpay API Keys Not Configured Yet</span>
                  </div>
                  <p className="text-[11px] text-[oklch(0.95_0.015_150)] leading-relaxed">
                    Doomcord strictly enforces real server-side payment verification and never fakes live payment completions. To enable live or test Razorpay Checkout:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-[oklch(0.7_0.03_155)] space-y-1 font-mono">
                    {gatewayStatus.missingSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                  {(currentUser.role === 'owner' || currentUser.role === 'admin') &&
                    onOpenAdminPaymentSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAdminPaymentSettings();
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[oklch(0.84_0.14_85)] text-black font-semibold text-xs"
                      >
                        <span>Configure Razorpay Keys in Admin Dashboard</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-[oklch(0.72_0.15_355)]/20 border border-[oklch(0.72_0.15_355)]/40 text-xs text-[oklch(0.72_0.15_355)]">
                  {errorMessage}
                </div>
              )}

              {/* Footer Action */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-[oklch(0.7_0.03_155)]">
                  <Lock className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
                  <span>256-bit HMAC-SHA256 Server Verification</span>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchRazorpay}
                  disabled={processing}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] rounded-xl shadow-lg hover:opacity-95 disabled:opacity-40 transition-all"
                >
                  {processing ? 'Connecting to Razorpay...' : `Pay ₹${payload.amountINR} via Razorpay`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
