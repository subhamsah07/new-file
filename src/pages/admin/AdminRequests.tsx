import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminRequestItem, AdminCentreItem } from '../../types/admin';
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  QrCode,
  Calendar,
  Building2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ShieldAlert,
} from 'lucide-react';

export const AdminRequests: React.FC = () => {
  const { assignedState } = useAdminAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = React.useState<AdminRequestItem[]>([]);
  const [centres, setCentres] = React.useState<AdminCentreItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [centreFilter, setCentreFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = React.useState(false);
  const [qrInput, setQrInput] = React.useState('');
  const [qrVerifying, setQrVerifying] = React.useState(false);
  const [qrError, setQrError] = React.useState<string | null>(null);

  const loadData = async () => {
    if (!assignedState) return;
    setLoading(true);
    try {
      const [reqData, centreData] = await Promise.all([
        adminService.getRequestsByState(assignedState, {
          status: statusFilter,
          centreId: centreFilter,
          date: dateFilter || undefined,
          search: searchQuery,
        }),
        adminService.getCentresByState(assignedState),
      ]);
      setRequests(reqData);
      setCentres(centreData);
    } catch (err) {
      console.error('Failed to load admin requests:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [assignedState, statusFilter, centreFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleVerifyQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim() || !assignedState) return;

    setQrVerifying(true);
    setQrError(null);

    const result = await adminService.verifyQrIdentifier(qrInput.trim(), assignedState);
    setQrVerifying(false);

    if (result.success && result.request) {
      setQrModalOpen(false);
      setQrInput('');
      navigate(`/admin/requests/${result.request.id}`);
    } else {
      setQrError(result.error || 'QR Verification failed. Code not found.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Intake Verification Control
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Procurement Requests ({assignedState})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real grain arrival bookings and physical inspection logs. Data restricted to {assignedState}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 shadow-xs transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Verify Farmer QR</span>
          </button>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by 6-character token, farmer name, mobile..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="booked">Booked</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>

            {/* Centre Filter */}
            <select
              id="admin-requests-centre-filter"
              value={centreFilter}
              onChange={(e) => setCentreFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[180px] truncate"
            >
              <option key="all" value="all">All Centres</option>
              {centres.map((c) => (
                <option key={c.id || c.code} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
              >
                Clear Date
              </button>
            )}

            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading procurement requests from Supabase...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No procurement requests found matching the current filters for {assignedState}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4">Farmer Details</th>
                  <th className="py-3 px-4">Procurement Centre</th>
                  <th className="py-3 px-4">Crop & Quantity</th>
                  <th className="py-3 px-4">Assigned Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-emerald-700 text-sm">
                        {req.token}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{req.farmerName}</div>
                      <div className="text-[11px] text-slate-500">{req.farmerDistrict}</div>
                      {req.farmerMobile && (
                        <div className="text-[10px] text-slate-400 font-mono">{req.farmerMobile}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{req.centreName}</div>
                      <div className="text-[11px] text-slate-400">{req.centreDistrict}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{req.cropName}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">
                        {req.quantityQuintals} Quintals
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {req.assignedDate ? (
                        <div>
                          <div className="font-medium text-slate-800">{req.assignedDate}</div>
                          <div className="text-[11px] text-slate-500">
                            {req.assignedStartTime ? `${req.assignedStartTime.slice(0, 5)} - ${req.assignedEndTime?.slice(0, 5)}` : 'Assigned'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending Assignment</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          req.bookingStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.bookingStatus === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : req.bookingStatus === 'cancelled'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.bookingStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/requests/${req.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 text-xs px-2.5 py-1 rounded hover:bg-emerald-50 transition"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Verification Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Verify Farmer QR Identifier</h3>
                  <p className="text-xs text-slate-500">Mandi Gate Intake Verification ({assignedState})</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQrModalOpen(false);
                  setQrError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{qrError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyQr} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Enter or Scan QR Identifier:
                </label>
                <input
                  type="text"
                  required
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="e.g. SP-QR-9A7F2D1C8E4B..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Opaque cryptographic identifier scanned from farmer pass. Never exposes raw Aadhaar or PII.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQrModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={qrVerifying}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {qrVerifying ? 'Verifying with RLS...' : 'Verify & Open Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
