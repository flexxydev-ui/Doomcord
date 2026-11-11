import React, { useState } from 'react';
import { 
  X, User, Shield, Palette, Bell, Sparkles, 
  Trash2, LogOut, Check, Ban, Key 
} from 'lucide-react';
import { UserProfile, UserPresence } from '../../types';

interface SettingsModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
}

type SettingsTab = 'account' | 'privacy' | 'appearance' | 'notifications';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateProfile,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage || '');
  const [accentColor, setAccentColor] = useState(currentUser.accentColor || 'oklch(0.85 0.12 165)');
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      displayName,
      bio,
      statusMessage,
      accentColor,
      photoURL
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const ACCENT_PRESETS = [
    { label: 'Mint', value: 'oklch(0.85 0.12 165)' },
    { label: 'Coral', value: 'oklch(0.72 0.16 32)' },
    { label: 'Gold', value: 'oklch(0.84 0.14 85)' },
    { label: 'Sky', value: 'oklch(0.76 0.11 230)' },
    { label: 'Rose', value: 'oklch(0.72 0.15 355)' },
    { label: 'Moss', value: 'oklch(0.62 0.11 140)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl h-[600px] flex rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-2xl overflow-hidden">
        {/* Left Settings Sidebar */}
        <div className="w-56 p-4 bg-[oklch(0.14_0.025_162)] border-r border-white/5 flex flex-col justify-between">
          <div>
            <div className="px-3 py-2 mb-4">
              <span className="text-[10px] font-bold text-[oklch(0.7_0.03_155)] uppercase tracking-wider block">
                User Settings
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide">Doomcord Preferences</h3>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'account'
                    ? 'bg-[oklch(0.235_0.032_158)] text-white shadow-sm'
                    : 'text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4 text-[oklch(0.85_0.12_165)]" />
                <span>My Account</span>
              </button>

              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-[oklch(0.235_0.032_158)] text-white shadow-sm'
                    : 'text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-4 h-4 text-[oklch(0.72_0.16_32)]" />
                <span>Privacy & Security</span>
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'appearance'
                    ? 'bg-[oklch(0.235_0.032_158)] text-white shadow-sm'
                    : 'text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-white/5'
                }`}
              >
                <Palette className="w-4 h-4 text-[oklch(0.84_0.14_85)]" />
                <span>Appearance & Theme</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-[oklch(0.235_0.032_158)] text-white shadow-sm'
                    : 'text-[oklch(0.7_0.03_155)] hover:text-white hover:bg-white/5'
                }`}
              >
                <Bell className="w-4 h-4 text-[oklch(0.76_0.11_230)]" />
                <span>Notifications</span>
              </button>
            </nav>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[oklch(0.72_0.15_355)] hover:bg-[oklch(0.72_0.15_355)]/20 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Right Settings Content */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <h2 className="text-base font-bold text-white capitalize">
                {activeTab === 'account' ? 'My Account & Identity' :
                 activeTab === 'privacy' ? 'Privacy and Security' :
                 activeTab === 'appearance' ? 'Theme & Visual Styling' : 'Notification Preferences'}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab: My Account */}
            {activeTab === 'account' && (
              <form onSubmit={handleSaveAccount} className="space-y-4 max-w-lg">
                <div>
                  <label className="text-xs font-semibold text-white block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">Avatar Image URL</label>
                  <input
                    type="text"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">Custom Status Message</label>
                  <input
                    type="text"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="What are you up to?"
                    className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">Personal Biography</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the realm about yourself..."
                    className="w-full bg-[oklch(0.235_0.032_158)] text-white text-xs px-3.5 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[oklch(0.85_0.12_165)] resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] rounded-xl shadow-lg hover:opacity-95 transition-all"
                  >
                    Save Changes
                  </button>
                  {savedFeedback && (
                    <span className="text-xs text-[oklch(0.85_0.12_165)] flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5" /> Profile updated successfully!
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* Tab: Privacy & Security */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 max-w-lg text-xs">
                <div className="p-4 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/5">
                  <h4 className="text-sm font-bold text-white mb-1">Direct Message Privacy</h4>
                  <p className="text-[oklch(0.7_0.03_155)] mb-3">
                    Allow direct messages from mutual community members.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer text-white font-medium">
                    <input type="checkbox" defaultChecked className="accent-[oklch(0.85_0.12_165)]" />
                    <span>Enable DM requests from server members</span>
                  </label>
                </div>

                <div className="p-4 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/5">
                  <h4 className="text-sm font-bold text-white mb-1">Read Status Transparency</h4>
                  <p className="text-[oklch(0.7_0.03_155)] mb-3">
                    Send read receipts when you view messages in direct messages.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer text-white font-medium">
                    <input type="checkbox" defaultChecked className="accent-[oklch(0.85_0.12_165)]" />
                    <span>Send read receipts (shows checkmarks to sender)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Tab: Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-4 max-w-lg text-xs">
                <div>
                  <label className="text-xs font-semibold text-white block mb-2">Accent Colour</label>
                  <div className="flex items-center gap-2">
                    {ACCENT_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setAccentColor(p.value);
                          onUpdateProfile({ accentColor: p.value });
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                          accentColor === p.value 
                            ? 'border-white text-white font-bold bg-white/10' 
                            : 'border-white/5 text-[oklch(0.7_0.03_155)] hover:border-white/20'
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.value }} />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/5 mt-4">
                  <h4 className="text-sm font-bold text-white mb-1">Color Palette Specification</h4>
                  <p className="text-[oklch(0.7_0.03_155)] leading-relaxed">
                    Doomcord strictly enforces a sophisticated dark forest-green aesthetic with coral and mint brand accents:
                  </p>
                  <div className="mt-2 text-[11px] font-mono text-[oklch(0.85_0.12_165)]">
                    Main Background: oklch(0.2 0.03 160) · Rail: oklch(0.14 0.025 162)
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-3 max-w-lg text-xs">
                {[
                  { title: 'Direct Message Chimes', desc: 'Play subtle audio chime on incoming direct messages' },
                  { title: 'Friend Request Alerts', desc: 'Display toast notifications for incoming friend invitations' },
                  { title: 'Community Mentions', desc: 'Notify when @mentioned in text channels or announcements' }
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">{n.title}</span>
                      <span className="text-[11px] text-[oklch(0.7_0.03_155)]">{n.desc}</span>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-[oklch(0.85_0.12_165)] w-4 h-4 cursor-pointer" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-[oklch(0.235_0.032_158)] hover:bg-[oklch(0.26_0.035_156)] rounded-xl border border-white/10 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
