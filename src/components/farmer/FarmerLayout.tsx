import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarPlus,
  Compass,
  Activity,
  History,
  Bell,
  Settings,
  LogOut,
  Shield,
  ShieldCheck,
  Menu,
  X,
  Clock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { SmartProcureLogo } from '../ui/SmartProcureLogo';
import { useAuth } from '../../contexts/AuthContext';

interface FarmerLayoutProps {
  children: React.ReactNode;
}

export const FarmerLayout: React.FC<FarmerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const farmerName = profile?.fullName || (user?.user_metadata?.fullName as string) || 'Farmer Rameshwar';
  const farmerDistrict = profile?.district || (user?.user_metadata?.district as string) || 'Ludhiana';
  const farmerState = profile?.state || (user?.user_metadata?.state as string) || 'Punjab';
  const farmerBankName = profile?.bankAccount?.bankName || (user?.user_metadata?.bankAccount?.bankName as string) || 'Punjab National Bank';
  const rawAcct = profile?.bankAccount?.accountNumber || (user?.user_metadata?.bankAccount?.accountNumber as string) || '123456789012';
  const maskedAcct = rawAcct.length > 4 ? `••••••••${rawAcct.slice(-4)}` : '••••5678';
  const initials = farmerName.slice(0, 2).toUpperCase();

  const navigationItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/farmer', altPath: '/dashboard' },
    { label: 'Book Slot', icon: CalendarPlus, path: '/farmer/booking', altPath: '/dashboard/book' },
    { label: 'Find Centre', icon: Compass, path: '/farmer/centres', altPath: '/dashboard/centres' },
    { label: 'Track Token', icon: Activity, path: '/farmer/token', altPath: '/dashboard/track', badge: 'Live' },
    { label: 'History', icon: History, path: '/farmer/history', altPath: '/dashboard/history' },
    { label: 'Notifications', icon: Bell, path: '/farmer/notifications', altPath: '/dashboard/notifications', badge: '1' },
    { label: 'Settings', icon: Settings, path: '/farmer/settings', altPath: '/dashboard/settings' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate('/login', {
        replace: true,
        state: { message: 'You have been signed out securely.' },
      });
    }
  };

  const isItemActive = (path: string, altPath?: string) => {
    return location.pathname === path || (altPath && location.pathname === altPath);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5">
              <SmartProcureLogo size={36} />
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Smart<span className="text-emerald-700">Procure</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                  Farmer Portal &bull; Supabase Auth
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Center Navigation Links: [Dashboard] [History] [Notifications] */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Link
              to="/farmer"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isItemActive('/farmer', '/dashboard')
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                  : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/farmer/history"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isItemActive('/farmer/history', '/dashboard/history')
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                  : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              History
            </Link>
            <Link
              to="/farmer/notifications"
              className={`relative px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                isItemActive('/farmer/notifications', '/dashboard/notifications')
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60'
                  : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Notifications</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Portal Button */}
            <Link
              to="/admin/login"
              id="header-admin-portal-btn"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-all duration-150 shadow-2xs group"
              title="State Administration Portal"
            >
              <Shield className="h-3.5 w-3.5 text-emerald-700 group-hover:scale-105 transition-transform shrink-0" />
              <span>Admin Portal</span>
            </Link>

            {/* Notification Bell */}
            <Link
              to="/farmer/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white animate-pulse" />
            </Link>

            {/* Farmer Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs border border-emerald-300">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>{farmerName}</span>
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                </div>
                <div className="text-[10px] text-slate-400">
                  {farmerDistrict}, {farmerState}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main App Body */}
      <div className="flex-1 flex pb-16 lg:pb-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
          <div className="p-4 flex-1 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Procurement Services
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.path, item.altPath);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs border border-emerald-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${active ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* State Authority Entry in Sidebar */}
          <div className="px-4 pt-2">
            <Link
              to="/admin/login"
              id="sidebar-admin-portal-link"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-emerald-700 group-hover:scale-105 transition-transform" />
                <span>Admin Portal</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                Official
              </span>
            </Link>
          </div>

          {/* Account & Logout in Sidebar */}
          <div className="p-4 border-t border-slate-200 space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Primary DBT Account
              </span>
              <span className="text-xs font-semibold text-slate-800 block truncate">
                {farmerBankName}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {maskedAcct}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white h-full flex flex-col shadow-xl z-10">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800">Procurement Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3 flex-1 overflow-y-auto space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.path, item.altPath);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                        active
                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-emerald-700" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="p-3 border-t border-slate-100 space-y-2">
                <Link
                  to="/admin/login"
                  id="mobile-drawer-admin-portal-link"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-emerald-700" />
                    <span>Admin Portal</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                    Official
                  </span>
                </Link>
              </div>

              <div className="p-4 border-t border-slate-200">
                <Button variant="outline" size="sm" className="w-full justify-center" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navigationItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.path, item.altPath);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                active ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-600 ring-1 ring-white" />
                )}
              </div>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
