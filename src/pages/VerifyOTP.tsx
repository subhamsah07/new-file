import * as React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, Edit3 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { SmartProcureLogo } from '../components/ui/SmartProcureLogo';
import { useAuth } from '../contexts/AuthContext';
import { SMARTPROCURE_SENDER_IDENTITY } from '../services/emailService';

export const VerifyOTP: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp, isAuthenticated } = useAuth();

  const state = (location.state as { email?: string }) || {};
  const searchParams = new URLSearchParams(location.search);
  const emailFromUrl = searchParams.get('email');

  const [email, setEmail] = React.useState<string>(state.email || emailFromUrl || '');
  const [isEditingEmail, setIsEditingEmail] = React.useState<boolean>(!state.email && !emailFromUrl);
  const [otp, setOtp] = React.useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(60);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // If already authenticated, redirect to /farmer
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/farmer', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Timer countdown
  React.useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleDigitChange = (index: number, val: string) => {
    // Keep only numeric characters
    const cleanVal = val.replace(/\D/g, '');
    if (cleanVal.length > 1) {
      // If user pasted multiple characters into a single box
      handlePastedCode(cleanVal);
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = cleanVal;
    setOtp(nextOtp);

    // Auto-focus next input
    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePastedCode = (pastedText: string) => {
    const digits = pastedText.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length > 0) {
      const nextOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        nextOtp[i] = digits[i] || '';
      }
      setOtp(nextOtp);
      const targetIndex = Math.min(digits.length, 5);
      document.getElementById(`otp-input-${targetIndex}`)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    handlePastedCode(pasted);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        prevInput?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid registered email address.');
      setIsEditingEmail(true);
      return;
    }

    const fullCode = otp.join('');
    if (fullCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    const res = await verifyOtp(email.trim(), fullCode);
    setIsVerifying(false);

    if (res.success) {
      navigate('/farmer', {
        state: { welcomeMessage: 'Email verified successfully! Welcome to your SmartProcure portal.' },
        replace: true,
      });
    } else {
      setError(res.error || 'Verification failed. Please check the 6-digit code and try again.');
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address to receive the verification code.');
      setIsEditingEmail(true);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsResending(true);

    const res = await resendOtp(email.trim());
    setIsResending(false);

    if (res.success) {
      setResendTimer(60);
      setSuccessMessage(`New 6-digit code sent to ${email.trim()} from ${SMARTPROCURE_SENDER_IDENTITY.formatted}.`);
    } else {
      setError(res.error || 'Failed to resend verification code. Please wait a moment and try again.');
    }
  };

  const isOtpComplete = otp.every((d) => d.length === 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <SmartProcureLogo size={44} />
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Smart<span className="text-emerald-700">Procure</span>
            </span>
          </Link>
          <p className="text-xs text-slate-500 font-medium">
            National Agricultural Digital Procurement Platform
          </p>
        </div>

        {/* Verification Card */}
        <Card className="shadow-xl border-slate-200 bg-white">
          <CardHeader className="text-center pb-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200/80 shadow-inner">
              <Mail className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-900">
              Verify your email
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              We&apos;ve sent a 6-digit verification code to:
            </CardDescription>

            {/* Recipient Email Display & Editor */}
            <div className="mt-2 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 max-w-full">
              {isEditingEmail ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="h-7 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:border-emerald-600"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(false)}
                    className="text-[11px] text-emerald-700 font-bold hover:underline"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <span className="truncate max-w-[220px]">{email || 'Not provided'}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(true)}
                    className="text-slate-400 hover:text-emerald-700 p-0.5"
                    title="Change email address"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <Alert variant="destructive" title="Verification Issue">
                {error}
              </Alert>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              {/* OTP Input Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 text-center">
                  Enter verification code:
                </label>
                <div className="flex justify-center items-center gap-2 sm:gap-2.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      disabled={isVerifying}
                      className={`w-11 sm:w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-150 focus:outline-none ${
                        digit
                          ? 'border-emerald-600 bg-emerald-50/40 text-slate-900 ring-2 ring-emerald-100'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                      } disabled:bg-slate-50 disabled:opacity-75`}
                    />
                  ))}
                </div>
              </div>

              {/* Sender & Delivery Notice */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Official SmartProcure Sender</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Dispatched from <strong>{SMARTPROCURE_SENDER_IDENTITY.formatted}</strong>. The code is valid for 60 minutes. If not in your primary inbox, please check your spam or updates folder.
                </p>
              </div>

              {/* Verify Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isVerifying}
                disabled={!isOtpComplete || isVerifying}
                className="w-full justify-center gap-2 font-bold text-base shadow-md disabled:opacity-60"
              >
                <span>{isVerifying ? 'Verifying Code...' : 'Verify Email'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Resend Section */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span>Didn&apos;t receive the code?</span>
                {resendTimer > 0 ? (
                  <span className="text-slate-500 font-medium">
                    Resend in <strong className="text-emerald-700 font-bold">{resendTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 focus:outline-none"
                  >
                    <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isResending ? 'Sending...' : 'Resend Code'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Link to="/login" className="text-slate-500 hover:text-slate-800 hover:underline">
                  Back to Login
                </Link>
                <span className="text-slate-300">&bull;</span>
                <Link to="/register" className="text-emerald-700 font-semibold hover:underline">
                  New Registration
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Helpline */}
        <div className="text-center text-xs text-slate-500">
          <span>Need help? National Kisan Helpline: </span>
          <strong className="text-slate-700">{SMARTPROCURE_SENDER_IDENTITY.helpline}</strong>
        </div>
      </div>
    </div>
  );
};
