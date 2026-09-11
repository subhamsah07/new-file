import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Shield, Menu, X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, SupportedLanguage } from '../../i18n';
import { Button } from '../ui/Button';
import { SmartProcureLogo } from '../ui/SmartProcureLogo';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);

  const currentLang = (i18n.language || 'en') as SupportedLanguage;

  const handleLanguageSelect = (code: SupportedLanguage) => {
    i18n.changeLanguage(code);
    setLangDropdownOpen(false);
  };

  const navLinks = [
    { label: t('nav.home', 'Home'), href: '/' },
    { label: t('nav.howItWorks', 'How It Works'), href: '/#how-it-works' },
    { label: t('nav.whySmartProcure', 'Why SmartProcure'), href: '/#why-smartprocure' },
    { label: t('nav.liveQueue', 'Live Queue'), href: '/#live-queue' },
    { label: t('nav.help', 'Help & Support'), href: '/#help' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      {/* Top Official Banner */}
      <div className="bg-emerald-950 text-emerald-100 text-xs px-4 py-1.5 border-b border-emerald-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-medium tracking-wide text-emerald-200 text-[11px] sm:text-xs">
              <Shield className="h-3 w-3 text-emerald-400 shrink-0" />
              GOVERNMENT OF INDIA • MINISTRY OF AGRICULTURE & FARMERS WELFARE
            </span>
            <span className="text-emerald-500/60 hidden sm:inline">|</span>
            <span className="text-emerald-300/80 hidden md:inline text-[11px]">
              National Agricultural Digital Procurement & Queue Transparency
            </span>
          </div>

          <div className="text-[11px] text-emerald-300/90 font-medium flex items-center gap-2.5">
            <span>Kisan Toll-Free: <strong>1800-180-1551</strong></span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="transition-transform group-hover:scale-105 duration-200">
            <SmartProcureLogo size={42} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Smart<span className="text-emerald-700">Procure</span>
              </span>
              <span className="hidden sm:inline-block bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                SIH 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium -mt-0.5">
              Less Waiting. More Farming.
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-emerald-700 transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <span>{LANGUAGES.find(l => l.code === currentLang)?.nativeName || 'English'}</span>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-50 text-xs">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      currentLang === lang.code ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/admin/login"
            id="nav-admin-portal-link"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-all shadow-2xs group"
            title="State Administration Portal"
          >
            <Shield className="h-3.5 w-3.5 text-emerald-700 group-hover:scale-105 transition-transform shrink-0" />
            <span>Admin Portal</span>
          </Link>

          <Link to="/login">
            <Button variant="outline" size="sm">
              {t('nav.login', 'Farmer Login')}
            </Button>
          </Link>

          <Link to="/dashboard">
            <Button variant="primary" size="sm" className="gap-1.5">
              <span>{t('nav.dashboard', 'Dashboard')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link to="/dashboard">
            <Button variant="primary" size="sm" className="text-xs px-2.5 h-8">
              Dashboard
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  handleLanguageSelect(lang.code);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-1.5 rounded text-xs text-left border ${
                  currentLang === lang.code
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>

          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-emerald-700" />
              <span>Admin Portal</span>
            </Link>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                {t('nav.login', 'Farmer Login')}
              </Button>
            </Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" className="w-full justify-center">
                {t('nav.register', 'Register as Farmer')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
