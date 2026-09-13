import * as React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminOverviewStats, AdminRequestItem, AdminCentreItem } from '../../types/admin';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Calendar,
  Filter,
  PhoneCall,
  Check,
  Search,
  Play,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { assignedState, admin } = useAdminAuth();

  const [stats, setStats] = React.useState<AdminOverviewStats | null>(null);
  const [centres, setCentres] = React.useState<AdminCentreItem[]>([]);
  const [requests, setRequests] = React.useState<AdminRequestItem[]>([]);
  const [centreSummaries, setCentreSummaries] = React.useState<{ operatingStatus: string; count: number }[]>([]);

  // Filter Selectors
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>('all');
  const [selectedCentre, setSelectedCentre] = React.useState<string>('all');
  const [selectedDate, setSelectedDate] = React.useState<string>('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');
  const [searchToken, setSearchToken] = React.useState<string>('');

  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Load centres & initial overview stats
  const loadInitialData = async () => {
    if (!assignedState) return;
    try {
      const [overviewData, stateCentres] = await Promise.all([
        adminService.getOverviewStats(assignedState),
        adminService.getCentresByState(assignedState),
      ]);
      setStats(overviewData.stats);
      setCentreSummaries(overviewData.centreSummaries);
      setCentres(stateCentres);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    }
  };

  // Load requests based on active selectors
  const loadFilteredRequests = async () => {
    if (!assignedState) return;
    try {
      const reqs = await adminService.getRequestsByState(assignedState, {
        district: selectedDistrict,
        centreId: selectedCentre,
        date: selectedDate || undefined,
        status: selectedStatus,
        search: searchToken || undefined,
      });
      setRequests(reqs);
    } catch (err) {
      console.error('Failed to load filtered requests:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadInitialData(), loadFilteredRequests()]);
    setLoading(false);
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadAll();
  }, [assignedState]);

  React.useEffect(() => {
    loadFilteredRequests();
  }, [selectedDistrict, selectedCentre, selectedDate, selectedStatus, searchToken]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  // Derive districts from state centres
  const availableDistricts = React.useMemo(() => {
    const dSet = new Set<string>();
    centres.forEach((c) => {
      if (c.district) dSet.add(c.district);
    });
    return Array.from(dSet).sort();
  }, [centres]);

  // Derive centres filtered by district
  const filteredCentresList = React.useMemo(() => {
    if (selectedDistrict === 'all') return centres;
    return centres.filter((c) => c.district === selectedDistrict);
  }, [centres, selectedDistrict]);

  // Queue operations: advance token status
  const handleQueueCheckIn = async (req: AdminRequestItem) => {
    setProcessingId(req.id);
    setActionMessage(null);
    try {
      const success = await adminService.logQueueAction({
        centreId: req.centreId,
        bookingId: req.id,
        eventType: 'checked_in',
        notes: `Farmer ${req.farmerName} called / marked arrived at Mandi gate.`,
      });
      if (success) {
        setActionMessage(`Token ${req.token} marked as Arrived (In Progress).`);
        await loadAll();
      }
    } catch (err) {
      console.error('Queue check-in failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const setTodayDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with State Scope */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-700" />
            Official Government Agricultural Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {assignedState} Administration
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              State: {assignedState}
            </span>
            <span className="text-xs text-slate-500">
              Active Officer: <strong>{admin?.adminName || 'State Administrator'}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <Link
            to="/admin/queue"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-800 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Live Queue Console</span>
          </Link>
        </div>
      </div>

      {/* Action notification */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold">{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Requests Got (Actual Count) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Total Requests Got
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              {loading ? (
                <span className="w-8 h-8 inline-block bg-slate-100 rounded animate-pulse" />
              ) : (
                stats?.totalRequests ?? requests.length ?? 0
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Actual farmer booking requests</p>
          </div>
        </div>

        {/* Today's Requests */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Today's Slots
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              {loading ? (
                <span className="w-8 h-8 inline-block bg-slate-100 rounded animate-pulse" />
              ) : (
                stats?.todayRequests ?? 0
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Slot assignments scheduled today</p>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pending Verification
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-amber-700">
              {loading ? (
                <span className="w-8 h-8 inline-block bg-slate-100 rounded animate-pulse" />
              ) : (
                stats?.pendingVerification ?? 0
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting physical gate check / QR</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-emerald-800">
              {loading ? (
                <span className="w-8 h-8 inline-block bg-slate-100 rounded animate-pulse" />
              ) : (
                stats?.inProgress ?? 0
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Weighbridge & inspection active</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Procured & Completed
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">
              {loading ? (
                <span className="w-8 h-8 inline-block bg-slate-100 rounded animate-pulse" />
              ) : (
                stats?.completed ?? 0
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Successfully fulfilled loads</p>
          </div>
        </div>
      </div>

      {/* Interactive State Filtering Console: District, Centre, Date, Status */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-emerald-800" />
            <span>State Procurement Filter Controls</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Jurisdiction: <strong className="text-emerald-800">{assignedState}</strong> (Isolated via RLS)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. State (Fixed by Auth) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">State Jurisdiction</label>
            <div className="py-2 px-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 font-bold flex items-center justify-between">
              <span>{assignedState}</span>
              <span className="text-[10px] text-emerald-800 uppercase font-mono">Enforced</span>
            </div>
          </div>

          {/* 2. District Selector */}
          <div>
            <label htmlFor="district-selector" className="block text-[11px] font-semibold text-slate-600 mb-1">
              District
            </label>
            <select
              id="district-selector"
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedCentre('all'); // Reset centre when district changes
              }}
              className="w-full py-2 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              <option key="all" value="all">All Districts ({assignedState})</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Procurement Centre Selector */}
          <div>
            <label htmlFor="centre-selector" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Procurement Centre
            </label>
            <select
              id="centre-selector"
              value={selectedCentre}
              onChange={(e) => setSelectedCentre(e.target.value)}
              className="w-full py-2 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 truncate"
            >
              <option key="all" value="all">All Centres ({filteredCentresList.length})</option>
              {filteredCentresList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.district})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Date Selector */}
          <div>
            <label htmlFor="date-selector" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Assigned Date
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="date-selector"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
              <button
                type="button"
                onClick={setTodayDate}
                title="Filter by Today"
                className="px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-bold text-slate-700 shrink-0"
              >
                Today
              </button>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  title="Clear Date"
                  className="px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-bold text-slate-500 shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 5. Status Selector */}
          <div>
            <label htmlFor="status-selector" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Booking Status
            </label>
            <select
              id="status-selector"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-800"
            >
              <option value="all">All Statuses</option>
              <option value="booked">Booked (Pending)</option>
              <option value="in_progress">In Progress (At Yard)</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Booking / Token List & Queue Operations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-800" />
              Booking & Token Register ({assignedState})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {requests.length} tokens matching active district, centre, and date filters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                placeholder="Search token / farmer..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 w-48"
              />
            </div>
            <Link
              to="/admin/requests"
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1 shrink-0"
            >
              <span>Full Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
            Loading tokens and state queues for {assignedState}...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No bookings found for the selected state and filter parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Farmer Details</th>
                  <th className="py-3 px-4">District / Centre</th>
                  <th className="py-3 px-4">Crop & Quantity</th>
                  <th className="py-3 px-4">Assigned Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Queue Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-emerald-900 text-sm bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {req.token}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{req.farmerName}</div>
                      <div className="text-[11px] text-slate-500">{req.farmerMobile}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{req.centreName}</div>
                      <div className="text-[11px] text-slate-400">Dist: {req.centreDistrict}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{req.cropName}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">{req.quantityQuintals} Quintals</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{req.assignedDate || req.preferredDate || 'Pending'}</div>
                      <div className="text-[11px] text-slate-400">
                        {req.assignedStartTime ? `${req.assignedStartTime.slice(0, 5)} - ${req.assignedEndTime?.slice(0, 5)}` : 'Standard Slot'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const isProcurementCompleted =
                          req.bookingStatus === 'completed' ||
                          req.workflowStatus === 'procurement_completed' ||
                          req.workflowStatus === 'payment_processing' ||
                          req.workflowStatus === 'payment_completed';

                        const isPaymentDone =
                          req.paymentStatus === 'completed' ||
                          req.workflowStatus === 'payment_completed';

                        if (isProcurementCompleted) {
                          if (isPaymentDone) {
                            return (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                Completed
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Payment Pending
                            </span>
                          );
                        }

                        if (req.bookingStatus === 'in_progress') {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                              In Progress
                            </span>
                          );
                        }

                        if (req.bookingStatus === 'cancelled') {
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                              Cancelled
                            </span>
                          );
                        }

                        return (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            Booked
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.bookingStatus === 'booked' && (
                          <button
                            type="button"
                            disabled={processingId === req.id}
                            onClick={() => handleQueueCheckIn(req)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-semibold transition shadow-xs disabled:opacity-50"
                            title="Mark arrival / Call token"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call / Arrive</span>
                          </button>
                        )}

                        {req.bookingStatus === 'in_progress' &&
                          req.workflowStatus !== 'procurement_completed' &&
                          req.workflowStatus !== 'payment_processing' &&
                          req.workflowStatus !== 'payment_completed' && (
                            <Link
                              to={`/admin/requests/${req.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold transition shadow-xs"
                              title="Start Procurement"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Start</span>
                            </Link>
                          )}

                        <Link
                          to={`/admin/requests/${req.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium transition"
                        >
                          Inspect
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
