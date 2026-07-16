import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, Lock, User, Loader2, CheckCircle2,
  Trophy, Flame, Rocket, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const highlights = [
  { icon: Rocket, title: '44 Hands-On AI Agent Sessions', text: 'Real, runnable projects across every department — no placeholder tutorials.' },
  { icon: Trophy, title: 'XP, Levels & Streaks', text: 'Earn XP for every build, level up from Apprentice to Master, and track your daily streak.' },
  { icon: CheckCircle2, title: 'Progress Saved to Your Account', text: 'Sign up and your completed builds, XP, and history sync to the cloud — pick up on any device.' },
];

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function Welcome() {
  const { signUp, signIn, signInWithGoogle, isConfigured, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const { error: err } = await signInWithGoogle();
      if (err) throw err;
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await signUp(email, password, name);
        if (err) throw err;
        if (data?.session) {
          navigate('/dashboard');
        } else {
          setConfirmSent(true);
        }
      } else {
        const { error: err } = await signIn(email, password);
        if (err) throw err;
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0A0A1A] via-[#0D1B3E] to-[#0A0A1A] min-h-[calc(100vh-4rem)]">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0067B8]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#7C3AED]/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: pitch */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.svg" alt="Social Dev Technologies" className="w-12 h-12 object-contain" />
            <div>
              <p className="font-extrabold text-white text-lg leading-tight">Social Dev</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Technologies</p>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Create your account.{' '}
            <span className="bg-gradient-to-r from-[#0067B8] via-[#7C3AED] to-[#F59E0B] bg-clip-text text-transparent">
              Never lose your progress.
            </span>
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-xl">
            Sign up to save your XP, completed builds, and streaks to your account — synced
            across every device.
          </p>

          <div className="space-y-6">
            {highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <h.icon className="w-5 h-5 text-[#0067B8]" />
                </div>
                <div>
                  <p className="font-bold text-white">{h.title}</p>
                  <p className="text-sm text-slate-400">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: auth form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 sm:p-8"
        >
          {!isConfigured && (
            <div className="mb-6 flex items-start gap-2 text-sm text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Accounts aren't configured yet. Add <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
                <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to your <code className="font-mono">.env</code> file.
              </span>
            </div>
          )}

          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-lg bg-white/5 border border-white/10">
            <button
              onClick={() => { setMode('signup'); setError(''); setConfirmSent(false); }}
              className={`py-2.5 rounded-md text-sm font-bold transition-colors ${mode === 'signup' ? 'bg-[#0067B8] text-white' : 'text-slate-300 hover:text-white'}`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setMode('login'); setError(''); setConfirmSent(false); }}
              className={`py-2.5 rounded-md text-sm font-bold transition-colors ${mode === 'login' ? 'bg-[#0067B8] text-white' : 'text-slate-300 hover:text-white'}`}
            >
              Log In
            </button>
          </div>

          {confirmSent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Check your inbox</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
                Click it to verify your account, then come back and log in.
              </p>
            </div>
          ) : (
            <>
              {/* Google sign-in */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || !isConfigured}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-bold rounded-lg px-5 py-3 transition-colors mb-5"
              >
                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-600" /> : <GoogleIcon />}
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-slate-500">or continue with email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0067B8] focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0067B8] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0067B8] focus:border-transparent"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-red-300 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !isConfigured}
                  className="w-full flex items-center justify-center gap-2 bg-[#0067B8] hover:bg-[#0078D4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg px-5 py-3 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'signup' ? <Flame className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                  {mode === 'signup' ? 'Create Account' : 'Log In'}
                </button>

                <p className="text-xs text-slate-500 text-center">
                  {mode === 'signup' ? (
                    <>Already have an account?{' '}
                      <button type="button" onClick={() => setMode('login')} className="text-[#0067B8] font-semibold hover:underline">Log in</button>
                    </>
                  ) : (
                    <>Don't have an account?{' '}
                      <button type="button" onClick={() => setMode('signup')} className="text-[#0067B8] font-semibold hover:underline">Sign up</button>
                    </>
                  )}
                </p>
              </form>
            </>
          )}
        </motion.div>
      </div>

      <div className="text-center pb-12 text-sm text-slate-500">
        <Link to="/" className="hover:text-white transition-colors">← Back to home</Link>
      </div>
    </div>
  );
}
