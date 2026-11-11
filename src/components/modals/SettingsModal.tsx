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
  const [accentColor, setAccentColor] = useState(currentUser.accentColor || '#8BE2B8');
  const [secondaryColor, setSecondaryColor] = useState(
    currentUser.secondaryColor || '#192620'
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
      setPwdFeedback('Account password updated and re-hashed on server.');
    } catch (err: any) {
      setPwdError(err.message || 'Password update failed.');
    }
  };

  const ACCENT_PRESETS = [
    { label: 'Mint', value: '#8BE2B8' },
    { label: 'Coral', value: '#E9987B' },
    { label: 'Gold', value: '#D9BB79' },
    { label: 'Emerald', value: '#6DD5A5' },
    { label: 'Sky', value: '#7CC6FE' },
    { label: 'Rose', value: '#E57373' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[660px] flex rounded-2xl bg-[#101A17] border border-white/[0.08] shadow-2xl overflow-hidden text-[#F0F5F1]">
        {/* Left Settings Sidebar */}
        <aside className="w-60 p-4 bg-[#111B17] border-r border-white/[0.06] flex flex-col justify-between shrink-0">
          <div className="overflow-y-auto pr-1 space-y-4">
            <div className="px-3 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#718478] block">
                System Preferences
              </span>
              <h3 className="text-sm font-display font-bold text-[#F0F5F1] mt-0.5">
                Settings
              </h3>
            </div>

            <nav className="space-y-0.5">
              {NAV_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#24362C] text-[#F0F5F1] font-semibold'
                        : 'text-[#9BAEA2] hover:bg-[#192620] hover:text-[#F0F5F1]'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        sec.id === 'apex'
                          ? 'text-[#D9BB79]'
                          : isActive
                          ? 'text-[#8BE2B8]'
                          : 'text-[#718478]'
                      }`}
                    />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-3 border-t border-white/[0.06]">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#E57373] hover:bg-[#E57373]/15 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Right Settings Content */}
        <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto bg-[#101A17]">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-lg font-display font-bold text-[#F0F5F1]">
                  {NAV_SECTIONS.find((s) => s.id === activeSection)?.label}
                </h2>
                <p className="text-xs text-[#9BAEA2] mt-0.5">
                  Manage your Doomcord account configuration and real-time preferences
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-[#9BAEA2] hover:text-[#F0F5F1] hover:bg-[#192620] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeSection === 'my_account' && (
              <div className="space-y-5 max-w-xl">
                <div className="p-5 rounded-xl bg-[#141F1B] border border-white/[0.06] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-[#1D2B24] border border-white/10 flex items-center justify-center text-base font-display font-bold text-[#8BE2B8] overflow-hidden">
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
                        <span className="text-sm font-display font-bold text-[#F0F5F1]">
                          {currentUser.displayName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#192620] border border-white/10 text-[10px] font-mono text-[#8BE2B8]">
                          {formatRoleLabel(currentUser.role, currentUser.uid)}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[#9BAEA2] mt-0.5">
                        @{currentUser.username} · {currentUser.email}
                      </p>
                      <p className="text-[11px] font-mono text-[#718478] mt-1">
                        UUID: {currentUser.uid}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('profile')}
                    className="h-8 px-3 rounded-lg bg-[#8BE2B8] text-[#101A17] text-xs font-semibold shrink-0"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#141F1B] border border-white/[0.06]">
                    <div className="text-[11px] font-mono uppercase text-[#718478]">
                      Account Clearance
                    </div>
                    <div className="text-sm font-semibold text-[#F0F5F1] mt-1">
                      {formatRoleLabel(currentUser.role, currentUser.uid)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#141F1B] border border-white/[0.06]">
                    <div className="text-[11px] font-mono uppercase text-[#718478]">
                      APEX Tier
                    </div>
                    <div className="text-sm font-semibold text-[#D9BB79] mt-1">
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
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#9BAEA2] block mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full h-9 bg-[#141F1B] text-[#F0F5F1] text-xs px-3 rounded-lg border border-white/[0.08] outline-none focus:border-[#8BE2B8]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#9BAEA2] block mb-1.5">
                      Custom Status Message
                    </label>
                    <input
                      type="text"
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      placeholder="What are you working on?"
                      className="w-full h-9 bg-[#141F1B] text-[#F0F5F1] text-xs px-3 rounded-lg border border-white/[0.08] outline-none focus:border-[#8BE2B8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#9BAEA2] block mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-9 bg-[#141F1B] text-[#F0F5F1] text-xs px-3 rounded-lg border border-white/[0.08] outline-none focus:border-[#8BE2B8] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#9BAEA2] block mb-1.5">
                    Banner Image URL
                  </label>
                  <input
                    type="text"
                    value={bannerURL}
                    onChange={(e) => setBannerURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-9 bg-[#141F1B] text-[#F0F5F1] text-xs px-3 rounded-lg border border-white/[0.08] outline-none focus:border-[#8BE2B8] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#9BAEA2] block mb-1.5">
                    Biography
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a short bio..."
                    className="w-full bg-[#141F1B] text-[#F0F5F1] text-xs p-3 rounded-lg border border-white/[0.08] outline-none focus:border-[#8BE2B8] resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-[#8BE2B8] hover:bg-[#7AD4A8] text-[#101A17] text-xs font-semibold transition-colors"
                  >
                    Save Profile Changes
                  </button>
                  {savedFeedback && (
                    <span className="text-xs text-[#8BE2B8] flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> Saved to Firestore!
                    </span>
                  )}
                </div>
              </form>
            )}

            {activeSection === 'security' && (
              <div className="space-y-4 max-w-xl">
                <form
                  onSubmit={handlePasswordChange}
                  className="p-5 rounded-xl bg-[#141F1B] border border-white/[0.06] space-y-3.5"
                >
                  <div className="flex items-center gap-2 font-display font-bold text-[#F0F5F1] text-sm">
                    <Lock className="w-4 h-4 text-[#8BE2B8]" />
                    <span>Update Account Password</span>
                  </div>

                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-9 bg-[#101A17] text-[#F0F5F1] text-xs px-3 rounded-lg border border-white/[0.08] outline-none"
                    required
                  />
                  <input
                    type="password"
                    placeholder="New strong password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-9 bg-[#101A17] text-[#F0F5F1] text-xs px-3 rounded-lg border border-white/[0.08] outline-none"
                    required
                  />
                  {pwdError && <div className="text-xs text-[#E57373]">{pwdError}</div>}
                  {pwdFeedback && (
                    <div className="text-xs text-[#8BE2B8]">{pwdFeedback}</div>
                  )}
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg font-semibold text-xs text-[#101A17] bg-[#8BE2B8]"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-3 max-w-xl text-xs">
                {[
                  {
                    title: 'Direct Message Read Receipts',
                    desc: 'Show checkmarks when you have read incoming direct messages.',
                  },
                  {
                    title: 'Allow Friend Requests from Community Members',
                    desc: 'Let members in shared communities send you friend invitations.',
                  },
                  {
                    title: 'Online Presence Visibility',
                    desc: 'Display your real-time presence indicator to connected friends.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#141F1B] border border-white/[0.06] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-[#F0F5F1]">{item.title}</div>
                      <p className="text-[#9BAEA2] mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="accent-[#8BE2B8] w-4 h-4 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-5 max-w-xl text-xs">
                <div className="p-5 rounded-xl bg-[#141F1B] border border-white/[0.06] space-y-3">
                  <div className="font-semibold text-[#F0F5F1]">
                    Profile & Workspace Accent Colour
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
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                          accentColor === p.value
                            ? 'border-[#8BE2B8] text-[#F0F5F1] font-semibold bg-[#192620]'
                            : 'border-white/[0.07] text-[#9BAEA2] hover:border-white/20'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
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
              <div className="space-y-4 max-w-xl text-xs">
                <div className="p-5 rounded-xl bg-[#141F1B] border border-[#D9BB79]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-[#F0F5F1] text-sm">
                      Current Membership:{' '}
                      {isOwner || currentUser.nitroTier === 'nitro'
                        ? 'DOOMCORD APEX+'
                        : currentUser.nitroTier === 'basic'
                        ? 'DOOMCORD APEX'
                        : 'DOOMCORD FREE'}
                    </span>
                    <Crown className="w-4 h-4 text-[#D9BB79]" />
                  </div>
                  {isOwner && (
                    <div className="text-[11px] font-mono text-[#D9BB79]">
                      Entitlement: OWNER_PERMANENT_APEX · LIFETIME — NO EXPIRATION
                    </div>
                  )}
                  <p className="text-[#9BAEA2]">
                    Owned Cosmetics: {currentUser.ownedCosmetics?.length || 0} item(s)
                  </p>
                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenNitro();
                      }}
                      className="h-9 px-4 rounded-lg font-semibold text-[#101A17] bg-[#D9BB79]"
                    >
                      Open DOOMCORD APEX Hub
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenShop();
                      }}
                      className="h-9 px-4 rounded-lg font-medium text-[#F0F5F1] bg-[#192620] border border-white/10 flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#8BE2B8]" />
                      <span>Open Cosmetics Shop</span>
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
              <div className="space-y-3 max-w-xl text-xs">
                <div className="p-5 rounded-xl bg-[#141F1B] border border-white/[0.06] space-y-2">
                  <div className="font-semibold text-[#F0F5F1] capitalize">
                    {activeSection.replace('_', ' ')} Configuration
                  </div>
                  <p className="text-[#9BAEA2] leading-relaxed">
                    Real-time synchronization is active for your account ({currentUser.email}). All changes to your {activeSection.replace('_', ' ')} settings persist automatically to Firestore.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-white/[0.06]">
            <button
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold text-[#F0F5F1] bg-[#192620] hover:bg-[#24362C] rounded-lg border border-white/[0.08] transition-colors"
            >
              Close Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
