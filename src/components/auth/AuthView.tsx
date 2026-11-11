import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck, Key, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthView: React.FC = () => {
  const { signInGoogle, signInEmail, signUpEmail, resetPassword, loginDemoUser } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInEmail(email, password);
      } else if (mode === 'signup') {
        if (!username.trim() || !displayName.trim()) {
          setErrorMsg('Username and Display Name are required.');
          setSubmitting(false);
          return;
        }
        await signUpEmail(email, password, username, displayName);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setInfoMsg('Password reset instructions sent to your email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      await signInGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in was cancelled or encountered an error.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-[oklch(0.2_0.03_160)] via-[oklch(0.18_0.028_161)] to-[oklch(0.14_0.025_162)] text-[oklch(0.95_0.015_150)]">
      <div className="w-full max-w-md p-8 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-2xl backdrop-blur-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] shadow-xl mb-3">
            <span className="font-heading font-black text-2xl text-white tracking-tighter">
              DOOMCORD
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Welcome to the Realm
          </h1>
          <p className="text-xs text-[oklch(0.7_0.03_155)] mt-1">
            Connect with friends, chat in real time, and explore 3D Orbs
          </p>
        </div>

        {/* 1-Click Multi-User Quick Test Access */}
        <div className="mb-6 p-3 rounded-2xl bg-[oklch(0.235_0.032_158)] border border-white/5">
          <span className="text-[10px] font-bold text-[oklch(0.85_0.12_165)] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> 1-Click Instant Multi-User Demo Access
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => loginDemoUser(0)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-center transition-all text-left"
            >
              <span className="text-xs font-bold text-white block">Alex</span>
              <span className="text-[9px] text-[oklch(0.7_0.03_155)] font-mono">@shadow_weaver</span>
            </button>
            <button
              onClick={() => loginDemoUser(1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-center transition-all text-left"
            >
              <span className="text-xs font-bold text-white block">Seraphina</span>
              <span className="text-[9px] text-[oklch(0.7_0.03_155)] font-mono">@seraph_mint</span>
            </button>
            <button
              onClick={() => loginDemoUser(2)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-center transition-all text-left"
            >
              <span className="text-xs font-bold text-white block">Cipher</span>
              <span className="text-[9px] text-[oklch(0.7_0.03_155)] font-mono">@cipher_zero</span>
            </button>
          </div>
        </div>

        {/* Google Authentication Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 mb-4 rounded-xl bg-white text-slate-900 font-semibold text-xs shadow-md hover:bg-gray-100 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] bg-white/10 flex-1" />
          <span className="text-[10px] text-[oklch(0.7_0.03_155)] uppercase font-mono">OR EMAIL</span>
          <div className="h-[1px] bg-white/10 flex-1" />
        </div>

        {/* Email Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs font-semibold text-white block mb-1">Display Name</label>
                <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2 rounded-xl border border-white/10 focus-within:border-[oklch(0.85_0.12_165)]">
                  <User className="w-3.5 h-3.5 text-[oklch(0.7_0.03_155)] mr-2" />
                  <input
                    type="text"
                    placeholder="Alex Thorne"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">Username</label>
                <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2 rounded-xl border border-white/10 focus-within:border-[oklch(0.85_0.12_165)]">
                  <span className="text-xs font-mono text-[oklch(0.7_0.03_155)] mr-1">@</span>
                  <input
                    type="text"
                    placeholder="shadow_weaver"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-full font-mono"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-white block mb-1">Email Address</label>
            <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2 rounded-xl border border-white/10 focus-within:border-[oklch(0.85_0.12_165)]">
              <Mail className="w-3.5 h-3.5 text-[oklch(0.7_0.03_155)] mr-2" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-full"
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-white">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-[oklch(0.85_0.12_165)] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2 rounded-xl border border-white/10 focus-within:border-[oklch(0.85_0.12_165)]">
                <Lock className="w-3.5 h-3.5 text-[oklch(0.7_0.03_155)] mr-2" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-xs text-white outline-none w-full"
                  required
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-[oklch(0.72_0.15_355)]/20 border border-[oklch(0.72_0.15_355)]/40 text-[oklch(0.72_0.15_355)] text-xs">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="p-2.5 rounded-xl bg-[oklch(0.85_0.12_165)]/20 border border-[oklch(0.85_0.12_165)]/40 text-[oklch(0.85_0.12_165)] text-xs">
              {infoMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] rounded-xl shadow-lg hover:opacity-95 transition-all disabled:opacity-40"
          >
            {submitting ? 'Please wait...' :
             mode === 'signin' ? 'Sign In to Doomcord' :
             mode === 'signup' ? 'Create Doomcord Account' : 'Send Reset Link'}
          </button>
        </form>

        {/* Mode Toggles */}
        <div className="mt-6 text-center text-xs text-[oklch(0.7_0.03_155)]">
          {mode === 'signin' ? (
            <span>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-[oklch(0.85_0.12_165)] hover:underline font-semibold">
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button onClick={() => setMode('signin')} className="text-[oklch(0.85_0.12_165)] hover:underline font-semibold">
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
