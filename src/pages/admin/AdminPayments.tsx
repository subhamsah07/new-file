import * as React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminPaymentItem } from '../../types/admin';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  Calendar,
} from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const { assignedState } = useAdminAuth();
  const [payments, setPayments] = React.useState<AdminPaymentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const loadPayments = async () => {
    if (!assignedState) return;
    setLoading(true);
    try {
      const data = await adminService.getPaymentsByState(assignedState);
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadPayments();
  }, [assignedState]);

  const filteredPayments = React.useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.paymentStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.farmerName.toLowerCase().includes(q) ||
          p.token.toLowerCase().includes(q) ||
          (p.paymentReference && p.paymentReference.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [payments, statusFilter, searchQuery]);

  const totalDisbursed = React.useMemo(() => {
    return filteredPayments
      .filter((p) => p.paymentStatus === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Direct Benefit Transfer (DBT) Tracker
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Procurement Payments ({assignedState})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Auditable MSP disbursement ledger and bank transfer reconciliation for {assignedState}.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Disbursed (Completed)
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-1">
            <span>₹{totalDisbursed.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Transferred directly to farmer bank accounts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Pending / In-Transit
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            {payments.filter((p) => p.paymentStatus === 'pending' || p.paymentStatus === 'processing').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Batches awaiting bank gateway ACK</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Invoices Registered
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">{payments.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total procurement intake transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by token, farmer, reference..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Payment Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading payment ledger from Supabase...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No payment records found for {assignedState}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Booking Token</th>
                  <th className="py-3 px-4">Farmer Name</th>
                  <th className="py-3 px-4">Crop / Intake</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">UTR Reference</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{p.token}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{p.farmerName}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{p.cropName}</span>{' '}
                      <span className="text-slate-400">({p.quantityQuintals} Qtl)</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {p.paymentReference || 'Pending UTR'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          p.paymentStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.paymentStatus === 'processing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : p.paymentStatus === 'failed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
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
