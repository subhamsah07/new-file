import * as React from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Download, CheckCircle2, CalendarPlus, Loader2, Calendar, MapPin, Sprout } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { bookingService } from '../../services/bookingService';
import { ProcurementBooking } from '../../types';
import { formatCurrencyINR, formatQuantityQuintals } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export const ProcurementHistory: React.FC = () => {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = React.useState<ProcurementBooking[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let active = true;
    async function loadHistory() {
      setIsLoading(true);
      try {
        const items = await bookingService.getBookingHistory();
        if (active) {
          setHistoryItems(items);
        }
      } catch (err) {
        console.warn('Failed to fetch booking history:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadHistory();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'BOOKED':
        return <Badge variant="info">Booked</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info">Confirmed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">In Progress</Badge>;
      case 'COMPLETED':
      case 'PAYMENT_PROCESSED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status || 'Booked'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Procurement & Booking History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Verified electronic records, scheduled slot tokens, and MSP procurement entries
          </p>
        </div>

        <Link to="/farmer/booking">
          <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
            <CalendarPlus className="h-4 w-4" />
            <span>Book New Slot</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading your official procurement records from database...</p>
        </div>
      ) : historyItems.length === 0 ? (
        /* CLEAN EMPTY STATE */
        <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <HistoryIcon className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">No booking history yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              You do not have any recorded procurement bookings in the central system yet. Schedule a slot to begin government mandi procurement.
            </p>
          </div>
          <Link to="/farmer/booking">
            <Button variant="primary" size="md" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              <span>Book a Procurement Slot</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => (
            <Card key={item.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2.5 py-1 rounded">
                    TOKEN: {item.token}
                  </span>
                  <span className="font-semibold text-slate-300">
                    Created: {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(item.workflowStatus)}
                </div>
              </div>

              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Procured Crop
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
                      {item.cropName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Slot Date: {item.bookingDate}</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quantity
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
                      {formatQuantityQuintals(item.quantityQuintals)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Declared Lot</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Government MSP Rate
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
                      ₹{item.ratePerQuintal} / Q
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Benchmark MSP</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      Estimated Value
                    </span>
                    <span className="text-lg font-black text-emerald-800 dark:text-emerald-300 block mt-0.5">
                      {formatCurrencyINR(item.estimatedValue)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Certified upon weighbridge
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    Centre: <strong className="text-slate-800 dark:text-slate-200">{item.centreName}</strong>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 dark:text-slate-400">
                      Slot: <strong className="text-emerald-800 dark:text-emerald-300 font-semibold">{item.assignedSlotTime}</strong> ({item.assignedDate || item.bookingDate})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
