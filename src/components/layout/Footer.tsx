import * as React from 'react';
import { Phone, Mail, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SmartProcureLogo } from '../ui/SmartProcureLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Operating Hours and Emergency Helpline Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              <strong>Mandi Operating Hours:</strong> 09:00 AM – 02:00 PM &bull; 02:00 PM – 03:00 PM (Scheduled Lunch Break) &bull; 03:00 PM – 06:00 PM
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              Kisan Helpline: <strong>1800-180-1551</strong> (Toll Free)
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <Mail className="h-3.5 w-3.5 text-emerald-400" />
              support@smartprocure.gov.in
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <SmartProcureLogo size={36} />
              <span className="font-extrabold text-xl text-white tracking-tight">
                Smart<span className="text-emerald-400">Procure</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              &ldquo;Don&apos;t make farmers wait for the queue. Let the queue tell farmers when to arrive.&rdquo;
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              A transparent, algorithm-driven agricultural queue intelligence and procurement management platform.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Smart India Hackathon 2026</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Farmer Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">
                  Farmer Login & Registration
                </Link>
              </li>
              <li>
                <Link to="/dashboard/book" className="hover:text-emerald-400 transition-colors">
                  Book Procurement Slot
                </Link>
              </li>
              <li>
                <Link to="/dashboard/track" className="hover:text-emerald-400 transition-colors">
                  Live Token & Queue Tracker
                </Link>
              </li>
              <li>
                <Link to="/dashboard/centres" className="hover:text-emerald-400 transition-colors">
                  Find Nearest Procurement Centre
                </Link>
              </li>
              <li>
                <Link to="/dashboard/history" className="hover:text-emerald-400 transition-colors">
                  Previous Procurement & Payment Slips
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Commodities */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Monitored Commodities
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center justify-between">
                <span>Wheat (Kanak)</span>
                <span className="text-emerald-400 font-mono">MSP ₹2,275/Q</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Paddy (Common)</span>
                <span className="text-emerald-400 font-mono">MSP ₹2,300/Q</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Mustard (Sarson)</span>
                <span className="text-emerald-400 font-mono">MSP ₹5,650/Q</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Maize (Makka)</span>
                <span className="text-emerald-400 font-mono">MSP ₹2,090/Q</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Rice (Parboiled Milled)</span>
                <span className="text-emerald-400 font-mono">₹3,100/Q</span>
              </li>
            </ul>
          </div>

          {/* Help & Compliance */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Transparency & Help
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#help" className="hover:text-emerald-400 transition-colors">
                  Mandi FAQ & Grievance Redressal
                </a>
              </li>
              <li>
                <a href="#live-queue" className="hover:text-emerald-400 transition-colors">
                  Queue Intelligence Methodology
                </a>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Citizen Charter (PDF)
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Privacy Policy & Data Security
                </span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Terms of Procurement Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            &copy; 2026 SmartProcure. Designed for Ministry of Agriculture & Farmers Welfare. All rights reserved.
          </p>
          <p className="text-slate-400 text-[11px]">
            Frontend Design System & Architecture &bull; Prepared for Supabase Realtime
          </p>
        </div>
      </div>
    </footer>
  );
};
