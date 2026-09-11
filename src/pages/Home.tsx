import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarPlus,
  Compass,
  QrCode,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Phone,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  FileCheck2,
  Scale
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const Home: React.FC = () => {
  const { t } = useTranslation();

  const workflowSteps = [
    {
      step: '01',
      title: 'Farmer Registration',
      hindi: 'किसान पंजीकरण',
      desc: 'Verify mobile & email, register verified bank account for direct benefit credit.',
      icon: ShieldCheck,
    },
    {
      step: '02',
      title: 'Find Procurement Centre',
      hindi: 'निकटतम खरीद केंद्र',
      desc: 'Discover mandis with real-time intake capacity, current wait velocity, and operational status.',
      icon: Compass,
    },
    {
      step: '03',
      title: 'Smart Slot Allocation',
      hindi: 'स्मार्ट स्लॉट आवंटन',
      desc: 'Intelligent scheduling algorithm factors in daily mandi capacity and 14:00–15:00 lunch break.',
      icon: CalendarPlus,
    },
    {
      step: '04',
      title: 'Receive Secure Token',
      hindi: 'सुरक्षित 6-अंकीय टोकन',
      desc: 'Receive random 6-character identifier (e.g. SP7K4Q) and opaque QR pass without sensitive info.',
      icon: QrCode,
    },
    {
      step: '05',
      title: 'Track Live Queue & ETA',
      hindi: 'लाइव कतार एवं आगमन समय',
      desc: 'Track queue position in real time. Dynamic ETA updates tell you exactly when to leave home.',
      icon: Activity,
    },
    {
      step: '06',
      title: 'Procurement Inspection',
      hindi: 'खरीद एवं वजन सत्यापन',
      desc: 'Transparent weighbridge gross/tare logging and instant J-Form receipt generation.',
      icon: Scale,
    },
    {
      step: '07',
      title: 'Direct Benefit Payment',
      hindi: 'सीधा बैंक खाता भुगतान',
      desc: 'Direct Benefit Transfer (DBT) credit tracked end-to-end to your verified bank account.',
      icon: CreditCard,
    },
  ];

  const whyPoints = [
    {
      title: 'Zero Wastage of Waiting Time',
      desc: 'Mandi waiting times drop from 14+ hours to under 45 minutes. Arrive when your turn is scheduled.',
      icon: Clock,
      stat: '75% Faster',
    },
    {
      title: 'Transparent Queue Intelligence',
      desc: 'No manual favoritism or arbitrary queue jumping. Every token is processed in verified order.',
      icon: ShieldCheck,
      stat: '100% Trackable',
    },
    {
      title: 'Dynamic ETA That Responds to Mandi Reality',
      desc: 'If processing at a mandi slows down, your expected arrival time automatically shifts back.',
      icon: TrendingUp,
      stat: 'Adaptive ETA',
    },
    {
      title: 'Direct Benefit Payment Transparency',
      desc: 'Track electronic weighbridge slip to treasury fund clearance with instant status notifications.',
      icon: CreditCard,
      stat: 'Verified DBT',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white py-12 lg:py-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* LEFT COLUMN: Messaging and CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-6 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/90 text-emerald-900 text-xs font-semibold border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Smart Agriculture Procurement Initiative</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  Less Waiting. <br />
                  <span className="text-emerald-700">More Farming.</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  Don&apos;t make farmers wait for the queue. Let the queue tell farmers when to arrive.
                  SmartProcure coordinates transparent slot allocation, live mandi velocity, and dynamic ETAs
                  so you spend your precious time on your farm, not waiting in endless mandi queues.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                <Link to="/register">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto text-base gap-2 shadow-md">
                    <span>Book a Procurement Slot</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link to="/dashboard/track">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base gap-2">
                    <Activity className="h-4 w-4 text-emerald-700" />
                    <span>Track My Token</span>
                  </Button>
                </Link>
              </div>

              {/* Trust markers */}
              <div className="pt-4 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="font-bold text-slate-900 text-base sm:text-lg">09:00–18:00</div>
                  <div className="text-xs text-slate-500">Mandi Hours (Lunch 2–3 PM)</div>
                </div>
                <div>
                  <div className="font-bold text-emerald-700 text-base sm:text-lg">6-Char</div>
                  <div className="text-xs text-slate-500">Unique Non-Seq Tokens</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base sm:text-lg">5 Major</div>
                  <div className="text-xs text-slate-500">MSP Foodgrains Supported</div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: Large Agriculture Photograph with subtle badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-6 relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 aspect-16/10 sm:aspect-16/11 group">
                <img
                  src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1600&auto=format&fit=crop"
                  alt="Golden wheat farmland and Indian agriculture field at sunrise"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                {/* Floating caption on image */}
                <div className="absolute bottom-4 left-4 right-4 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                      Kharif & Rabi Foodgrain Mandis
                    </span>
                    <span className="text-sm font-semibold text-white/95">
                      Empowering transparent state procurement
                    </span>
                  </div>
                  <span className="bg-emerald-900/80 backdrop-blur-xs text-emerald-200 text-xs px-2.5 py-1 rounded-md border border-emerald-500/30">
                    Live Velocity Tracking
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* COMPACT PRODUCT PREVIEW BELOW HERO */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-12 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-md"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  SmartProcure Queue Intelligence Engine &bull; Visual Concept Preview
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                [Architecture Preview: Mock Representation for Phase 1]
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 text-center">
              <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                <span className="text-xs text-slate-500 font-medium block mb-1">TOKEN</span>
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-800 tracking-wider">
                  SP7K4Q
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block mb-1">QUEUE POSITION</span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  6
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block mb-1">ESTIMATED WAIT</span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  42 min
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium block mb-1">EXPECTED</span>
                <span className="text-base sm:text-xl font-extrabold text-slate-900">
                  11:35–11:50 AM
                </span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 col-span-2 sm:col-span-1 flex flex-col justify-center">
                <span className="text-xs text-slate-500 font-medium block mb-1">STATUS</span>
                <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-sm sm:text-base">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Live
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 1: HOW SMARTPROCURE WORKS */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
              Structured Procurement Lifecycle
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How SmartProcure Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              From field registration to direct bank account deposit, every milestone is structured,
              transparent, and verifiable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        STEP {item.step}
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-emerald-700">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.hindi}</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {workflowSteps.slice(4, 7).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        STEP {item.step}
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-emerald-700">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.hindi}</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2: WHY SMARTPROCURE */}
      <section id="why-smartprocure" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
                Core Value Proposition
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Designed Around the Reality of Agricultural Procurement
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Traditional appointment systems fail in mandis because grain unloading and moisture testing
                unfold at variable speeds. SmartProcure measures real-time handling velocity, predicts bottlenecks,
                and respects mandatory scheduled pauses.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Mandatory Operating Hours Rule
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Centres operate from <strong>09:00 AM to 06:00 PM</strong> with a scheduled lunch break
                  from <strong>02:00 PM to 03:00 PM</strong>. SmartProcure&apos;s ETA algorithm strictly prevents
                  blind estimations through lunch hours.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {whyPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className="p-5 sm:p-6 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                          {point.stat}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900">{point.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{point.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: LIVE QUEUE CONCEPT DEMONSTRATION */}
      <section id="live-queue" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
              Live Queue Intelligence
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Live Queue Concept Demonstration
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Below is a visual concept of our Queue Intelligence algorithm.
              (Mock demonstration for evaluation; prepared for Supabase Realtime).
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl border-2 border-emerald-600/30 p-6 sm:p-8 shadow-lg">
            {/* Header with last updated notice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                  Ludhiana Central Mandi &bull; Yard 4
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Active Intake Velocity &bull; 22 mins/farmer
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Last updated: <strong>2 min ago</strong></span>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
              <div className="p-4 rounded-xl bg-slate-900 text-white text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Currently Serving
                </span>
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 block">
                  SP7K3M
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Weighbridge Bay 1</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                  Your Token
                </span>
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-800 mt-1 block">
                  SP7K4Q
                </span>
                <span className="text-[10px] text-emerald-700 font-bold mt-1 block">YOU (Position #6)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Farmers Ahead
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                  5
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">In holding yard</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Expected Time
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 block">
                  11:35–11:50 AM
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Wait: ~42 mins</span>
              </div>
            </div>

            {/* Sequence Ladder */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block mb-3">
                Token Queue Progression:
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-mono font-bold flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  SP7K3M (NOW SERVING)
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-300 font-mono text-slate-700">
                  SP7K3N
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-300 font-mono text-slate-700">
                  SP7K3P
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-300 font-mono text-slate-700">
                  SP7K3R
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2.5 py-1 rounded bg-white border border-slate-300 font-mono text-slate-700">
                  SP7K4A
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-3 py-1 rounded-lg bg-amber-100 border border-amber-300 font-mono font-bold text-amber-900">
                  SP7K4Q &larr; YOU
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HELP & CONTACT */}
      <section id="help" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1">Kisan Call Centre</h3>
              <p className="text-xs text-slate-600 mb-3">
                Dial toll-free nationwide for immediate support regarding slot re-scheduling or mandi delay advisories.
              </p>
              <div className="text-base font-extrabold text-emerald-800 font-mono">
                1800-180-1551
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1">Mandi Grievance Cell</h3>
              <p className="text-xs text-slate-600 mb-3">
                Report discrepancies regarding electronic weighbridge logs, FAQ moisture checks, or delayed payments.
              </p>
              <div className="text-sm font-semibold text-slate-800">
                grievance@smartprocure.gov.in
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-1">Operating Hours Notice</h3>
              <p className="text-xs text-slate-600 mb-3">
                Physical gate intake occurs between 09:00 AM – 06:00 PM. Verification operations pause for 60 mins during lunch.
              </p>
              <div className="text-xs font-semibold text-emerald-800">
                Shift 1: 09:00–14:00 | Shift 2: 15:00–18:00
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
