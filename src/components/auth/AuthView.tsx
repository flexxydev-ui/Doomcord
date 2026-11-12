import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  Crown,
  Compass,
  MessageSquare,
  ArrowRight,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthView: React.FC = () => {
  const { signInGoogle, signInEmail, signUpEmail, resetPasswordWithRecovery } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | '2fa' | 'recovery'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInEmail(email.trim(), password);
      } else if (mode === '2fa') {
        if (!totpCode.trim()) {
          setErrorMsg('Please enter your 6-digit Authenticator code or Backup Recovery code.');
          setSubmitting(false);
          return;
        }
        await signInEmail(email.trim(), password, totpCode.trim());
      } else if (mode === 'recovery') {
        if (!email.trim() || !recoveryCode.trim() || !newPassword.trim()) {
          setErrorMsg('Email, 2FA/Recovery code, and new password are required.');
          setSubmitting(false);
          return;
        }
        await resetPasswordWithRecovery(email.trim(), recoveryCode.trim(), newPassword);
        setSuccessMsg('Password reset complete! You can now sign in with your new password.');
        setMode('signin');
        setPassword('');
        setRecoveryCode('');
        setNewPassword('');
      } else {
        if (!username.trim() || !displayName.trim()) {
          setErrorMsg('Username and Display Name are required.');
          setSubmitting(false);
          return;
        }
        await signUpEmail(
          email.trim(),
          password,
          username.trim(),
          displayName.trim()
        );
      }
    } catch (err: any) {
      if (err?.message === 'TWO_FACTOR_REQUIRED') {
        setMode('2fa');
        setErrorMsg(null);
      } else {
        setErrorMsg(err.message || 'Authentication error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      await signInGoogle();
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Google sign-in was cancelled or encountered an error.'
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#09090D] text-[#F5F3FA]">
      {/* Left Brand Identity Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-[#101014] border-r border-[#282631] p-12 flex-col justify-between relative overflow-hidden select-none">
        <div>
          {/* Official Brand Mark & Title */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/doomcord-icon_378efdf9.png"
              alt="Doomcord"
              className="w-9 h-9 object-contain"
            />
            <span className="font-semibold text-lg tracking-tight text-[#F5F3FA]">
              Doomcord
            </span>
          </div>

          <div className="mt-20 max-w-lg space-y-4">
            <div className="text-xs font-medium tracking-wide uppercase text-[#8957F5]">
              Modern Communication Platform
            </div>
            <h1 className="text-3xl xl:text-4xl font-semibold text-[#F5F3FA] leading-tight">
              Real-time messaging, curated communities, and interactive Orbs.
            </h1>
            <p className="text-sm text-[#A19DAD] leading-relaxed">
              Designed for speed, clarity, and zero clutter. Connect across direct conversations, structured community servers, 2FA security, and DOOMCORD APEX benefits.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3.5 max-w-lg">
            <div className="p-4 rounded-lg bg-[#17171F] border border-[#282631]">
              <MessageSquare className="w-4 h-4 text-[#8957F5] mb-2.5" />
              <div className="text-xs font-medium text-[#F5F3FA]">
                Direct Threads
              </div>
              <p className="text-[11px] text-[#706C7B] mt-1 leading-normal">
                Encrypted chats, replies & media
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#17171F] border border-[#282631]">
              <Compass className="w-4 h-4 text-[#A47BFF] mb-2.5" />
              <div className="text-xs font-medium text-[#F5F3FA]">
                Spatial Orbs
              </div>
              <p className="text-[11px] text-[#706C7B] mt-1 leading-normal">
                Curated discovery & 3D space
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#17171F] border border-[#282631]">
              <Crown className="w-4 h-4 text-[#C4B1FF] mb-2.5" />
              <div className="text-xs font-medium text-[#F5F3FA]">
                DOOMCORD APEX
              </div>
              <p className="text-[11px] text-[#706C7B] mt-1 leading-normal">
                Themes, badges & gifting
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#706C7B] pt-8 border-t border-[#282631]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8957F5]" />
            <span>RFC 6238 2FA Authenticator & persistent Firestore state</span>
          </div>
          <span className="font-mono text-[11px]">Doomcord v3.5</span>
        </div>
      </div>

      {/* Right Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <img
              src="/assets/aistudio/doomcord-icon_378efdf9.png"
              alt="Doomcord"
              className="w-8 h-8 object-contain"
            />
            <span className="font-semibold text-base text-[#F5F3FA]">
              Doomcord
            </span>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#F5F3FA]">
              {mode === 'signin'
                ? 'Sign in to Doomcord'
                : mode === 'signup'
                ? 'Create your account'
                : mode === '2fa'
                ? 'Two-Factor Authentication'
                : 'Account Recovery'}
            </h2>
            <p className="text-xs text-[#A19DAD] mt-1">
              {mode === 'signin'
                ? 'Enter your credentials or continue with Google to access your account.'
                : mode === 'signup'
                ? 'Choose a unique username to join communities and chat.'
                : mode === '2fa'
                ? `Enter the 6-digit code from your authenticator app or a backup code for ${email}.`
                : 'Reset your password using your 2FA authenticator code or backup recovery code.'}
            </p>
          </div>

          {/* Mode Segmented Switcher */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#101014] border border-[#282631]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`h-8 text-xs font-medium rounded transition-colors ${
                  mode === 'signin'
                    ? 'bg-[#22212C] text-[#F5F3FA]'
                    : 'text-[#A19DAD] hover:text-[#F5F3FA]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`h-8 text-xs font-medium rounded transition-colors ${
                  mode === 'signup'
                    ? 'bg-[#22212C] text-[#F5F3FA]'
                    : 'text-[#A19DAD] hover:text-[#F5F3FA]'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full h-9 flex items-center justify-center gap-2.5 px-4 rounded-lg bg-[#17171F] hover:bg-[#22212C] border border-[#282631] text-xs font-medium text-[#F5F3FA] transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-[1px] bg-[#282631] flex-1" />
                <span className="text-[10px] text-[#706C7B] uppercase tracking-wider font-mono">
                  or credentials
                </span>
                <div className="h-[1px] bg-[#282631] flex-1" />
              </div>
            </>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-[#3BA55D]/15 border border-[#3BA55D]/30 text-[#3BA55D] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Credentials / 2FA / Recovery Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === '2fa' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                    6-Digit Authenticator Code or Backup Code
                  </label>
                  <div className="flex items-center bg-[#101014] px-3 h-10 rounded-lg border border-[#8957F5] transition-colors">
                    <KeyRound className="w-4 h-4 text-[#8957F5] mr-2.5 shrink-0" />
                    <input
                      type="text"
                      placeholder="123456 or ABCD-1234"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      className="bg-transparent text-sm text-[#F5F3FA] placeholder-[#706C7B] outline-none w-full font-mono tracking-widest"
                      autoFocus
                      required
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setTotpCode('');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-[#A19DAD] hover:text-[#F5F3FA] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            ) : mode === 'recovery' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                    Account Email
                  </label>
                  <div className="flex items-center bg-[#101014] px-3 h-9 rounded-lg border border-[#282631] focus-within:border-[#8957F5]">
                    <Mail className="w-3.5 h-3.5 text-[#706C7B] mr-2 shrink-0" />
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none w-full"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                    2FA Code or Backup Recovery Code
                  </label>
                  <div className="flex items-center bg-[#101014] px-3 h-9 rounded-lg border border-[#282631] focus-within:border-[#8957F5]">
                    <KeyRound className="w-3.5 h-3.5 text-[#8957F5] mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="6-digit TOTP or ABCD-EFGH"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      className="bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none w-full font-mono"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                    New Password
                  </label>
                  <div className="flex items-center bg-[#101014] px-3 h-9 rounded-lg border border-[#282631] focus-within:border-[#8957F5]">
                    <Lock className="w-3.5 h-3.5 text-[#706C7B] mr-2 shrink-0" />
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none w-full"
                      required
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-[#A19DAD] hover:text-[#F5F3FA] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            ) : (
              <>
                {mode === 'signup' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                        Display Name
                      </label>
                      <div className="flex items-center bg-[#101014] px-3 h-9 rounded-lg border border-[#282631] focus-within:border-[#8957F5] transition-colors">
                        <User className="w-3.5 h-3.5 text-[#706C7B] mr-2 shrink-0" />
                        <input
                          type="text"
                          placeholder="Alex Mercer"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none w-full"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                        Username
                      </label>
                      <div className="flex items-center bg-[#101014] px-3 h-9 rounded-lg border border-[#282631] focus-within:border-[#8957F5] transition-colors">
                        <span className="text-xs font-mono text-[#706C7B] mr-1">
                          @
                        </span>
                        <input
                          type="text"
                          placeholder="alex"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none w-full font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-[#A19DAD] block mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center bg-[#101014] px-3 h-9 rounded-lg border border-[#282631] focus-within:border-[#8957F5] transition-colors">
                    <Mail className="w-3.5 h-3.5 text-[#706C7B] mr-2 shrink-0" />
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#A19DAD]">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('recovery');
                          setErrorMsg(null);
                        }}
                        className="text-[11px] text-[#8957F5] hover:text-[#A47BFF]"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="flex items-center bg-[#101014] px-3 h-9 rounded-lg border border-[#282631] focus-within:border-[#8957F5] transition-colors">
                    <Lock className="w-3.5 h-3.5 text-[#706C7B] mr-2 shrink-0" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-transparent text-xs text-[#F5F3FA] placeholder-[#706C7B] outline-none w-full"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-[#ED4245]/10 border border-[#ED4245]/25 text-[#ED4245] text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-9 px-4 text-xs font-medium text-white bg-[#8957F5] hover:bg-[#7842EB] rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>
                {submitting
                  ? 'Verifying...'
                  : mode === 'signin'
                  ? 'Sign In to Doomcord'
                  : mode === '2fa'
                  ? 'Verify 2FA & Sign In'
                  : mode === 'recovery'
                  ? 'Reset Account Password'
                  : 'Create Account'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
