import * as React from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ShieldCheck,
  TrendingUp,
  MapPin,
  RefreshCw,
  Info,
  Layers,
  Scale,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../ui/Badge';
import { ProcurementBooking } from '../../types';
import {
  queueService,
  FarmerLiveTelemetry,
} from '../../services/queueService';

interface LiveQueueIntelligenceCardProps {
  booking: ProcurementBooking;
  onBookingUpdated?: () => void;
}

export const LiveQueueIntelligenceCard: React.FC<LiveQueueIntelligenceCardProps> = ({
  booking,
  onBookingUpdated,
}) => {
  const [telemetry, setTelemetry] = React.useState<FarmerLiveTelemetry | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = React.useState<number>(0);

  const centreId = booking.centreId;
  const token = (booking.token || '').trim().toUpperCase();

  // Fresh data refresh handler
  const refreshQueueData = React.useCallback(async () => {
    try {
      const tel = await queueService.getFarmerLiveTelemetry(booking);
      setTelemetry(tel);
    } catch (err) {
      console.warn('Farmer telemetry refresh notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [booking]);

  // Live real-time subscription (Supabase Realtime + local store)
  React.useEffect(() => {
    refreshQueueData();

    const unsubscribe = queueService.subscribeToFarmerLiveTelemetry(booking, (freshTel) => {
      setTelemetry(freshTel);
      if (onBookingUpdated && freshTel.status === 'COMPLETED' && booking.workflowStatus !== 'PROCUREMENT_COMPLETED') {
        onBookingUpdated();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [booking, refreshQueueData, onBookingUpdated]);

  // Elapsed timer when status === 'PROCESSING'
  React.useEffect(() => {
    if (telemetry?.status !== 'PROCESSING') {
      setElapsedSeconds(0);
      return;
    }

    const startTs = telemetry.startedProcessingTime
      ? new Date(telemetry.startedProcessingTime).getTime()
      : Date.now() - (telemetry.elapsedMinutes || 0) * 60000;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((Date.now() - startTs) / 1000));
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [telemetry?.status, telemetry?.startedProcessingTime, telemetry?.elapsedMinutes]);

  const status = telemetry?.status || 'BOOKED';

  // Format elapsed time string
  const elapsedDisplay = React.useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }, [elapsedSeconds]);

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* 1. CAPACITY ARRIVAL WINDOW HEADER */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Procurement Center
            </span>
            <span className="text-xs text-slate-300">Slot Arrival Window</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              {booking.slotStartTime} – {booking.slotEndTime} &bull; {booking.assignedDate || booking.bookingDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">{booking.centreName}</span>
          </div>

          <button
            onClick={refreshQueueData}
            title="Refresh Live Status"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC CONTENT BASED ON REAL QUEUE TELEMETRY STATE */}
      <AnimatePresence mode="wait">
        {/* ============================================================== */}
        {/* STATE: COMPLETED                                                */}
        {/* ============================================================== */}
        {status === 'COMPLETED' ? (
          <motion.div
            key="status-completed"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="p-6 sm:p-8 bg-emerald-50/40 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">
                      ✓ Procurement Completed
                    </span>
                    <Badge variant="success" size="sm" className="font-bold">
                      Verified
                    </Badge>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Grain weighment and procurement ledger verification finished.
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                  Token Identifier
                </span>
                <span className="text-xl font-black font-mono text-emerald-950">
                  {telemetry?.token || token}
                </span>
              </div>
            </div>

            {/* Procurement Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-white border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Token
                </span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                  {telemetry?.token || token}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Centre
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {telemetry?.centreName || booking.centreName}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Crop Commodity
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {telemetry?.cropName || booking.cropName}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Quantity
                </span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                  {telemetry?.quantityQuintals || booking.quantityQuintals} Quintals
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>
                  Procurement recorded in Supabase mandi ledger. Official tare-weight receipts and payment disbursals proceed through standard DBT banking channels.
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 shrink-0">
                Updated {telemetry?.lastUpdated || 'just now'}
              </span>
            </div>
          </motion.div>
        ) : status === 'PROCESSING' ? (
          /* ============================================================== */
          /* STATE: PROCESSING                                              */
          /* ============================================================== */
          <motion.div
            key="status-processing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="p-6 sm:p-8 bg-blue-50/40 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm relative">
                  <Scale className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span>🟢 Processing Now</span>
                    </span>
                    <Badge variant="primary" size="sm" className="font-bold bg-blue-700 text-white">
                      Weighbridge Active
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-900 font-medium mt-0.5">
                    Your procurement is currently being processed.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-blue-200 text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider block">
                  Elapsed Processing Time
                </span>
                <span className="text-2xl font-black font-mono text-blue-900 block">
                  {elapsedDisplay}
                </span>
              </div>
            </div>

            {/* Mandatory Telemetry Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-white border border-blue-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Token
                </span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                  {telemetry?.token || token}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-blue-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Centre
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {telemetry?.centreName || booking.centreName}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-blue-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Crop
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                  {telemetry?.cropName || booking.cropName}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-blue-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Quantity
                </span>
                <span className="text-base font-bold text-slate-900 mt-0.5 block">
                  {telemetry?.quantityQuintals || booking.quantityQuintals} Quintals
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-blue-200 text-xs text-slate-600 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">
                  Vehicle currently stationed on electronic weighbridge for gross weight sampling.
                </p>
                <p className="mt-0.5 text-slate-500">
                  Only authorized admin actions can change queue state. Once weighing and moisture verification are logged, status will advance to completed automatically.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ============================================================== */
          /* STATE: WAITING or BOOKED (CHECKED_IN vs PENDING GATE INGRESS)  */
          /* ============================================================== */
          <motion.div
            key="status-queue-waiting"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="space-y-0"
          >
            {/* GATE INGRESS HELPER / NOTICE IF NOT CHECKED IN */}
            {status === 'BOOKED' && (
              <div className="p-6 bg-amber-50/70 border-b border-amber-200">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 mt-0.5">
                    <Info className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                      <span>Appointment Booked &bull; Gate Ingress Pending</span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
                      Your scheduled arrival window is <strong>{booking.slotStartTime} – {booking.slotEndTime}</strong>. Please present your token pass (<strong>{telemetry?.token || token}</strong>) or QR code to mandi officials upon arrival. Live queue position and estimated wait time will activate automatically once gate check-in is recorded.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE QUEUE FOUR CORE PILLARS */}
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-800 block">
                    LIVE QUEUE
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-black font-mono text-slate-900">
                      Token: {telemetry?.token || token}
                    </span>
                    {status === 'WAITING' ? (
                      <Badge variant="success" size="sm" className="font-bold gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        CHECKED_IN &bull; WAITING
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm" className="font-semibold text-slate-600">
                        APPOINTMENT BOOKED
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Centre: <strong className="text-slate-800">{telemetry?.centreName || booking.centreName}</strong></span>
                  <span>&bull;</span>
                  <span>Last Updated: <strong className="text-slate-700">{telemetry?.lastUpdated || 'just now'}</strong></span>
                </div>
              </div>

              {/* 4 PRIMARY TELEMETRY TILES */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. POSITION */}
                <div
                  className={`p-4 rounded-xl border-2 transition-all ${
                    status === 'WAITING'
                      ? telemetry?.position === 1
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Position
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <motion.span
                      key={telemetry?.position ?? 'none'}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-3xl font-black font-mono text-slate-900 tracking-tight"
                    >
                      {status === 'WAITING' && telemetry?.position ? `#${telemetry.position}` : '—'}
                    </motion.span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                    {status === 'WAITING'
                      ? telemetry?.position === 1
                        ? 'Next in line for weighment'
                        : 'Based on gate check-in order'
                      : 'Activates upon gate check-in'}
                  </span>
                </div>

                {/* 2. FARMERS AHEAD */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Farmers Ahead
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <motion.span
                      key={telemetry?.farmersAhead ?? 'none'}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-3xl font-black font-mono text-slate-900 tracking-tight"
                    >
                      {status === 'WAITING' && telemetry ? telemetry.farmersAhead : '—'}
                    </motion.span>
                    <span className="text-xs text-slate-500 font-medium">farmers</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                    {status === 'WAITING' && telemetry && telemetry.farmersAhead === 0
                      ? 'You are next in line!'
                      : 'Vehicles before weighment'}
                  </span>
                </div>

                {/* 3. ESTIMATED WAIT */}
                <div
                  className={`p-4 rounded-xl border-2 transition-all ${
                    telemetry?.activeDelay?.isActive
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Estimated Wait
                  </span>
                  <div className="mt-1">
                    <motion.span
                      key={telemetry?.formattedWaitTime ?? 'none'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block"
                    >
                      {status === 'WAITING' && telemetry ? telemetry.formattedWaitTime : '—'}
                    </motion.span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium mt-1 block">
                    {status === 'WAITING' && telemetry
                      ? telemetry.isBaselineEta
                        ? 'Baseline estimate (20m avg)'
                        : 'Dynamic rolling estimate'
                      : 'Calculated at check-in'}
                  </span>
                </div>

                {/* 4. CENTRE STATUS */}
                <div
                  className={`p-4 rounded-xl border-2 transition-all ${
                    telemetry?.activeDelay?.isActive
                      ? 'bg-amber-50 border-amber-500'
                      : 'bg-emerald-50 border-emerald-400'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    Centre Status
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    {telemetry?.activeDelay?.isActive ? (
                      <span className="text-sm font-black text-amber-900 tracking-tight flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        DELAY IN YARD
                      </span>
                    ) : (
                      <span className="text-sm font-black text-emerald-900 tracking-tight">
                        OPERATING NORMALLY
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium mt-1 block truncate">
                    {telemetry?.activeDelay?.isActive ? 'Weighbridge queue delayed' : 'Intake gates active'}
                  </span>
                </div>
              </div>

              {/* DELAY NOTIFICATION IF DELAY RECORDED BY ADMIN */}
              {telemetry?.activeDelay?.isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex items-start gap-3 shadow-xs"
                >
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-amber-950">
                      ⚠️ Centre experiencing delays
                    </h4>
                    <p className="text-xs text-amber-800">
                      Estimated waiting time has been updated. Delays may be due to moisture calibration, rail rake loading, or yard congestion.
                    </p>
                    {telemetry.activeDelay.notes && (
                      <p className="text-xs text-amber-900 font-semibold mt-1">
                        Official Mandi Notice: {telemetry.activeDelay.notes}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* VELOCITY / ETA TRANSPARENCY BAR */}
              {status === 'WAITING' && telemetry && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Activity className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>
                      Speed Basis: <strong className="text-slate-900">{telemetry.etaLabel}</strong>
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Velocity derived from real completed transactions
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
