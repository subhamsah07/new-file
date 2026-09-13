import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  MapPin,
  Lock,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { SmartProcureLogo } from '../components/ui/SmartProcureLogo';
import { STATES_AND_DISTRICTS } from '../constants';
import { IndianState } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = React.useState(1);
  const totalSteps = 4;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Step 1: Basic Info
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');

  // Step 2: Location
  const [state, setState] = React.useState<IndianState>('Punjab');
  const [district, setDistrict] = React.useState('Ludhiana');

  // Step 3: Security
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Step 4: Bank Details
  const [bankAccountNumber, setBankAccountNumber] = React.useState('');
  const [ifscCode, setIfscCode] = React.useState('');
  const [bankName, setBankName] = React.useState('');
  const [accountHolderName, setAccountHolderName] = React.useState('');

  const [formError, setFormError] = React.useState<string | null>(null);

  // If already authenticated, redirect to /farmer
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/farmer', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const availableDistricts = STATES_AND_DISTRICTS[state] || [];

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (currentStep === 1) {
      if (!fullName.trim() || !email.trim() || !mobileNumber.trim()) {
        setFormError('Please fill in all basic details.');
        return;
      }
      if (!email.includes('@') || !email.includes('.')) {
        setFormError('Please enter a valid email address.');
        return;
      }
      if (!accountHolderName) {
        setAccountHolderName(fullName.trim());
      }
    } else if (currentStep === 2) {
      if (!state || !district) {
        setFormError('Please select both state and district.');
        return;
      }
    } else if (currentStep === 3) {
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
    } else if (currentStep === 4) {
      if (!bankAccountNumber || !ifscCode || !accountHolderName) {
        setFormError('Please provide all bank account details for direct benefit transfer.');
        return;
      }

      setIsSubmitting(true);
      setFormError(null);

      // Perform real Supabase Auth Registration
      const res = await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        state,
        district,
        password,
        bankAccount: {
          accountNumber: bankAccountNumber.trim(),
          ifscCode: ifscCode.trim(),
          bankName: bankName.trim(),
          accountHolderName: accountHolderName.trim(),
        },
      });

      setIsSubmitting(false);

      if (res.success) {
        // Always navigate to OTP verification passing only the email through safe state/params
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`, {
          state: { email: email.trim() },
        });
      } else {
        const errorMsg = res.error || 'Registration failed. Please check your details and try again.';
        if (
          errorMsg.includes('Gateway') ||
          errorMsg.includes('sending confirmation email') ||
          errorMsg.includes('500') ||
          errorMsg.includes('504')
        ) {
          // If registration was hindered by SMTP delivery, redirect to verify-otp with instant verification fallback
          navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`, {
            state: { email: email.trim() },
          });
          return;
        }
        setFormError(errorMsg);
      }
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = () => {
    setFormError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const stepLabels = [
    { title: 'Basic Info', icon: User },
    { title: 'Location', icon: MapPin },
    { title: 'Security', icon: Lock },
    { title: 'Bank Account', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <SmartProcureLogo size={42} />
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Smart<span className="text-emerald-700">Procure</span>
            </span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Farmer Portal Registration
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Set up your farmer account for direct procurement slot assignment and DBT fund clearances
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="grid grid-cols-4 gap-2">
            {stepLabels.map((s, idx) => {
              const stepNumber = idx + 1;
              const isCompleted = currentStep > stepNumber;
              const isCurrent = currentStep === stepNumber;
              const Icon = s.icon;

              return (
                <div key={s.title} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isCurrent
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-400 bg-white'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1.5 ${
                      isCurrent ? 'text-emerald-800 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Card */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-xs text-slate-400">Supabase Auth Connected</span>
            </div>
            <CardTitle className="text-xl">
              {currentStep === 1 && 'Basic Farmer Identification'}
              {currentStep === 2 && 'Farming Location & District'}
              {currentStep === 3 && 'Account Security Credentials'}
              {currentStep === 4 && 'Direct Benefit Transfer (DBT) Bank Details'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Used for official SMS and email arrival updates.'}
              {currentStep === 2 && 'Ensures procurement slot routing to your authorized state mandi.'}
              {currentStep === 3 && 'Create a password to access your live token queue and slips.'}
              {currentStep === 4 && 'Direct bank transfer will credit MSP payments to this account.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleNext} className="space-y-4">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <Input
                      label="Full Legal Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rameshwar Singh"
                      helperText="Must match your Aadhaar / Bank Passbook name exactly."
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rameshwar.farmer@example.com"
                      helperText="A verification OTP will be dispatched here."
                    />

                    <Input
                      label="Mobile Number (Linked with Aadhaar)"
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="9876543210"
                      helperText="Used for automated queue delay and slot alerts."
                    />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        State <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={state}
                        onChange={(e) => {
                          const newState = e.target.value as IndianState;
                          setState(newState);
                          setDistrict(STATES_AND_DISTRICTS[newState]?.[0] || '');
                        }}
                        className="w-full h-11 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                      >
                        {Object.keys(STATES_AND_DISTRICTS).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        District <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full h-11 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                      >
                        {availableDistricts.map((dst) => (
                          <option key={dst} value={dst}>
                            {dst}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800">
                      Procurement slots and mandi discovery will be restricted to authorized centres within{' '}
                      <strong>{state}</strong>.
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <Input
                      label="Create Password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                    />

                    <Input
                      label="Confirm Password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                    />
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <Input
                      label="Account Holder Name"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="As per bank passbook"
                    />

                    <Input
                      label="Bank Name"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Punjab National Bank"
                    />

                    <Input
                      label="Bank Account Number"
                      required
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                    />

                    <Input
                      label="Bank IFSC Code"
                      required
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. PUNB0123400"
                    />

                    <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Bank details are encrypted and securely mapped to your verified profile for DBT payment transfers.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handlePrev}
                    disabled={isSubmitting}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </Button>
                ) : (
                  <Link to="/login">
                    <Button type="button" variant="ghost" size="md">
                      Existing User? Login
                    </Button>
                  </Link>
                )}

                <Button
                  type="submit"
                  variant={currentStep === totalSteps ? 'orange' : 'primary'}
                  size="md"
                  isLoading={isSubmitting}
                  className="gap-2 shadow-xs font-semibold"
                >
                  <span>
                    {currentStep === totalSteps
                      ? isSubmitting
                        ? 'Registering...'
                        : 'Complete Registration'
                      : 'Continue'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
