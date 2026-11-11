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
      <div className="w-full max-w-md p-6 rounded-2xl bg-[#101014] border border-[#8957F5]/40 shadow-2xl text-[#F5F3FA]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[#8957F5]/20 text-[#8957F5] border border-[#8957F5]/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F5F3FA]">
              Security Policy: Change Initial Password
            </h3>
            <span className="text-xs text-[#706C7B] font-mono">{userEmail}</span>
          </div>
        </div>

        <p className="text-xs text-[#A19DAD] leading-relaxed mb-4 p-3 rounded-lg bg-[#17171F] border border-[#282631]">
          Your account was initialized with a temporary bootstrap password. Please set a strong permanent password (at least 6 characters) before proceeding.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-1">
              Current Temporary Password
            </label>
            <div className="flex items-center bg-[#17171F] px-3 py-2 rounded-lg border border-[#282631]">
              <Lock className="w-3.5 h-3.5 text-[#706C7B] mr-2" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-transparent text-xs text-[#F5F3FA] outline-none w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-1">
              New Permanent Password (min 6 chars)
            </label>
            <div className="flex items-center bg-[#17171F] px-3 py-2 rounded-lg border border-[#282631]">
              <Lock className="w-3.5 h-3.5 text-[#8957F5] mr-2" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="bg-transparent text-xs text-[#F5F3FA] outline-none w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#A19DAD] block mb-1">
              Confirm New Password
            </label>
            <div className="flex items-center bg-[#17171F] px-3 py-2 rounded-lg border border-[#282631]">
              <Check className="w-3.5 h-3.5 text-[#8957F5] mr-2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-transparent text-xs text-[#F5F3FA] outline-none w-full"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-[#ED4245]/20 border border-[#ED4245]/40 text-[#ED4245] text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 gap-2 border-t border-[#282631]">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#706C7B] hover:text-[#F5F3FA] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDeferForSession}
                className="px-3 py-2 text-xs text-[#A19DAD] hover:text-[#F5F3FA] bg-[#17171F] rounded-lg border border-[#282631] transition-colors"
              >
                Remind Next Login
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#8957F5] hover:bg-[#7846E4] rounded-lg shadow-sm shadow-[#8957F5]/20 hover:opacity-95 disabled:opacity-40 transition-colors"
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
