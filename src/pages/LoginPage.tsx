import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Radio, Mail, Lock, AlertCircle, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { signInWithEmail, signInWithGoogle, signInAsDemoUser, isFirebaseActive } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      showToast('Signed in successfully', 'success');
      navigate(redirect);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      showToast('Signed in with Google', 'success');
      navigate(redirect);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(msg);
    }
  };

  const handleQuickDemo = (asAdmin: boolean) => {
    signInAsDemoUser(asAdmin);
    showToast(asAdmin ? 'Signed in as Administrator' : 'Signed in as Viewer', 'success');
    navigate(asAdmin ? '/admin' : redirect);
  };

  return (
    <div id="login-page" className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-950">
          <Radio className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Sign In to StreamLive</h1>
        <p className="text-xs text-slate-400">
          Sync your favorite channels, custom program reminders, and watch history
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-900/80 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick 1-Click Persona Login */}
      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
          Instant Demo Access
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo(false)}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Viewer Demo</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo(true)}
            className="py-2 px-3 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Demo</span>
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-800 w-full" />
        <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-semibold">
          Or with email
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/60 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      <div className="text-center text-xs text-slate-400">
        Don't have an account?{' '}
        <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-indigo-400 font-semibold hover:underline">
          Create Account
        </Link>
      </div>
    </div>
  );
};
