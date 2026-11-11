import React, { useState } from 'react';
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
} from 'lucide-react';
import { UserProfile } from '../../types';
import { isRootOwner, formatRoleLabel } from '../../lib/dataService';

interface SettingsModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'communities', label: 'Communities', icon: Hash },
    { id: 'orbs', label: 'Orbs', icon: Compass },
    { id: 'apex', label: 'DOOMCORD APEX', icon: Crown },
    { id: 'connected_accounts', label: 'Connected Accounts', icon: Link2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[620px] flex rounded-2xl bg-[#09090D] border border-[#282631] shadow-2xl overflow-hidden text-[#F5F3FA]">
        {/* Left Settings Sidebar */}
        <aside className="w-56 p-3.5 bg-[#0D0D12] border-r border-[#282631] flex flex-col justify-between shrink-0">
          <div className="overflow-y-auto pr-1 space-y-3.5">
            <div className="px-2 pt-1 flex items-center gap-2">
              <img
                src="/assets/aistudio/doomcord-icon_378efdf9.png"
                alt="Doomcord"
                className="w-5 h-5 object-contain"
              />
              <span className="text-xs font-semibold text-[#F5F3FA]">
                Settings
              </span>
            </div>

            <nav className="space-y-0.5">
              {NAV_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#17171F] text-[#8957F5] font-semibold'
                        : 'text-[#A19DAD] hover:bg-[#17171F] hover:text-[#F5F3FA]'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
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

          <div className="pt-2 border-t border-[#282631]">
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
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto bg-[#09090D]">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#282631]">
              <div>
                <h2 className="text-sm font-semibold text-[#F5F3FA]">
                  {NAV_SECTIONS.find((s) => s.id === activeSection)?.label}
                </h2>
                <p className="text-[11px] text-[#706C7B]">
                  Manage your Doomcord account and workspace preferences
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-md text-[#706C7B] hover:text-[#F5F3FA] hover:bg-[#17171F] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeSection === 'my_account' && (
              <div className="space-y-4 max-w-xl">
                <div className="p-4 rounded-xl bg-[#101014] border border-[#282631] flex items-center justify-between gap-3">
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#F5F3FA]">
                          {currentUser.displayName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#17171F] border border-[#282631] text-[9px] font-mono text-[#8957F5]">
                          {formatRoleLabel(currentUser.role, currentUser.uid)}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[#A19DAD] mt-0.5">
                        @{currentUser.username} · {currentUser.email}
                      </p>
                      <p className="text-[10px] font-mono text-[#706C7B] mt-0.5">
                        UUID: {currentUser.uid}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('profile')}
                    className="h-7 px-3 rounded-md bg-[#8957F5] hover:bg-[#7a4be6] text-white text-xs font-medium shadow-sm transition-colors shrink-0"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
              <div className="space-y-3 max-w-xl">
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
                    title: 'Message Read Receipts',
                    desc: 'Display read indicators for direct messages.',
                  },
                  {
                    title: 'Allow Direct Messages from Community Members',
                    desc: 'Allow users in shared spaces to contact you directly.',
                  },
                  {
                    title: 'Presence Indicator',
                    desc: 'Share online status with friends.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#101014] border border-[#282631] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-[#F5F3FA]">{item.title}</div>
                      <p className="text-[11px] text-[#706C7B] mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="accent-[#8957F5] w-4 h-4 cursor-pointer"
                    />
                  </div>
                ))}
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
              activeSection === 'orbs' ||
              activeSection === 'connected_accounts') && (
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

          <div className="flex justify-end pt-3 border-t border-[#282631]">
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
  );
};
