import * as React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Shield, Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, SupportedLanguage } from '../../i18n';
import { Button } from '../ui/Button';
import { SmartProcureLogo } from '../ui/SmartProcureLogo';

export interface NavbarProps {
  darkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode = false, onToggleTheme }) => {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);

  const currentLang = (i18n.language || 'en') as SupportedLanguage;

  const handleLanguageSelect = (code: SupportedLanguage) => {
    i18n.changeLanguage(code);
    setLangDropdownOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 backdrop-blur-md border-b ${
        darkMode
          ? 'bg-slate-950/90 border-slate-800/80 text-slate-100'
          : 'bg-white/90 border-slate-200/80 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group focus:outline-hidden">
          <div className="transition-transform group-hover:scale-105 duration-200 shrink-0">
            <SmartProcureLogo size={36} />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight">
            Smart<span className="text-emerald-600 dark:text-emerald-400">Procure</span>
          </span>
        </Link>

        {/* Center / Right: Desktop Actions */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-3">
          {/* Farmer Login */}
          <Link to="/login">
            <button
              type="button"
              className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors border ${
                darkMode
                  ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {t('landing.farmerLogin', 'Farmer Login')}
            </button>
          </Link>

          {/* Admin Login */}
          <Link to="/admin/login">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors border ${
                darkMode
                  ? 'border-slate-700/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-emerald-400'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50/50 hover:text-emerald-800 hover:border-emerald-200'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{t('landing.adminPortal', 'Admin Login')}</span>
            </button>
          </Link>

          {/* Farmer Dashboard */}
          <Link to="/dashboard">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs hover:shadow-sm"
            >
              <span>{t('landing.farmerDashboard', 'Farmer Dashboard')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>

          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs sm:text-sm font-semibold transition-colors ${
                darkMode
                  ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              aria-label="Select Language"
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>{LANGUAGES.find((l) => l.code === currentLang)?.nativeName || 'English'}</span>
            </button>

            {langDropdownOpen && (
              <div
                className={`absolute right-0 mt-2 w-40 rounded-xl border shadow-xl py-1.5 z-50 text-xs ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors ${
                      currentLang === lang.code
                        ? darkMode
                          ? 'font-bold text-emerald-400 bg-emerald-950/40'
                          : 'font-bold text-emerald-700 bg-emerald-50'
                        : darkMode
                        ? 'hover:bg-slate-800'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[11px] opacity-60">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Light / Dark Mode Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={
                darkMode
                  ? t('landing.themeToggleLight', 'Switch to Light Mode')
                  : t('landing.themeToggleDark', 'Switch to Dark Mode')
              }
              title={
                darkMode
                  ? t('landing.themeToggleLight', 'Switch to Light Mode')
                  : t('landing.themeToggleDark', 'Switch to Dark Mode')
              }
              className={`p-2 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-slate-700 bg-slate-900 text-amber-300 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Mobile Right Controls: Theme + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle light/dark theme"
              className={`p-2 rounded-lg border text-xs transition-colors ${
                darkMode
                  ? 'border-slate-700 bg-slate-900 text-amber-300'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'border-slate-700 bg-slate-900 text-slate-200'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-t px-4 py-4 space-y-3 transition-colors ${
            darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          {/* Language Selector Row */}
          <div className="text-xs font-semibold text-slate-400 mb-1">Language / भाषा:</div>
          <div className="grid grid-cols-2 gap-2 pb-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  handleLanguageSelect(lang.code);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-lg text-xs text-center border font-medium transition-colors ${
                  currentLang === lang.code
                    ? darkMode
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                      : 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                    : darkMode
                    ? 'border-slate-800 bg-slate-900 text-slate-300'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2.5 border-t border-slate-200 dark:border-slate-800">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full"
            >
              <Button variant="primary" className="w-full justify-center gap-2 py-2.5 text-sm font-semibold">
                <span>{t('landing.farmerDashboard', 'Farmer Dashboard')}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full"
            >
              <Button
                variant="outline"
                className={`w-full justify-center py-2.5 text-sm font-semibold ${
                  darkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : ''
                }`}
              >
                {t('landing.farmerLogin', 'Farmer Login')}
              </Button>
            </Link>

            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-semibold transition-colors ${
                darkMode
                  ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-emerald-400'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('landing.adminPortal', 'Admin Login')}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
