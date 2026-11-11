import React, { useState } from 'react';
import { Mail, Lock, User, ShieldCheck, Crown, Compass, MessageSquare } from 'lucide-react';
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
        await signUpEmail(
          email.trim(),
          password,
          username.trim(),
          displayName.trim()
        );
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
      setErrorMsg(
        err.message || 'Google sign-in was cancelled or encountered an error.'
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#101A17] text-[#F0F5F1]">
      {/* Left Architectural Identity Showcase (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-[#141F1B] border-r border-white/[0.06] p-12 flex-col justify-between relative overflow-hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8BE2B8] text-[#101A17] flex items-center justify-center font-display font-extrabold text-lg">
              D
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-[#F0F5F1]">
              DOOMCORD
            </span>
          </div>

          <div className="mt-16 max-w-xl space-y-5">
            <div className="text-xs font-mono uppercase tracking-widest text-[#8BE2B8]">
              Next-Generation Social Communication Platform
            </div>
            <h1 className="text-4xl font-display font-bold text-[#F0F5F1] leading-tight">
              Precision real-time messaging, curated communities, and interactive Orbs.
            </h1>
            <p className="text-sm text-[#9BAEA2] leading-relaxed">
              Designed for clarity, speed, and zero noise. Connect across direct messages, structured community channels, 3D interest spheres, and DOOMCORD APEX customization.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 max-w-xl">
            <div className="p-4 rounded-xl bg-[#192620] border border-white/[0.06]">
              <MessageSquare className="w-4 h-4 text-[#8BE2B8] mb-2" />
              <div className="text-xs font-semibold text-[#F0F5F1]">
                Real-Time Threads
              </div>
              <p className="text-[11px] text-[#718478] mt-1">
                Read receipts, replies, pinning & attachments
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#192620] border border-white/[0.06]">
              <Compass className="w-4 h-4 text-[#E9987B] mb-2" />
              <div className="text-xs font-semibold text-[#F0F5F1]">
                Interactive Orbs
              </div>
              <p className="text-[11px] text-[#718478] mt-1">
                Discovery grid & 3D spatial constellation
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#192620] border border-white/[0.06]">
              <Crown className="w-4 h-4 text-[#D9BB79] mb-2" />
              <div className="text-xs font-semibold text-[#F0F5F1]">
                DOOMCORD APEX
              </div>
              <p className="text-[11px] text-[#718478] mt-1">
                Profile themes, cosmetics & instant gifting
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#718478] pt-8 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8BE2B8]" />
            <span>Authenticated sessions & live Firestore persistence</span>
          </div>
          <span className="font-mono">DOOMCORD v2.6</span>
        </div>
      </div>

      {/* Right Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div>
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#8BE2B8] text-[#101A17] flex items-center justify-center font-display font-extrabold text-base">
                D
              </div>
              <span className="font-display font-bold text-base text-[#F0F5F1]">
                DOOMCORD
              </span>
            </div>

            <h2 className="text-2xl font-display font-bold text-[#F0F5F1]">
              {mode === 'signin'
                ? 'Sign in to Doomcord'
                : 'Create your Doomcord account'}
            </h2>
            <p className="text-xs text-[#9BAEA2] mt-1">
              {mode === 'signin'
                ? 'Enter your credentials or continue with Google to access your workspace.'
                : 'Register a unique @username to join communities, Orbs, and direct conversations.'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#141F1B] border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`h-9 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'signin'
                  ? 'bg-[#24362C] text-[#F0F5F1]'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
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
              className={`h-9 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'signup'
                  ? 'bg-[#24362C] text-[#F0F5F1]'
                  : 'text-[#9BAEA2] hover:text-[#F0F5F1]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full h-10 flex items-center justify-center gap-3 px-4 rounded-xl bg-[#F0F5F1] hover:bg-white text-[#101A17] font-semibold text-xs transition-colors"
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

          <div className="flex items-center gap-3">
            <div className="h-[1px] bg-white/[0.06] flex-1" />
            <span className="text-[10px] text-[#718478] uppercase font-mono">
              or email & password
            </span>
            <div className="h-[1px] bg-white/[0.06] flex-1" />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#9BAEA2] block mb-1.5">
                    Display Name
                  </label>
                  <div className="flex items-center bg-[#141F1B] px-3 h-10 rounded-xl border border-white/[0.08] focus-within:border-[#8BE2B8]">
                    <User className="w-3.5 h-3.5 text-[#718478] mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Alex Mercer"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-transparent text-xs text-[#F0F5F1] placeholder-[#718478] outline-none w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#9BAEA2] block mb-1.5">
                    Unique Username
                  </label>
                  <div className="flex items-center bg-[#141F1B] px-3 h-10 rounded-xl border border-white/[0.08] focus-within:border-[#8BE2B8]">
                    <span className="text-xs font-mono text-[#718478] mr-1">
                      @
                    </span>
                    <input
                      type="text"
                      placeholder="alex"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-transparent text-xs text-[#F0F5F1] placeholder-[#718478] outline-none w-full font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[#9BAEA2] block mb-1.5">
                Email Address
              </label>
              <div className="flex items-center bg-[#141F1B] px-3.5 h-10 rounded-xl border border-white/[0.08] focus-within:border-[#8BE2B8]">
                <Mail className="w-3.5 h-3.5 text-[#718478] mr-2.5 shrink-0" />
                <input
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent text-xs text-[#F0F5F1] placeholder-[#718478] outline-none w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#9BAEA2] block mb-1.5">
                Password
              </label>
              <div className="flex items-center bg-[#141F1B] px-3.5 h-10 rounded-xl border border-white/[0.08] focus-within:border-[#8BE2B8]">
                <Lock className="w-3.5 h-3.5 text-[#718478] mr-2.5 shrink-0" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-xs text-[#F0F5F1] placeholder-[#718478] outline-none w-full"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#E57373]/15 border border-[#E57373]/30 text-[#E57373] text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 px-4 text-xs font-semibold text-[#101A17] bg-[#8BE2B8] hover:bg-[#7AD4A8] rounded-xl transition-colors disabled:opacity-40"
            >
              {submitting
                ? 'Authenticating...'
                : mode === 'signin'
                ? 'Sign In to Doomcord'
                : 'Create Doomcord Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
