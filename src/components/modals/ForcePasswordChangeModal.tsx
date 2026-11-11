import React, { useState } from 'react';
import { ShieldAlert, Lock, Check, LogOut } from 'lucide-react';

interface ForcePasswordChangeModalProps {
  isOpen: boolean;
  userEmail: string;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onDeferForSession: () => void;
  onLogout: () => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  isOpen,
  userEmail,
  onChangePassword,
  onDeferForSession,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword === '1234') {
      setError('You cannot reuse the temporary initial password (1234).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await onChangePassword(currentPassword, newPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md p-6 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-[oklch(0.84_0.14_85)]/40 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-[oklch(0.84_0.14_85)]/20 text-[oklch(0.84_0.14_85)] border border-[oklch(0.84_0.14_85)]/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Security Policy: Change Initial Password</h3>
            <span className="text-xs text-[oklch(0.7_0.03_155)] font-mono">{userEmail}</span>
          </div>
        </div>

        <p className="text-xs text-[oklch(0.95_0.015_150)] leading-relaxed mb-4 p-3 rounded-xl bg-[oklch(0.235_0.032_158)] border border-white/5">
          Your Owner account was initialized with a temporary bootstrap password. Before public production use, please set a strong permanent password (at least 6 characters).
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-white block mb-1">Current Temporary Password</label>
            <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2 rounded-xl border border-white/10">
              <Lock className="w-3.5 h-3.5 text-[oklch(0.7_0.03_155)] mr-2" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-transparent text-xs text-white outline-none w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1">New Permanent Password (min 6 chars)</label>
            <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2 rounded-xl border border-white/10">
              <Lock className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)] mr-2" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="bg-transparent text-xs text-white outline-none w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1">Confirm New Password</label>
            <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2 rounded-xl border border-white/10">
              <Check className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)] mr-2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-transparent text-xs text-white outline-none w-full"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-[oklch(0.72_0.15_355)]/20 border border-[oklch(0.72_0.15_355)]/40 text-[oklch(0.72_0.15_355)] text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-[oklch(0.7_0.03_155)] hover:text-white"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDeferForSession}
                className="px-3 py-2 text-xs text-[oklch(0.7_0.03_155)] hover:text-white bg-[oklch(0.235_0.032_158)] rounded-xl border border-white/5"
              >
                Remind Next Login
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] rounded-xl shadow-lg hover:opacity-95 disabled:opacity-40"
              >
                {submitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
