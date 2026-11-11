import React, { useState } from 'react';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthView: React.FC = () => {
  const { signInGoogle, signInEmail, signUpEmail } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInEmail(email.trim(), password);
      } else {
        if (!username.trim() || !displayName.trim()) {
          setErrorMsg('Username and Display Name are required.');
          setSubmitting(false);
          return;
        }
        await signUpEmail(email.trim(), password, username.trim(), displayName.trim());
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
      <div className="w-full max-w-md p-8 rounded-3xl bg-[oklch(0.17_0.028_161)] border border-white/10 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex px-4 py-2 rounded-2xl bg-gradient-to-tr from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] shadow-xl mb-3">
            <span className="font-heading font-black text-2xl text-white tracking-tighter">
              DOOMCORD
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your Doomcord account'}
          </h1>
          <p className="text-xs text-[oklch(0.7_0.03_155)] mt-1">
            Real-time communication, communities, Nitro & 3D Spatial Orbs
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-xl bg-[oklch(0.14_0.025_162)] border border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-[oklch(0.235_0.032_158)] text-white shadow-sm'
                : 'text-[oklch(0.7_0.03_155)] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-[oklch(0.235_0.032_158)] text-white shadow-sm'
                : 'text-[oklch(0.7_0.03_155)] hover:text-white'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 mb-4 rounded-xl bg-white text-slate-900 font-semibold text-xs shadow-md hover:bg-gray-100 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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

        <div className="flex items-center gap-3 my-4">
          <div className="h-[1px] bg-white/10 flex-1" />
          <span className="text-[10px] text-[oklch(0.7_0.03_155)] uppercase font-mono">
            OR EMAIL CREDENTIALS
          </span>
          <div className="h-[1px] bg-white/10 flex-1" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs font-semibold text-white block mb-1">Display Name</label>
                <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2.5 rounded-xl border border-white/10 focus-within:border-[oklch(0.85_0.12_165)]">
                  <User className="w-3.5 h-3.5 text-[oklch(0.7_0.03_155)] mr-2" />
                  <input
                    type="text"
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">Unique Username</label>
                <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2.5 rounded-xl border border-white/10 focus-within:border-[oklch(0.85_0.12_165)]">
                  <span className="text-xs font-mono text-[oklch(0.7_0.03_155)] mr-1">@</span>
                  <input
                    type="text"
                    placeholder="username"
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
            <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2.5 rounded-xl border border-white/10 focus-within:border-[oklch(0.85_0.12_165)]">
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

          <div>
            <label className="text-xs font-semibold text-white block mb-1">Password</label>
            <div className="flex items-center bg-[oklch(0.235_0.032_158)] px-3 py-2.5 rounded-xl border border-white/10 focus-within:border-[oklch(0.85_0.12_165)]">
              <Lock className="w-3.5 h-3.5 text-[oklch(0.7_0.03_155)] mr-2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-full"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-[oklch(0.72_0.15_355)]/20 border border-[oklch(0.72_0.15_355)]/40 text-[oklch(0.72_0.15_355)] text-xs">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-[oklch(0.72_0.16_32)] to-[oklch(0.85_0.12_165)] rounded-xl shadow-lg hover:opacity-95 transition-all disabled:opacity-40"
          >
            {submitting
              ? 'Authenticating...'
              : mode === 'signin'
              ? 'Sign In to Doomcord'
              : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-[oklch(0.7_0.03_155)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[oklch(0.85_0.12_165)]" />
          <span>End-to-end verified session & real-time database persistence</span>
        </div>
      </div>
    </div>
  );
};
