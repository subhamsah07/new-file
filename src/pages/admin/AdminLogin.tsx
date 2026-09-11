import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, Eye, EyeOff, Building2 } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { adminSignIn, isAuthenticated, admin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // If already authenticated and authorized as an admin, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated && admin) {
      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, admin, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const result = await adminSignIn(email.trim(), password);

      if (result.success) {
        const from = (location.state as any)?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      } else {
        setErrorMsg(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
      {/* Top official tricolor line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-700 shadow-xs z-50" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* SmartProcure branding */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-950/20 mb-4 border border-emerald-700">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
            <span>SmartProcure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            State Admin Portal
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-sm leading-relaxed">
            Agricultural intake and mandi management authority for state procurement administrators.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 py-8 px-6 sm:px-10 rounded-2xl shadow-lg">
          {errorMsg && (
            <div
              id="admin-login-error"
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Official Admin Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@procure.in"
                  className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition"
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="admin-signin-btn"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Official Jurisdictions Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-2">
              <span>Authorized State Jurisdictions</span>
              <span className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider">RLS Enforced</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <span className="font-medium">Bihar</span>
                <span className="font-mono text-[10px] text-emerald-800 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">BR</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <span className="font-medium">Rajasthan</span>
                <span className="font-mono text-[10px] text-emerald-800 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">RJ</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <span className="font-medium">Uttar Pradesh</span>
                <span className="font-mono text-[10px] text-emerald-800 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">UP</span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <span className="font-medium">West Bengal</span>
                <span className="font-mono text-[10px] text-emerald-800 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">WB</span>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-slate-400 text-center leading-relaxed">
              Administrative credentials are authenticated via Supabase Auth and restricted by Row-Level Security.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          SmartProcure Agricultural Intake Platform • Official Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};
