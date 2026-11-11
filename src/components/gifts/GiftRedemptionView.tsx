import React, { useState, useEffect } from 'react';
import {
  Gift,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Lock,
  UserCheck,
  Crown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  GiftRecord,
  CosmeticItem,
  UserProfile,
  OwnerInvitationRecord,
} from '../../types';
import {
  formatApexTierName,
  formatDurationLabel,
} from '../../lib/dataService';
import { sha256HexBrowser } from '../../context/AuthContext';

interface GiftRedemptionViewProps {
  initialToken?: string;
  mode: 'gift' | 'owner_invite';
  currentUser: UserProfile | null;
  gifts: GiftRecord[];
  ownerInvitations: OwnerInvitationRecord[];
  cosmetics: CosmeticItem[];
  onRedeemGift: (gift: GiftRecord, rawToken: string) => Promise<void>;
  onAcceptOwnerInvite: (
    invite: OwnerInvitationRecord,
    username: string,
    displayName: string,
    password: string
  ) => Promise<void>;
  onBackToApp: () => void;
}

export const GiftRedemptionView: React.FC<GiftRedemptionViewProps> = ({
  initialToken = '',
  mode,
  currentUser,
  gifts,
  ownerInvitations,
  cosmetics,
  onRedeemGift,
  onAcceptOwnerInvite,
  onBackToApp,
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [matchedGift, setMatchedGift] = useState<GiftRecord | null>(null);
  const [matchedInvite, setMatchedInvite] = useState<OwnerInvitationRecord | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedSuccess, setClaimedSuccess] = useState(false);

  // Secondary Owner Onboarding fields
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteDisplayName, setInviteDisplayName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');

  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
    }
  }, [initialToken]);

  // Verify token hash against database records
  useEffect(() => {
    async function verifyToken() {
      setLookupError(null);
      const clean = tokenInput.trim();
      if (!clean) {
        setMatchedGift(null);
        setMatchedInvite(null);
        return;
      }

      // Extract raw token if user pasted full URL like https://doomcord.com/gift/APEX-...
      const extracted = clean.includes('/gift/')
        ? clean.split('/gift/')[1].split(/[?#]/)[0]
        : clean.includes('gift=')
        ? new URLSearchParams(clean.split('?')[1] || '').get('gift') || clean
        : clean.includes('owner_invite=')
        ? new URLSearchParams(clean.split('?')[1] || '').get('owner_invite') || clean
        : clean;

      const hash = await sha256HexBrowser(extracted);

      if (mode === 'owner_invite' || extracted.startsWith('OWN-')) {
        const foundInvite = ownerInvitations.find(
          (inv) => inv.tokenHash === hash || inv.inviteToken === extracted
        );
        if (foundInvite) {
          setMatchedInvite(foundInvite);
          setInviteDisplayName(foundInvite.invitedDisplayName || '');
          setMatchedGift(null);
          return;
        }
      }

      const foundGift = gifts.find(
        (g) => g.tokenHash === hash || g.claimToken === extracted || g.id === extracted
      );
      if (foundGift) {
        setMatchedGift(foundGift);
        setMatchedInvite(null);
      } else {
        setMatchedGift(null);
        setMatchedInvite(null);
      }
    }

    verifyToken();
  }, [tokenInput, gifts, ownerInvitations, mode]);

  const handleClaimGift = async () => {
    if (!matchedGift) {
      setLookupError('Invalid or unrecognized gift token.');
      return;
    }
    if (!currentUser) {
      setLookupError('Please sign in or register an account first to claim this gift.');
      return;
    }

    setLookupError(null);
    setClaiming(true);
    try {
      await onRedeemGift(matchedGift, tokenInput.trim());
      setClaimedSuccess(true);
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      setLookupError(err?.message || 'Failed to redeem gift.');
    } finally {
      setClaiming(false);
    }
  };

  const handleAcceptInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedInvite) return;
    setLookupError(null);
    setClaiming(true);
    try {
      await onAcceptOwnerInvite(
        matchedInvite,
        inviteUsername,
        inviteDisplayName,
        invitePassword
      );
      setClaimedSuccess(true);
    } catch (err: any) {
      setLookupError(err?.message || 'Failed to activate Secondary Owner account.');
    } finally {
      setClaiming(false);
    }
  };

  const giftedCosmeticObjects = matchedGift
    ? cosmetics.filter((c) => matchedGift.cosmeticIds.includes(c.id))
    : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-[oklch(0.2_0.03_160)] via-[oklch(0.16_0.028_161)] to-[oklch(0.13_0.025_162)] overflow-y-auto p-6 md:p-10">
      <div className="max-w-2xl w-full mx-auto my-auto">
        <button
          onClick={onBackToApp}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[oklch(0.17_0.028_161)] hover:bg-white/10 text-xs font-semibold text-white border border-white/10 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Doomcord Workspace</span>
        </button>

        {/* Card Container */}
        <div className="p-8 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-white shadow-xl">
                {matchedInvite ? <Crown className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-[oklch(0.85_0.12_165)] block">
                  DOOMCORD APEX · RISE ABOVE. STAND APART.
                </span>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {matchedInvite
                    ? 'Secondary Owner Official Invitation'
                    : 'DOOMCORD APEX Gift Vault'}
                </h1>
              </div>
            </div>
          </div>

          {/* Token Input Bar */}
          <div className="mb-6">
            <label className="text-[11px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider block mb-1.5">
              Enter or Paste Gift URL / Secure Token
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                setClaimedSuccess(false);
              }}
              placeholder="https://doomcord.com/gift/APEX-... or OWN-..."
              className="w-full bg-[oklch(0.235_0.032_158)] text-xs font-mono text-white px-4 py-3 rounded-2xl border border-white/10 focus:border-[oklch(0.85_0.12_165)] outline-none"
            />
          </div>

          {/* CASE A: Matched Secondary Owner Invitation (#35.2) */}
          {matchedInvite && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-[oklch(0.85_0.12_165)]/30">
                <div className="text-xs font-mono text-[oklch(0.85_0.12_165)] uppercase mb-1">
                  Issued by Main Root Owner ({matchedInvite.createdByEmail})
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Invited Email: {matchedInvite.email}
                </h3>
                <p className="text-xs text-[oklch(0.7_0.03_155)]">
                  Status: <strong className="text-white uppercase">{matchedInvite.status}</strong> ·
                  Role Granted: <strong className="text-[oklch(0.85_0.12_165)]">secondary_owner</strong>
                </p>
              </div>

              {matchedInvite.status === 'accepted' || claimedSuccess ? (
                <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">
                    Secondary Owner Account Activated!
                  </h4>
                  <p className="text-xs text-[oklch(0.7_0.03_155)] mt-1">
                    Your Secondary Owner privileges and APEX+ entitlements are now active.
                  </p>
                </div>
              ) : matchedInvite.status !== 'pending' ? (
                <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
                  This invitation is {matchedInvite.status} and can no longer be used.
                </div>
              ) : (
                <form onSubmit={handleAcceptInviteSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={inviteDisplayName}
                      onChange={(e) => setInviteDisplayName(e.target.value)}
                      placeholder="Your Display Name"
                      className="w-full bg-[oklch(0.235_0.032_158)] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">
                      Unique Username
                    </label>
                    <input
                      type="text"
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      placeholder="secondary_owner_handle"
                      className="w-full bg-[oklch(0.235_0.032_158)] text-xs font-mono text-white px-3.5 py-2.5 rounded-xl border border-white/10 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">
                      Set Your Secure Password (min 6 chars)
                    </label>
                    <input
                      type="password"
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[oklch(0.235_0.032_158)] text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/10 outline-none"
                      required
                    />
                  </div>
                  {lookupError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
                      {lookupError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={claiming}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-xs font-bold text-white shadow-xl"
                  >
                    {claiming
                      ? 'Activating Secondary Owner Account...'
                      : 'Set Password & Activate Secondary Owner Account'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* CASE B: Matched DOOMCORD APEX Gift (#29) */}
          {matchedGift && (
            <div className="space-y-6">
              {/* Animated Gift Vault Showcase */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[oklch(0.14_0.025_162)] via-[oklch(0.2_0.035_160)] to-[oklch(0.14_0.025_162)] border border-[oklch(0.85_0.12_165)]/30 text-center relative">
                <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] flex items-center justify-center text-white shadow-[0_0_35px_rgba(16,185,129,0.5)] animate-pulse">
                  <Gift className="w-10 h-10" />
                </div>

                <div className="text-xs font-mono text-[oklch(0.85_0.12_165)] uppercase tracking-wider mb-1">
                  {matchedGift.isPaidGift
                    ? `DOOMCORD APEX Gift Purchased By ${matchedGift.creatorName}`
                    : `Complimentary Official Gift From ${matchedGift.creatorName}`}
                </div>

                <h2 className="text-xl font-black text-white mb-2">
                  {matchedGift.apexTier !== 'none'
                    ? `DOOMCORD ${formatApexTierName(matchedGift.apexTier)} Membership`
                    : 'DOOMCORD APEX Exclusive Cosmetics'}
                  {matchedGift.apexTier !== 'none' && giftedCosmeticObjects.length > 0
                    ? ` + ${giftedCosmeticObjects.length} Cosmetics`
                    : ''}
                </h2>

                <div className="text-xs font-mono text-white/90 mb-3">
                  Duration:{' '}
                  <strong className="text-[oklch(0.85_0.12_165)]">
                    {formatDurationLabel(matchedGift.duration)}
                  </strong>
                  {matchedGift.duration === 'lifetime' && ' (NEVER EXPIRES)'}
                </div>

                {matchedGift.personalMessage && (
                  <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-black/30 border border-white/10 text-xs italic text-[oklch(0.95_0.015_150)]">
                    "{matchedGift.personalMessage}"
                  </div>
                )}

                {/* Gifted Cosmetics List */}
                {giftedCosmeticObjects.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-left">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[oklch(0.7_0.03_155)] block mb-2">
                      Included APEX Collection Items ({giftedCosmeticObjects.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {giftedCosmeticObjects.map((c) => (
                        <div
                          key={c.id}
                          className="p-2.5 rounded-xl bg-[oklch(0.17_0.028_161)] border border-white/10 flex items-center gap-2.5"
                        >
                          <div
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: c.previewColorPrimary }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{c.name}</div>
                            <div className="text-[10px] text-[oklch(0.7_0.03_155)]">
                              {c.category} · {c.rarity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipient Restriction Notice */}
                {(matchedGift.restrictedRecipientEmail || matchedGift.restrictedRecipientUsername) && (
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-mono text-[oklch(0.84_0.14_85)]">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>
                      Restricted to recipient:{' '}
                      {matchedGift.restrictedRecipientUsername
                        ? `@${matchedGift.restrictedRecipientUsername}`
                        : matchedGift.restrictedRecipientEmail}
                    </span>
                  </div>
                )}
              </div>

              {lookupError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              {/* Claim Status & Action Button */}
              {claimedSuccess || matchedGift.status === 'redeemed' ? (
                <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-base font-bold text-white">
                    {claimedSuccess
                      ? 'Gift Unlocked & Activated on Your Account!'
                      : 'This Single-Use Gift Link Has Already Been Redeemed'}
                  </h3>
                  <p className="text-xs text-[oklch(0.7_0.03_155)]">
                    {matchedGift.redeemedByEmail
                      ? `Claimed by ${matchedGift.redeemedByEmail} on ${new Date(
                          matchedGift.redeemedAt || Date.now()
                        ).toLocaleString()}`
                      : 'Your new DOOMCORD APEX entitlements and cosmetics are active now.'}
                  </p>
                </div>
              ) : matchedGift.status === 'revoked' ? (
                <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-center text-xs text-rose-300 font-semibold">
                  This unclaimed gift link was revoked and can no longer be claimed.
                </div>
              ) : (
                <button
                  onClick={handleClaimGift}
                  disabled={claiming}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] text-sm font-black text-white shadow-xl hover:opacity-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {claiming
                      ? 'Opening Gift & Activating Membership...'
                      : 'Claim Gift & Activate APEX Membership'}
                  </span>
                </button>
              )}
            </div>
          )}

          {!matchedGift && !matchedInvite && tokenInput.trim() !== '' && (
            <div className="p-6 rounded-2xl bg-[oklch(0.14_0.025_162)] border border-white/5 text-center">
              <Lock className="w-6 h-6 text-[oklch(0.7_0.03_155)] mx-auto mb-2" />
              <div className="text-xs font-bold text-white">
                No Matching Unclaimed Gift or Invitation Found
              </div>
              <p className="text-[11px] text-[oklch(0.7_0.03_155)] mt-1">
                Verify that you pasted the full `APEX-...` gift token or `OWN-...` invitation token.
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[oklch(0.7_0.03_155)]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
              <span>Single-use SHA-256 hashed token · Atomic transaction verification</span>
            </span>
            <span className="font-mono">₹0 Complimentary</span>
          </div>
        </div>
      </div>
    </div>
  );
};
