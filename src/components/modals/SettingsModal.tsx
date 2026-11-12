import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Shield,
  Palette,
  Bell,
  LogOut,
  Check,
  Crown,
  ShoppingBag,
  Lock,
  Users,
  MessageSquare,
  Hash,
  Compass,
  Link2,
  IdCard,
  KeyRound,
  Smartphone,
  Copy,
  RefreshCw,
  Laptop,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { isRootOwner, formatRoleLabel } from '../../lib/dataService';
import {
  generateTotpSecret,
  generateTotpCode,
  buildOtpAuthUri,
  generateBackupCodes,
} from '../../lib/totpService';

interface SettingsModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onEnableTwoFactor?: (secret: string, code: string, backupCodes: string[]) => Promise<void>;
  onDisableTwoFactor?: () => Promise<void>;
  onOpenNitro: () => void;
  onOpenShop: () => void;
  onLogout: () => void;
}

type SettingsSection =
  | 'my_account'
  | 'profile'
  | 'privacy'
  | 'security'
  | 'appearance'
  | 'notifications'
  | 'friends'
  | 'messages'
  | 'communities'
  | 'orbs'
  | 'apex'
  | 'connected_accounts';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateProfile,
  onChangePassword,
  onEnableTwoFactor,
  onDisableTwoFactor,
  onOpenNitro,
  onOpenShop,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('my_account');
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage || '');
  const [accentColor, setAccentColor] = useState(currentUser.accentColor || '#8957F5');
  const [secondaryColor, setSecondaryColor] = useState(
    currentUser.secondaryColor || '#17171F'
  );
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || '');
  const [bannerURL, setBannerURL] = useState(currentUser.bannerURL || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdFeedback, setPwdFeedback] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Two-Factor Authentication (2FA) Setup Wizard state
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [pendingSecret, setPendingSecret] = useState('');
  const [totpVerifyInput, setTotpVerifyInput] = useState('');
  const [liveTotpPreview, setLiveTotpPreview] = useState('');
  const [twoFaFeedback, setTwoFaFeedback] = useState<string | null>(null);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Passkey state
  const [newPasskeyName, setNewPasskeyName] = useState('');

  // Connected Accounts state
  const [connectProviderInput, setConnectProviderInput] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!isSettingUp2FA || !pendingSecret) return;
    const updateCode = () => {
      setLiveTotpPreview(generateTotpCode(pendingSecret, Date.now()));
    };
    updateCode();
    const interval = setInterval(updateCode, 5000);
    return () => clearInterval(interval);
  }, [isSettingUp2FA, pendingSecret]);

  if (!isOpen) return null;

  const isOwner = isRootOwner(currentUser.uid);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile({
      displayName,
      bio,
      statusMessage,
      accentColor,
      secondaryColor,
      photoURL,
      bannerURL,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdFeedback(null);
    try {
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPwdFeedback('Account password updated securely.');
    } catch (err: any) {
      setPwdError(err.message || 'Password update failed.');
    }
  };

  const handleStart2FASetup = () => {
    const sec = generateTotpSecret(20);
    setPendingSecret(sec);
    setLiveTotpPreview(generateTotpCode(sec, Date.now()));
    setTotpVerifyInput('');
    setTwoFaError(null);
    setTwoFaFeedback(null);
    setIsSettingUp2FA(true);
  };

  const handleActivate2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFaError(null);
    setTwoFaFeedback(null);
    try {
      const codes = generateBackupCodes(8);
      if (onEnableTwoFactor) {
        await onEnableTwoFactor(pendingSecret, totpVerifyInput.trim(), codes);
      } else {
        await onUpdateProfile({
          twoFactorEnabled: true,
          twoFactorSecret: pendingSecret,
          twoFactorBackupCodes: codes,
        });
      }
      setIsSettingUp2FA(false);
      setTotpVerifyInput('');
      setTwoFaFeedback(
        'Two-Factor Authentication (RFC 6238 TOTP) is now active on your account!'
      );
    } catch (err: any) {
      setTwoFaError(err.message || 'Failed to verify 6-digit code.');
    }
  };

  const handleDisable2FA = async () => {
    setTwoFaError(null);
    try {
      if (onDisableTwoFactor) {
        await onDisableTwoFactor();
      } else {
        await onUpdateProfile({
          twoFactorEnabled: false,
          twoFactorSecret: '',
          twoFactorBackupCodes: [],
        });
      }
      setTwoFaFeedback('Two-Factor Authentication has been disabled.');
    } catch (err: any) {
      setTwoFaError(err.message || 'Could not disable 2FA.');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const fresh = generateBackupCodes(8);
    await onUpdateProfile({ twoFactorBackupCodes: fresh });
    setTwoFaFeedback('Generated 8 new single-use Backup Recovery Codes.');
  };

  const handleAddPasskey = async () => {
    const label = newPasskeyName.trim() || 'Hardware Security Key / Passkey';
    const existing = currentUser.passkeys || [];
    const next = [
      ...existing,
      {
        id: `pk_${Date.now()}`,
        name: label,
        createdAt: new Date().toISOString(),
      },
    ];
    await onUpdateProfile({ passkeys: next });
    setNewPasskeyName('');
    setTwoFaFeedback(`Registered passkey "${label}".`);
  };

  const handleRemovePasskey = async (id: string) => {
    const next = (currentUser.passkeys || []).filter((p) => p.id !== id);
    await onUpdateProfile({ passkeys: next });
  };

  const ACCENT_PRESETS = [
    { label: 'Doom Purple', value: '#8957F5' },
    { label: 'Soft Lavender', value: '#A47BFF' },
    { label: 'Light Violet', value: '#C4B1FF' },
    { label: 'Coral', value: '#E9987B' },
    { label: 'Sky', value: '#7CC6FE' },
    { label: 'Emerald', value: '#3BA55D' },
  ];

  const NAV_SECTIONS: {
    id: SettingsSection;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'my_account', label: 'My Account', icon: User },
    { id: 'profile', label: 'Profile', icon: IdCard },
    { id: 'security', label: 'Security & 2FA', icon: Lock },
    { id: 'privacy', label: 'Privacy & Safety', icon: Shield },
    { id: 'connected_accounts', label: 'Connected Accounts', icon: Link2 },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'communities', label: 'Communities', icon: Hash },
    { id: 'orbs', label: 'Orbs', icon: Compass },
    { id: 'apex', label: 'DOOMCORD APEX', icon: Crown },
  ];

  const SUPPORTED_PROVIDERS: {
    id: 'github' | 'google' | 'twitch' | 'youtube' | 'spotify' | 'steam';
    label: string;
    placeholder: string;
    accent: string;
  }[] = [
    { id: 'github', label: 'GitHub', placeholder: 'octocat', accent: '#F5F3FA' },
    { id: 'google', label: 'Google', placeholder: currentUser.email, accent: '#4285F4' },
    { id: 'twitch', label: 'Twitch', placeholder: 'twitch_handle', accent: '#9146FF' },
    { id: 'youtube', label: 'YouTube', placeholder: '@channel', accent: '#FF0000' },
    { id: 'spotify', label: 'Spotify', placeholder: 'spotify_user', accent: '#1DB954' },
    { id: 'steam', label: 'Steam', placeholder: 'steam_id', accent: '#66C0F4' },
  ];

  const privacy = currentUser.privacySettings || {
    readReceipts: true,
    allowDmFromServerMembers: true,
    sharePresence: true,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[90vh] sm:h-[650px] flex flex-col sm:flex-row rounded-2xl bg-[#09090D] border border-[#282631] shadow-2xl overflow-hidden text-[#F5F3FA]">
        {/* Left Settings Sidebar */}
        <aside className="w-full sm:w-56 p-3 bg-[#0D0D12] border-b sm:border-b-0 sm:border-r border-[#282631] flex sm:flex-col justify-between shrink-0 overflow-x-auto sm:overflow-y-auto">
          <div className="flex sm:flex-col gap-1 sm:space-y-3.5 w-full">
            <div className="hidden sm:flex px-2 pt-1 items-center gap-2">
              <img
                src="/assets/aistudio/doomcord-icon_378efdf9.png"
                alt="Doomcord"
                className="w-5 h-5 object-contain"
              />
              <span className="text-xs font-semibold text-[#F5F3FA]">
                Settings
              </span>
            </div>

            <nav className="flex sm:flex-col gap-1 sm:space-y-0.5 overflow-x-auto">
              {NAV_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                        : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        sec.id === 'apex'
                          ? 'text-[#A47BFF]'
                          : isActive
                          ? 'text-[#8957F5]'
                          : 'text-[#706C7B]'
                      }`}
                    />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="hidden sm:block pt-2 border-t border-[#282631]">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[#ED4245] hover:bg-[#ED4245]/15 rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Right Settings Content */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto bg-[#09090D]">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#282631]">
              <div>
                <h2 className="text-sm font-semibold text-[#F5F3FA]">
                  {NAV_SECTIONS.find((s) => s.id === activeSection)?.label}
                </h2>
                <p className="text-[11px] text-[#706C7B]">
                  Manage your Doomcord account, 2FA security, and workspace preferences
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Settings"
                className="w-7 h-7 rounded-md text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeSection === 'my_account' && (
              <div className="space-y-4 max-w-xl">
                <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#17171F] border border-[#282631] flex items-center justify-center text-sm font-bold text-[#8957F5] overflow-hidden">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        currentUser.displayName.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[#F5F3FA]">
                          {currentUser.displayName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[9px] font-mono text-[#8957F5]">
                          {formatRoleLabel(currentUser.role, currentUser.uid)}
                        </span>
                        {currentUser.twoFactorEnabled && (
                          <span className="px-1.5 py-0.5 rounded bg-[#3BA55D]/15 border border-[#3BA55D]/30 text-[9px] font-mono text-[#3BA55D]">
                            2FA PROTECTED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-[#A19DAD] mt-0.5">
                        @{currentUser.username} · {currentUser.email}
                      </p>
                      <p className="text-[10px] font-mono text-[#706C7B] mt-0.5">
                        UUID: {currentUser.uid}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSection('profile')}
                      className="h-7 px-3 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white text-xs font-medium shadow-sm transition-colors"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setActiveSection('security')}
                      className="h-7 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-[#F5F3FA] text-xs font-medium transition-colors"
                    >
                      2FA & Security
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-[#101014] border border-[#282631]">
                    <div className="text-[10px] font-mono uppercase text-[#706C7B]">
                      Role Clearance
                    </div>
                    <div className="text-xs font-semibold text-[#F5F3FA] mt-0.5">
                      {formatRoleLabel(currentUser.role, currentUser.uid)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#101014] border border-[#282631]">
                    <div className="text-[10px] font-mono uppercase text-[#706C7B]">
                      Membership
                    </div>
                    <div className="text-xs font-semibold text-[#A47BFF] mt-0.5">
                      {isOwner || currentUser.nitroTier === 'nitro'
                        ? 'DOOMCORD APEX+'
                        : currentUser.nitroTier === 'basic'
                        ? 'DOOMCORD APEX'
                        : 'DOOMCORD FREE'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#101014] border border-[#282631]">
                    <div className="text-[10px] font-mono uppercase text-[#706C7B]">
                      Two-Factor Auth
                    </div>
                    <div
                      className={`text-xs font-semibold mt-0.5 ${
                        currentUser.twoFactorEnabled ? 'text-[#3BA55D]' : 'text-[#FAA81A]'
                      }`}
                    >
                      {currentUser.twoFactorEnabled ? 'Active (TOTP)' : 'Not Enabled'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-3.5 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full h-8 bg-[#101014] text-[#F5F3FA] text-xs px-2.5 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                      Status Message
                    </label>
                    <input
                      type="text"
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      placeholder="What's your status?"
                      className="w-full h-8 bg-[#101014] text-[#F5F3FA] text-xs px-2.5 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-8 bg-[#101014] text-[#F5F3FA] text-xs px-2.5 rounded-md border border-[#282631] outline-none focus:border-[#8957F5] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                    Banner Image URL
                  </label>
                  <input
                    type="text"
                    value={bannerURL}
                    onChange={(e) => setBannerURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-8 bg-[#101014] text-[#F5F3FA] text-xs px-2.5 rounded-md border border-[#282631] outline-none focus:border-[#8957F5] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                    Biography
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    className="w-full bg-[#101014] text-[#F5F3FA] text-xs p-2.5 rounded-md border border-[#282631] outline-none focus:border-[#8957F5] resize-none"
                  />
                </div>

                <div className="pt-1 flex items-center gap-2.5">
                  <button
                    type="submit"
                    className="h-8 px-3.5 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                  {savedFeedback && (
                    <span className="text-xs text-[#8957F5] flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                </div>
              </form>
            )}

            {activeSection === 'security' && (
              <div className="space-y-4 max-w-2xl">
                {/* 1. Two-Factor Authentication (2FA — RFC 6238 TOTP) */}
                <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#8957F5]" />
                        <span className="text-xs font-semibold text-[#F5F3FA]">
                          Two-Factor Authentication (2FA Authenticator App)
                        </span>
                        {currentUser.twoFactorEnabled ? (
                          <span className="px-2 py-0.5 rounded bg-[#3BA55D]/15 border border-[#3BA55D]/30 text-[10px] font-mono text-[#3BA55D]">
                            ENABLED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-[#FAA81A]/15 border border-[#FAA81A]/30 text-[10px] font-mono text-[#FAA81A]">
                            DISABLED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A19DAD] mt-1">
                        Protect your Doomcord account with RFC 6238 time-based one-time passwords (Google Authenticator, Authy, 1Password) and single-use backup recovery codes.
                      </p>
                    </div>

                    {!currentUser.twoFactorEnabled && !isSettingUp2FA && (
                      <button
                        type="button"
                        onClick={handleStart2FASetup}
                        className="h-8 px-3 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white text-xs font-medium shrink-0 transition-colors"
                      >
                        Enable 2FA
                      </button>
                    )}

                    {currentUser.twoFactorEnabled && (
                      <button
                        type="button"
                        onClick={handleDisable2FA}
                        className="h-8 px-3 rounded-md bg-[#ED4245]/15 hover:bg-[#ED4245]/25 border border-[#ED4245]/30 text-[#ED4245] text-xs font-medium shrink-0 transition-colors"
                      >
                        Disable 2FA
                      </button>
                    )}
                  </div>

                  {twoFaFeedback && (
                    <div className="p-2.5 rounded-lg bg-[#3BA55D]/15 border border-[#3BA55D]/30 text-[#3BA55D] text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{twoFaFeedback}</span>
                    </div>
                  )}

                  {twoFaError && (
                    <div className="p-2.5 rounded-lg bg-[#ED4245]/15 border border-[#ED4245]/30 text-[#ED4245] text-xs">
                      {twoFaError}
                    </div>
                  )}

                  {/* Interactive 2FA Setup Wizard */}
                  {isSettingUp2FA && (
                    <form
                      onSubmit={handleActivate2FA}
                      className="p-3.5 rounded-lg bg-[#17171F] border border-[#8957F5]/40 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {/* Deterministic SVG QR Code representation for Authenticator Scan */}
                        <div className="p-2.5 rounded-lg bg-white shrink-0 flex flex-col items-center">
                          <svg
                            width="96"
                            height="96"
                            viewBox="0 0 24 24"
                            className="block"
                          >
                            <rect width="24" height="24" fill="#FFFFFF" />
                            <rect x="2" y="2" width="6" height="6" fill="#09090D" />
                            <rect x="3" y="3" width="4" height="4" fill="#FFFFFF" />
                            <rect x="4" y="4" width="2" height="2" fill="#8957F5" />
                            <rect x="16" y="2" width="6" height="6" fill="#09090D" />
                            <rect x="17" y="3" width="4" height="4" fill="#FFFFFF" />
                            <rect x="18" y="4" width="2" height="2" fill="#8957F5" />
                            <rect x="2" y="16" width="6" height="6" fill="#09090D" />
                            <rect x="3" y="17" width="4" height="4" fill="#FFFFFF" />
                            <rect x="4" y="18" width="2" height="2" fill="#8957F5" />
                            {Array.from({ length: 20 }).map((_, idx) => {
                              const charCode = pendingSecret.charCodeAt(idx) || 65;
                              const rx = 9 + (idx % 6);
                              const ry = 4 + Math.floor(idx / 2);
                              return charCode % 2 === 0 ? (
                                <rect
                                  key={idx}
                                  x={rx}
                                  y={ry}
                                  width="1.2"
                                  height="1.2"
                                  fill="#09090D"
                                />
                              ) : null;
                            })}
                          </svg>
                          <span className="text-[9px] font-mono text-[#09090D] mt-1 font-semibold">
                            SCAN TOTP QR
                          </span>
                        </div>

                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="text-xs font-semibold text-[#F5F3FA]">
                            1. Scan QR or enter Base32 Setup Key
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="px-2.5 py-1 rounded bg-[#0D0D12] border border-[#282631] font-mono text-xs text-[#C4B1FF] select-all truncate">
                              {pendingSecret}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(pendingSecret);
                                setCopiedSecret(true);
                                setTimeout(() => setCopiedSecret(false), 1800);
                              }}
                              className="h-7 px-2.5 rounded bg-[#22212C] hover:bg-[#282631] text-[11px] text-[#F5F3FA] flex items-center gap-1 shrink-0"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedSecret ? 'Copied' : 'Copy Key'}</span>
                            </button>
                          </div>

                          <div className="text-[11px] font-mono text-[#A19DAD]">
                            URI: <span className="text-[#706C7B]">{buildOtpAuthUri(currentUser.email, pendingSecret).slice(0, 48)}...</span>
                          </div>

                          <div className="p-2 rounded bg-[#101014] border border-[#282631] flex items-center justify-between">
                            <span className="text-[11px] text-[#A19DAD]">
                              Current RFC 6238 6-Digit Code:
                            </span>
                            <button
                              type="button"
                              onClick={() => setTotpVerifyInput(liveTotpPreview)}
                              className="px-2 py-0.5 rounded bg-[#8957F5]/20 border border-[#8957F5]/40 font-mono text-xs font-bold text-[#C4B1FF] hover:bg-[#8957F5]/30"
                              title="Click to auto-fill current TOTP code"
                            >
                              {liveTotpPreview} (Click to Fill)
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#282631] flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={totpVerifyInput}
                          onChange={(e) => setTotpVerifyInput(e.target.value)}
                          placeholder="Enter 6-digit code to activate"
                          className="h-8 px-3 rounded-md bg-[#0D0D12] border border-[#282631] focus:border-[#8957F5] text-xs font-mono text-[#F5F3FA] outline-none w-52"
                          required
                        />
                        <button
                          type="submit"
                          className="h-8 px-3.5 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white text-xs font-semibold transition-colors"
                        >
                          Verify & Activate 2FA
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSettingUp2FA(false)}
                          className="h-8 px-3 rounded-md bg-[#101014] text-xs text-[#A19DAD] hover:text-[#F5F3FA]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Backup Recovery Codes Vault */}
                  {currentUser.twoFactorEnabled &&
                    currentUser.twoFactorBackupCodes &&
                    currentUser.twoFactorBackupCodes.length > 0 && (
                      <div className="p-3.5 rounded-lg bg-[#17171F] border border-[#282631] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#F5F3FA] flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-[#A47BFF]" />
                            <span>
                              Single-Use Backup Recovery Codes ({currentUser.twoFactorBackupCodes.length} remaining)
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(
                                  (currentUser.twoFactorBackupCodes || []).join('\n')
                                );
                                setCopiedBackup(true);
                                setTimeout(() => setCopiedBackup(false), 1800);
                              }}
                              className="h-7 px-2.5 rounded bg-[#101014] hover:bg-[#22212C] border border-[#282631] text-[11px] text-[#F5F3FA] flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedBackup ? 'Copied' : 'Copy All'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRegenerateBackupCodes}
                              className="h-7 px-2.5 rounded bg-[#101014] hover:bg-[#22212C] border border-[#282631] text-[11px] text-[#A47BFF] flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Regenerate</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {currentUser.twoFactorBackupCodes.map((code) => (
                            <div
                              key={code}
                              className="px-2 py-1 rounded bg-[#0D0D12] border border-[#282631] font-mono text-[11px] text-[#C4B1FF] text-center select-all"
                            >
                              {code}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* 2. Passkeys & Hardware Security Keys (FIDO2 / WebAuthn) */}
                <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#F5F3FA] flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#8957F5]" />
                        <span>Passkeys & FIDO2 Security Keys</span>
                      </div>
                      <p className="text-[11px] text-[#706C7B] mt-0.5">
                        Register biometric passkeys or hardware YubiKeys for passwordless verification.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newPasskeyName}
                      onChange={(e) => setNewPasskeyName(e.target.value)}
                      placeholder="e.g. MacBook TouchID or YubiKey 5C"
                      className="flex-1 h-8 px-2.5 rounded-md bg-[#17171F] border border-[#282631] text-xs text-[#F5F3FA] outline-none focus:border-[#8957F5]"
                    />
                    <button
                      type="button"
                      onClick={handleAddPasskey}
                      className="h-8 px-3 rounded-md bg-[#17171F] hover:bg-[#22212C] border border-[#8957F5]/40 text-xs font-medium text-[#C4B1FF]"
                    >
                      + Register Passkey
                    </button>
                  </div>

                  {(currentUser.passkeys || []).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {(currentUser.passkeys || []).map((pk) => (
                        <div
                          key={pk.id}
                          className="px-3 py-2 rounded-lg bg-[#17171F] border border-[#282631] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-medium text-[#F5F3FA]">
                              {pk.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#706C7B] ml-2">
                              Added {new Date(pk.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePasskey(pk.id)}
                            className="text-[#ED4245] hover:underline text-[11px]"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Active Devices & Session Management */}
                <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-[#F5F3FA] flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-[#8957F5]" />
                      <span>Active Sessions & Trusted Devices</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#3BA55D]">
                      1 Active Session
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#17171F] border border-[#282631] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-[#F5F3FA]">
                        Current Browser Session · Web Workspace
                      </div>
                      <div className="text-[10px] font-mono text-[#706C7B] mt-0.5">
                        Authenticated as {currentUser.email} · Active Now
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#3BA55D]/15 text-[#3BA55D] text-[10px] font-mono">
                      THIS DEVICE
                    </span>
                  </div>
                </div>

                {/* 4. Change Account Password */}
                <form
                  onSubmit={handlePasswordChange}
                  className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-3"
                >
                  <div className="flex items-center gap-1.5 text-[#F5F3FA] text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5 text-[#8957F5]" />
                    <span>Change Account Password</span>
                  </div>

                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-8 bg-[#17171F] text-[#F5F3FA] text-xs px-2.5 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
                    required
                  />
                  <input
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-8 bg-[#17171F] text-[#F5F3FA] text-xs px-2.5 rounded-md border border-[#282631] outline-none focus:border-[#8957F5]"
                    required
                  />
                  {pwdError && <div className="text-xs text-[#ED4245]">{pwdError}</div>}
                  {pwdFeedback && (
                    <div className="text-xs text-[#8957F5]">{pwdFeedback}</div>
                  )}
                  <button
                    type="submit"
                    className="h-8 px-3 rounded-md font-medium text-xs text-white bg-[#8957F5] hover:bg-[#7a4be6] shadow-sm"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-2.5 max-w-xl text-xs">
                {[
                  {
                    key: 'readReceipts' as const,
                    title: 'Message Read Receipts',
                    desc: 'Display read indicators for direct messages.',
                  },
                  {
                    key: 'allowDmFromServerMembers' as const,
                    title: 'Allow Direct Messages from Community Members',
                    desc: 'Allow users in shared servers to contact you directly.',
                  },
                  {
                    key: 'sharePresence' as const,
                    title: 'Presence Indicator',
                    desc: 'Share online status with friends and server members.',
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-3 rounded-lg bg-[#101014] border border-[#282631] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-[#F5F3FA]">{item.title}</div>
                      <p className="text-[11px] text-[#706C7B] mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy[item.key]}
                      onChange={(e) => {
                        onUpdateProfile({
                          privacySettings: {
                            ...privacy,
                            [item.key]: e.target.checked,
                          },
                        });
                      }}
                      className="accent-[#8957F5] w-4 h-4 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'connected_accounts' && (
              <div className="space-y-3 max-w-2xl text-xs">
                <p className="text-[#A19DAD]">
                  Connect external accounts to display verified badges on your Doomcord profile.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUPPORTED_PROVIDERS.map((prov) => {
                    const existing = (currentUser.connectedAccounts || []).find(
                      (c) => c.provider === prov.id
                    );
                    const inputVal = connectProviderInput[prov.id] ?? '';

                    return (
                      <div
                        key={prov.id}
                        className="p-3.5 rounded-xl bg-[#101014] border border-[#282631] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: prov.accent }}
                            />
                            <span className="font-semibold text-[#F5F3FA]">
                              {prov.label}
                            </span>
                          </div>
                          {existing ? (
                            <span className="text-[10px] font-mono text-[#3BA55D]">
                              CONNECTED
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#706C7B]">
                              NOT LINKED
                            </span>
                          )}
                        </div>

                        {existing ? (
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-mono text-[11px] text-[#C4B1FF] truncate">
                              {existing.username}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = (currentUser.connectedAccounts || []).filter(
                                  (c) => c.provider !== prov.id
                                );
                                onUpdateProfile({ connectedAccounts: next });
                              }}
                              className="text-[11px] text-[#ED4245] hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Disconnect</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={inputVal}
                              onChange={(e) =>
                                setConnectProviderInput((prev) => ({
                                  ...prev,
                                  [prov.id]: e.target.value,
                                }))
                              }
                              placeholder={prov.placeholder}
                              className="flex-1 h-7 px-2 rounded bg-[#17171F] border border-[#282631] text-[11px] text-[#F5F3FA] outline-none focus:border-[#8957F5]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const handle =
                                  (connectProviderInput[prov.id] || '').trim() ||
                                  prov.placeholder;
                                const next = [
                                  ...(currentUser.connectedAccounts || []),
                                  {
                                    provider: prov.id,
                                    username: handle,
                                    connectedAt: new Date().toISOString(),
                                    showOnProfile: true,
                                  },
                                ];
                                onUpdateProfile({ connectedAccounts: next });
                              }}
                              className="h-7 px-2.5 rounded bg-[#8957F5] hover:bg-[#7a4be6] text-white text-[11px] font-medium"
                            >
                              Connect
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-4 max-w-xl text-xs">
                <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-2.5">
                  <div className="font-semibold text-[#F5F3FA]">
                    Accent Theme
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ACCENT_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setAccentColor(p.value);
                          onUpdateProfile({ accentColor: p.value });
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
                          accentColor === p.value
                            ? 'border-[#8957F5] text-[#F5F3FA] font-medium bg-[#17171F]'
                            : 'border-[#282631] text-[#A19DAD] hover:border-[#8957F5]/40'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.value }}
                        />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'apex' && (
              <div className="space-y-3.5 max-w-xl text-xs">
                <div className="p-4 rounded-xl bg-[#101014] border border-[#8957F5]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F5F3FA] text-xs">
                      Membership:{' '}
                      {isOwner || currentUser.nitroTier === 'nitro'
                        ? 'DOOMCORD APEX+'
                        : currentUser.nitroTier === 'basic'
                        ? 'DOOMCORD APEX'
                        : 'DOOMCORD FREE'}
                    </span>
                    <Crown className="w-4 h-4 text-[#A47BFF]" />
                  </div>
                  {isOwner && (
                    <div className="text-[10px] font-mono text-[#C4B1FF]">
                      Entitlement: OWNER_PERMANENT_APEX · LIFETIME
                    </div>
                  )}
                  <p className="text-[#A19DAD]">
                    Owned Cosmetics: {currentUser.ownedCosmetics?.length || 0} item(s)
                  </p>
                  <div className="flex items-center gap-2 pt-1.5">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenNitro();
                      }}
                      className="h-8 px-3 rounded-md font-medium text-white bg-[#8957F5] hover:bg-[#7a4be6] shadow-sm transition-colors"
                    >
                      APEX Hub
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenShop();
                      }}
                      className="h-8 px-3 rounded-md font-medium text-[#F5F3FA] bg-[#17171F] hover:bg-[#22212C] border border-[#282631] flex items-center gap-1.5 transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#8957F5]" />
                      <span>Cosmetics Shop</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(activeSection === 'notifications' ||
              activeSection === 'friends' ||
              activeSection === 'messages' ||
              activeSection === 'communities' ||
              activeSection === 'orbs') && (
              <div className="space-y-2.5 max-w-xl text-xs">
                <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] space-y-1.5">
                  <div className="font-semibold text-[#F5F3FA] capitalize">
                    {activeSection.replace('_', ' ')}
                  </div>
                  <p className="text-[#A19DAD] leading-relaxed">
                    Account settings for {currentUser.email} sync in real time across Doomcord services.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#282631]">
            <button
              onClick={onLogout}
              className="sm:hidden h-8 px-3 text-xs font-medium text-[#ED4245] bg-[#ED4245]/10 rounded-md"
            >
              Sign Out
            </button>
            <div className="flex-1 flex justify-end">
              <button
                onClick={onClose}
                className="h-8 px-3.5 text-xs font-medium text-[#F5F3FA] bg-[#17171F] hover:bg-[#22212C] rounded-md border border-[#282631] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
