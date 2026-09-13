import * as React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { SmartProcureLogo } from '../components/ui/SmartProcureLogo';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, resetPassword } = useAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = React.useState(false);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);

  // If already authenticated, redirect immediately to /farmer
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/farmer';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Read message or email passed from registration or password reset
  React.useEffect(() => {
    if (location.state?.message) {
      setInfoMessage(location.state.message);
    }
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location.state, location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsEmailUnconfirmed(false);
    setInfoMessage(null);

    if (!email.trim() || !password) {
      setError('Please enter both your registered email address and password.');
      return;
    }

    setIsLoading(true);
    const result = await signIn(email.trim(), password);
    setIsLoading(false);

    if (result.success) {
      const from = (location.state as any)?.from?.pathname || '/farmer';
      navigate(from, { replace: true });
    } else {
      if (result.isEmailUnconfirmed) {
        setIsEmailUnconfirmed(true);
        setError('Please verify your email before logging in.');
      } else {
        setError(result.error || 'Unable to sign in. Please verify your credentials.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter your registered email address first to receive recovery instructions.');
      return;
    }
    setError(null);
    const res = await resetPassword(email);
    if (res.success) {
      setInfoMessage(`Password recovery instructions sent to ${email} (from smartprocurementsystem@gmail.com).`);
    } else {
      setError(res.error || 'Failed to send password recovery email.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center">
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white">
        
        {/* LEFT / TOP VISUAL SIDE (Collapses gracefully on mobile) */}
        <div className="relative lg:col-span-6 bg-emerald-950 text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden min-h-[300px] lg:min-h-screen">
          {/* Background photograph with dark green gradient overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/pexels-hson-32954665.jpg"
              alt="Agricultural grain procurement and harvest"
              className="w-full h-full object-cover opacity-40"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1600&auto=format&fit=crop";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 via-emerald-900/85 to-emerald-800/80" />
          </div>

          {/* Top Brand Header */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <SmartProcureLogo size={46} />
              <div>
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  Smart<span className="text-emerald-400">Procure</span>
                </span>
                <span className="text-[11px] text-emerald-300 block -mt-1 font-medium">
                  National Agricultural Digital Procurement
                </span>
              </div>
            </Link>
          </div>

          {/* Core Tagline / Philosophy */}
          <div className="relative z-10 my-auto py-8 max-w-md space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold border border-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Supabase Auth Protected</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              &ldquo;Your procurement journey, without the unnecessary wait.&rdquo;
            </h2>

            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Log in to manage your procurement slots, track your live queue position, and receive
              automatic arrival notifications before heading to the mandi.
            </p>
          </div>

          {/* Bottom Operational Note */}
          <div className="relative z-10 pt-4 border-t border-emerald-800/80 text-xs text-emerald-300/80 flex items-center justify-between">
            <span>Kisan Helpline: 1800-180-1551</span>
            <span>SIH 2026 Initiative</span>
          </div>
        </div>

        {/* RIGHT FORM SIDE */}
        <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md space-y-6"
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Farmer Login
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Enter your registered credentials to access your procurement portal
              </p>
            </div>

            {infoMessage && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {isEmailUnconfirmed && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-start gap-2.5 text-sm text-amber-900 font-medium">
                  <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Email Verification Required</p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Please verify your email before logging in. A 6-digit verification code was sent to <strong>{email}</strong> from <em>noreply@mail.app.supabase.io</em> or <em>smartprocurementsystem@gmail.com</em>. Check Spam if missing.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-center bg-white border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs"
                  onClick={() =>
                    navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`, {
                      state: { email: email.trim() },
                    })
                  }
                >
                  Enter verification code &rarr;
                </Button>
              </div>
            )}

            {error && !isEmailUnconfirmed && (
              <Alert variant="destructive" title="Authentication Error">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                disabled={isLoading}
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  disabled={isLoading}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-emerald-700 hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="orange"
                size="lg"
                isLoading={isLoading}
                className="w-full justify-center gap-2 text-base font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In to Portal'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
              <span>Don&apos;t have a registered account yet? </span>
              <Link to="/register" className="font-bold text-emerald-700 hover:underline">
                Register as Farmer
              </Link>
            </div>

            <div className="text-center">
              <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">
                &larr; Back to Public Portal Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
