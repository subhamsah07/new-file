import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarPlus,
  QrCode,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Mail,
  Truck,
  Building2,
  UserCheck,
  Scale,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const Home: React.FC = () => {
  const { t } = useTranslation();

  // Day / Night Theme Management
  const [darkMode, setDarkMode] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('smartprocure_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smartprocure_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smartprocure_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  // 8-step visual journey (with warm orange & yellow theme)
  const farmerJourneySteps = [
    {
      num: 1,
      title: t('landing.step1Title', 'Registration'),
      desc: t('landing.step1Desc', 'Verify mobile number and link verified bank account.'),
      icon: UserCheck,
    },
    {
      num: 2,
      title: t('landing.step2Title', 'Select Centre & Commodity'),
      desc: t('landing.step2Desc', 'Choose nearest mandi and specify expected crop quantity.'),
      icon: Building2,
    },
    {
      num: 3,
      title: t('landing.step3Title', 'Book Appointment'),
      desc: t('landing.step3Desc', 'Pick your preferred delivery date with automated slot allocation.'),
      icon: CalendarPlus,
    },
    {
      num: 4,
      title: t('landing.step4Title', 'Receive Token & QR'),
      desc: t('landing.step4Desc', 'Get digital gate pass with allocated arrival window and QR pass.'),
      icon: QrCode,
    },
    {
      num: 5,
      title: t('landing.step5Title', 'Arrive at Centre'),
      desc: t('landing.step5Desc', 'Report to the mandi weighbridge at your assigned time window.'),
      icon: Truck,
    },
    {
      num: 6,
      title: t('landing.step6Title', 'Live Queue Tracking'),
      desc: t('landing.step6Desc', 'Monitor real-time position, velocity, and vehicles ahead.'),
      icon: Activity,
    },
    {
      num: 7,
      title: t('landing.step7Title', 'Procurement Completed'),
      desc: t('landing.step7Desc', 'Digital gross/tare weight logging and immediate J-Form slip.'),
      icon: Scale,
    },
    {
      num: 8,
      title: t('landing.step8Title', 'Track Payment'),
      desc: t('landing.step8Desc', 'Direct Benefit Transfer (DBT) directly into your bank account.'),
      icon: CreditCard,
    },
  ];

  // Exactly 6-block Process Flowchart
  const processFlowSteps = [
    {
      stepNumber: '01',
      title: t('landing.flowBook', 'Slot Booking'),
      desc: 'Choose your crop, quantity, and convenient delivery date.',
      icon: CalendarPlus,
      colorClass: 'bg-blue-600 text-white',
      badgeBg: 'bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-800',
      glowBorder: 'hover:border-blue-500',
    },
    {
      stepNumber: '02',
      title: t('landing.flowScheduling', 'Smart Scheduling'),
      desc: 'Dynamic algorithm calculates gate window to prevent overcrowding.',
      icon: Zap,
      colorClass: 'bg-violet-600 text-white',
      badgeBg: 'bg-violet-100 text-violet-950 dark:bg-violet-950 dark:text-violet-200 border-violet-300 dark:border-violet-800',
      glowBorder: 'hover:border-violet-500',
    },
    {
      stepNumber: '03',
      title: t('landing.flowToken', 'Digital Token'),
      desc: 'Instant 6-digit gate code and secure QR pass delivered to phone.',
      icon: QrCode,
      colorClass: 'bg-amber-600 text-white',
      badgeBg: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      glowBorder: 'hover:border-amber-500',
    },
    {
      stepNumber: '04',
      title: t('landing.flowCheckIn', 'Mandi Check-In'),
      desc: 'Seamless entry scan at weighbridge gate without overnight waiting.',
      icon: Truck,
      colorClass: 'bg-emerald-600 text-white',
      badgeBg: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
      glowBorder: 'hover:border-emerald-500',
    },
    {
      stepNumber: '05',
      title: t('landing.flowProcurement', 'Weighing & Quality'),
      desc: 'Precise electronic scale reading, moisture test, and digital J-Form.',
      icon: Scale,
      colorClass: 'bg-cyan-600 text-white',
      badgeBg: 'bg-cyan-100 text-cyan-950 dark:bg-cyan-950 dark:text-cyan-200 border-cyan-300 dark:border-cyan-800',
      glowBorder: 'hover:border-cyan-500',
    },
    {
      stepNumber: '06',
      title: t('landing.flowPayment', 'Direct Bank Payout'),
      desc: 'MSP transfer deposited directly via DBT into verified account.',
      icon: CreditCard,
      colorClass: 'bg-rose-600 text-white',
      badgeBg: 'bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800',
      glowBorder: 'hover:border-rose-500',
    },
  ];

  // Core Benefits (Expanded to exactly 6 blocks for an even 3x2 grid, each with a colorful logo)
  const benefits = [
    {
      title: t('landing.benefit1Title', 'Reduced Waiting Time'),
      desc: t(
        'landing.benefit1Desc',
        'Eliminate 14+ hour overnight tractor queue-ups. Arrive right when the weighbridge is ready for you.'
      ),
      icon: Clock,
      stat: '75% Faster',
      iconBg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
      statColor: 'text-amber-700 dark:text-amber-400',
    },
    {
      title: t('landing.benefit2Title', 'Transparent Queue'),
      desc: t(
        'landing.benefit2Desc',
        'Algorithmic token sequencing prevents queue jumping, middlemen bias, and arbitrary delays.'
      ),
      icon: ShieldCheck,
      stat: '100% Fair',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
      statColor: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      title: t('landing.benefit3Title', 'Real-Time Updates'),
      desc: t(
        'landing.benefit3Desc',
        'Live queue tracking dynamically recalculates your ETA based on active mandi unloading speed.'
      ),
      icon: TrendingUp,
      stat: 'Live ETA',
      iconBg: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
      statColor: 'text-blue-700 dark:text-blue-400',
    },
    {
      title: t('landing.benefit4Title', 'Hassle-Free Procurement'),
      desc: t(
        'landing.benefit4Desc',
        'Single digital pass replaces paper tokens. Weight logs and J-Forms generated instantly on completion.'
      ),
      icon: CheckCircle2,
      stat: 'Paperless',
      iconBg: 'bg-violet-100 dark:bg-violet-950/70 text-violet-800 dark:text-violet-300 border border-violet-300 dark:border-violet-800',
      statColor: 'text-violet-700 dark:text-violet-400',
    },
    {
      title: t('landing.benefit5Title', 'Payment Clarity'),
      desc: t(
        'landing.benefit5Desc',
        'Instant digital receipts with real-time DBT fund clearance tracking directly to your registered bank.'
      ),
      icon: CreditCard,
      stat: 'Direct Bank Credit',
      iconBg: 'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800',
      statColor: 'text-teal-700 dark:text-teal-400',
    },
    {
      title: t('landing.benefit6Title', 'Zero Middlemen'),
      desc: t(
        'landing.benefit6Desc',
        'Direct farmer-to-mandi procurement eliminates unauthorized agents, illicit cuts, and unfair bias.'
      ),
      icon: UserCheck,
      stat: '100% Direct MSP',
      iconBg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
      statColor: 'text-rose-700 dark:text-rose-400',
    },
  ];

  // FAQ list
  const faqs = [
    {
      q: t('landing.faq1Q', 'How do I register as a farmer?'),
      a: t(
        'landing.faq1A',
        'Click on "Register as New Farmer" on the home page. Enter your mobile number, verify via OTP, and enter your district, landholding, and bank account details for direct payments.'
      ),
    },
    {
      q: t('landing.faq2Q', "What if I can't log in?"),
      a: t(
        'landing.faq2A',
        'Ensure you enter the mobile number registered during onboarding. You can log in using either your secure password or instant SMS OTP verification.'
      ),
    },
    {
      q: t('landing.faq3Q', 'How do I book a procurement appointment?'),
      a: t(
        'landing.faq3A',
        'Log in to your Farmer Dashboard, click "Book Appointment", choose your crop (e.g. Wheat, Paddy, Mustard, Maize), specify estimated quintals, and pick an available date.'
      ),
    },
    {
      q: t('landing.faq4Q', 'Where do I find my token and QR code?'),
      a: t(
        'landing.faq4A',
        'Immediately after booking, your secure 6-character token (e.g., SP7K4Q) and scannable QR pass are available directly on your Farmer Dashboard under Active Bookings.'
      ),
    },
    {
      q: t('landing.faq5Q', 'How can I see my live queue status?'),
      a: t(
        'landing.faq5A',
        'On your scheduled appointment day, go to the "Live Queue Tracker" page. It shows exactly how many vehicles are ahead of you, current weighbridge speed, and your estimated wait time.'
      ),
    },
    {
      q: t('landing.faq6Q', 'What happens if my payment is delayed?'),
      a: t(
        'landing.faq6A',
        'Procurement payments are issued via Direct Benefit Transfer (DBT) within 48 to 72 hours of weighing. You can track status on your dashboard or contact our support team.'
      ),
    },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-200 flex flex-col font-sans ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#FAFAF9] text-slate-900'
      }`}
    >
      {/* 1. TOP NAVIGATION BAR */}
      <Navbar darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main className="grow">
        {/* 2. HERO SECTION: CENTERED HEADLINE + CENTERED MAIZE IMAGE + WORKING FARMER IMAGE BELOW */}
        <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20">
          {/* Subtle Ambient Background Gradients */}
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
              darkMode
                ? 'opacity-30 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-950/40 via-slate-950 to-slate-950'
                : 'opacity-40 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-100/60 via-yellow-50/40 to-transparent'
            }`}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            {/* Centered Top Heading Content */}
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
              {/* Government / Agri Initiative Badge */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border tracking-wide mb-4 ${
                  darkMode
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                    : 'bg-amber-100/90 text-amber-950 border-amber-300 shadow-2xs'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{t('landing.heroBadge', 'Smart Agriculture Mandi Queue Management')}</span>
              </div>

              {/* Primary Hero Headline */}
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15] mb-4 ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                {t(
                  'landing.heroHeadline',
                  'Smart Mandi Scheduling. Transparent From Arrival to Payout.'
                )}
              </h1>

              {/* Short Clear Description - Darkened text for high contrast */}
              <p
                className={`text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-medium ${
                  darkMode ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {t(
                  'landing.heroSubtitle',
                  'Eliminate hours & days of mandi queues. SmartProcure assigns precise gate arrival windows, monitors live queue velocity, and guarantees transparent MSP settlements directly to your bank account.'
                )}
              </p>
            </div>

            {/* Centered Enlarged Maize Image with 2 CTA Buttons Inside (Quote removed) */}
            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 dark:border-slate-800 group">
                {/* Maize Field Image */}
                <img
                  src="/pexels-todd-trapani-488382-1382102.jpg"
                  alt="Golden maize crop field in agricultural India"
                  className="w-full h-[380px] sm:h-[440px] md:h-[480px] object-cover transition-transform duration-700 group-hover:scale-103"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />

                {/* Dark Gradient Overlay for optimal legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

                {/* Top Badge Overlay */}
                <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Real-Time Mandi Gate Scheduling</span>
                  </div>

                  <span className="hidden sm:inline-block text-xs font-bold text-amber-300 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-md">
                    MSP Guaranteed • Direct DBT
                  </span>
                </div>

                {/* 2 Primary CTA Buttons Inside Maize Image (No Quote) */}
                <div className="absolute bottom-6 sm:bottom-10 left-4 sm:left-8 right-4 sm:right-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  {/* CTA 1: Book Appointment */}
                  <Link to="/dashboard/book" className="w-full sm:w-auto">
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-extrabold text-sm sm:text-base text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 transition-all shadow-xl hover:shadow-2xl cursor-pointer border border-amber-400/50"
                    >
                      <CalendarPlus className="h-5 w-5 shrink-0" />
                      <span>{t('landing.bookAppointment', 'Book Appointment')}</span>
                      <ArrowRight className="h-5 w-5 shrink-0" />
                    </button>
                  </Link>

                  {/* CTA 2: Register as New Farmer */}
                  <Link to="/register" className="w-full sm:w-auto">
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-extrabold text-sm sm:text-base text-slate-950 bg-white hover:bg-slate-100 active:bg-slate-200 transition-all shadow-xl hover:shadow-2xl cursor-pointer border border-white"
                    >
                      <UserCheck className="h-5 w-5 shrink-0 text-amber-600" />
                      <span>{t('landing.registerFarmer', 'Register as New Farmer')}</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Working Farmer Image Below that */}
            <div className="max-w-5xl mx-auto mt-8 sm:mt-10">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/90 dark:border-slate-800 group">
                <img
                  src="/pexels-hson-32954665.jpg"
                  alt="Hardworking farmer harvesting crop in the field"
                  className="w-full h-56 sm:h-64 md:h-72 object-cover transition-transform duration-700 group-hover:scale-102"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />

                {/* Atmospheric gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                {/* Bottom caption tribute with high contrast dark/light text */}
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold tracking-wide text-amber-300 uppercase drop-shadow-sm">
                      Honoring India&apos;s Annadata
                    </div>
                    <p className="text-xs sm:text-sm text-white font-medium drop-shadow-sm max-w-xl">
                      Built to protect farmers from endless queues, unfair middleman commissions, and arbitrary gate delays.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/25 text-white shadow-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      100% Direct MSP Payout
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. "HOW TO USE SMARTPROCURE" (Updated with Orange & Yellow Visual Theme) */}
        <section
          id="how-to-use"
          className={`py-16 sm:py-20 border-t transition-colors duration-200 ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-[#FFFDF7] border-amber-200/50'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <span
                className={`inline-block text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border mb-2 shadow-2xs ${
                  darkMode
                    ? 'bg-amber-950/90 text-amber-300 border-amber-700'
                    : 'bg-amber-100 text-amber-950 border-amber-300'
                }`}
              >
                Orange & Gold Harvest Workflow
              </span>
              <h2
                className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-1 mb-3 ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                {t('landing.howToUseTitle', 'How to Use SmartProcure')}
              </h2>
              <p
                className={`text-sm sm:text-base font-semibold ${
                  darkMode ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                {t(
                  'landing.howToUseSubtitle',
                  'A transparent 8-step journey from home registration to direct bank payout.'
                )}
              </p>
            </div>

            {/* 8-Step Grid with warm orange & yellow accents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {farmerJourneySteps.map((step) => {
                const IconComponent = step.icon;
                return (
                  <div
                    key={step.num}
                    className={`relative p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 group ${
                      darkMode
                        ? 'bg-slate-900/90 border-amber-950/70 hover:border-amber-600 hover:shadow-lg hover:shadow-amber-950/30'
                        : 'bg-white border-amber-200/90 hover:border-orange-400 hover:shadow-md hover:shadow-amber-500/10'
                    }`}
                  >
                    {/* Top Row: Orange/Yellow Step Badge & Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                        Step 0{step.num}
                      </span>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform ${
                          darkMode
                            ? 'bg-amber-950/80 border-amber-800 text-amber-400'
                            : 'bg-amber-100 border-amber-300 text-amber-900'
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </div>

                    <h3
                      className={`text-base font-bold mb-1.5 transition-colors ${
                        darkMode
                          ? 'text-white group-hover:text-amber-400'
                          : 'text-slate-950 group-hover:text-amber-700'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-xs leading-relaxed font-semibold ${
                        darkMode ? 'text-slate-300' : 'text-slate-800'
                      }`}
                    >
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. "HOW SMARTPROCURE WORKS" (Flow Chart / Process with Exactly 6 Blocks & Colorful Logos) */}
        <section
          id="how-it-works"
          className={`py-16 sm:py-20 border-t transition-colors duration-200 ${
            darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/80'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <span
                className={`text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border inline-block mb-2 ${
                  darkMode
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                    : 'text-emerald-950 bg-emerald-100 border-emerald-300'
                }`}
              >
                Process Flowchart
              </span>
              <h2
                className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-1 mb-3 ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                {t('landing.howItWorksTitle', 'How SmartProcure Works')}
              </h2>
              <p
                className={`text-sm sm:text-base font-semibold ${
                  darkMode ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                {t(
                  'landing.howItWorksSubtitle',
                  'A synchronized digital pipeline connecting farmers directly with government procurement mandis.'
                )}
              </p>
            </div>

            {/* Exactly 6 Blocks Flowchart Grid with connecting indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
              {processFlowSteps.map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div
                    key={step.stepNumber}
                    className={`relative p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 ${step.glowBorder} ${
                      darkMode
                        ? 'bg-slate-900 border-slate-800 hover:shadow-lg'
                        : 'bg-white border-slate-300 shadow-2xs hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Colorful Logo Icon & Step Number */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs ${step.colorClass}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${step.badgeBg}`}>
                          Phase {step.stepNumber}
                        </span>
                        {idx < 5 && (
                          <span className={`hidden lg:inline-block ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </div>

                    <h3
                      className={`text-lg font-bold mb-2 ${
                        darkMode ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-xs sm:text-sm leading-relaxed font-semibold ${
                        darkMode ? 'text-slate-300' : 'text-slate-800'
                      }`}
                    >
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. "WHY SMARTPROCURE" (Even 6 Blocks with Colorful Logos) */}
        <section
          id="why-smartprocure"
          className={`py-16 sm:py-20 border-t transition-colors duration-200 ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <span
                className={`text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border inline-block mb-2 ${
                  darkMode
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                    : 'text-emerald-950 bg-emerald-100 border-emerald-300'
                }`}
              >
                Core Advantages
              </span>
              <h2
                className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-1 mb-3 ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                {t('landing.whyTitle', 'Why SmartProcure?')}
              </h2>
              <p
                className={`text-sm sm:text-base font-semibold ${
                  darkMode ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                {t(
                  'landing.whySubtitle',
                  'Engineered specifically to dismantle mandi congestion and restore dignity to farmers.'
                )}
              </p>
            </div>

            {/* Even 3x2 Grid (6 Blocks) with colorful logos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b) => {
                const IconComponent = b.icon;
                return (
                  <div
                    key={b.title}
                    className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                      darkMode
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-md'
                        : 'bg-[#F8FAFC] border-slate-300 hover:border-slate-400 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Colorful Logo Badge */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-2xs ${b.iconBg}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>

                      <h3
                        className={`text-lg font-bold mb-2 ${
                          darkMode ? 'text-white' : 'text-slate-950'
                        }`}
                      >
                        {b.title}
                      </h3>
                      <p
                        className={`text-xs sm:text-sm leading-relaxed font-semibold ${
                          darkMode ? 'text-slate-300' : 'text-slate-800'
                        }`}
                      >
                        {b.desc}
                      </p>
                    </div>

                    <div
                      className={`pt-5 mt-4 border-t flex items-center justify-between ${
                        darkMode ? 'border-slate-800' : 'border-slate-200'
                      }`}
                    >
                      <span className={`text-xs font-black ${b.statColor}`}>
                        {b.stat}
                      </span>
                      <CheckCircle2 className={`h-4 w-4 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. FAQ SECTION (Accordion Style) */}
        <section
          id="faq"
          className={`py-16 sm:py-20 border-t transition-colors duration-200 ${
            darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/50 border-slate-200/80'
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span
                className={`text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border inline-block mb-2 ${
                  darkMode
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                    : 'text-emerald-950 bg-emerald-100 border-emerald-300'
                }`}
              >
                Got Questions?
              </span>
              <h2
                className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mt-1 mb-3 ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                {t('landing.faqTitle', 'Frequently Asked Questions')}
              </h2>
              <p
                className={`text-sm sm:text-base font-semibold ${
                  darkMode ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                {t(
                  'landing.faqSubtitle',
                  'Everything you need to know about slot booking, token passes, and payout verification.'
                )}
              </p>
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className={`rounded-xl border transition-colors ${
                      darkMode
                        ? 'bg-slate-900/90 border-slate-800'
                        : 'bg-white border-slate-300 shadow-2xs'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className={`w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base cursor-pointer focus:outline-hidden ${
                        darkMode ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      <span className={isOpen ? (darkMode ? 'text-emerald-400' : 'text-emerald-700') : ''}>
                        {faq.q}
                      </span>
                      <div className={`shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div
                            className={`px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm leading-relaxed border-t font-semibold ${
                              darkMode
                                ? 'border-slate-800 text-slate-300'
                                : 'border-slate-200 text-slate-800'
                            }`}
                          >
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. CONTACT US & SUPPORT */}
        <section
          id="contact"
          className={`py-14 sm:py-16 border-t transition-colors duration-200 ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div
              className={`p-6 sm:p-8 rounded-2xl border text-center ${
                darkMode
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-gradient-to-b from-white to-emerald-50/30 border-slate-200 shadow-2xs'
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <Mail className="h-6 w-6" />
              </div>
              <h3
                className={`text-xl sm:text-2xl font-black mb-2 ${
                  darkMode ? 'text-white' : 'text-slate-950'
                }`}
              >
                {t('landing.contactTitle', 'Contact Us')}
              </h3>
              <p
                className={`text-xs sm:text-sm max-w-md mx-auto mb-5 font-semibold ${
                  darkMode ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                {t(
                  'landing.contactSubtitle',
                  'Have questions, feedback, or need technical assistance with mandi scheduling?'
                )}
              </p>

              <a
                href="mailto:smartprocurementsystem@gmail.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs"
              >
                <Mail className="h-4 w-4" />
                <span>smartprocurementsystem@gmail.com</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* 8. SIH / TEAM SECTION (Small, polished, professional) */}
        <section
          className={`py-8 border-t transition-colors duration-200 ${
            darkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-50 border-slate-200/60'
          }`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  SmartProcure
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t('landing.sihPrototype', 'Smart India Hackathon Prototype')}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">{t('landing.teamLabel', 'Team')}:</span>
                <span className="px-2.5 py-1 rounded-md font-bold tracking-wider bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400">
                  {t('landing.teamName', 'INNOVEX')}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 9. FOOTER */}
      <Footer darkMode={darkMode} />
    </div>
  );
};
