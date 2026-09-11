import * as React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminRequestItem, VerificationRecordItem } from '../../types/admin';
import { ProcurementWorkflowStatus } from '../../types/database';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  QrCode,
  FileCheck,
  Scale,
  CreditCard,
  Building2,
  User,
  Calendar,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const AdminRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { assignedState } = useAdminAuth();
  const navigate = useNavigate();

  const [request, setRequest] = React.useState<AdminRequestItem | null>(null);
  const [verificationRecords, setVerificationRecords] = React.useState<VerificationRecordItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [advancing, setAdvancing] = React.useState(false);

  // Workflow update inputs
  const [verifiedQty, setVerifiedQty] = React.useState<number | ''>('');
  const [verifiedRate, setVerifiedRate] = React.useState<number | ''>('');
  const [workflowNotes, setWorkflowNotes] = React.useState('');

  const loadDetails = async () => {
    if (!id || !assignedState) return;
    setLoading(true);
    try {
      const data = await adminService.getRequestById(id, assignedState);
      if (data.request) {
        setRequest(data.request);
        setVerificationRecords(data.verificationRecords);
        setVerifiedQty(data.request.quantityQuintals);
        setVerifiedRate(data.request.ratePerQuintal);
      }
    } catch (err) {
      console.error('Failed to load request detail:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDetails();
  }, [id, assignedState]);

  const workflowSteps: { status: ProcurementWorkflowStatus; label: string; icon: any }[] = [
    { status: 'booking', label: '1. Booking Created', icon: Calendar },
    { status: 'qr_verified', label: '2. QR Verified', icon: QrCode },
    { status: 'document_verification', label: '3. Documents Verified', icon: FileCheck },
    { status: 'weight_rate_verification', label: '4. Weight & Rate', icon: Scale },
    { status: 'procurement_completed', label: '5. Procurement Done', icon: CheckCircle2 },
    { status: 'payment_processing', label: '6. Payment Processing', icon: Clock },
    { status: 'payment_completed', label: '7. Payment Complete', icon: CreditCard },
  ];

  const currentStepIndex = React.useMemo(() => {
    if (!request) return 0;
    const idx = workflowSteps.findIndex((s) => s.status === request.workflowStatus);
    return idx === -1 ? 0 : idx;
  }, [request]);

  const handleAdvanceStep = async (targetStatus: ProcurementWorkflowStatus) => {
    if (!request) return;
    setAdvancing(true);

    const ok = await adminService.advanceWorkflowStatus({
      bookingId: request.id,
      newStatus: targetStatus,
      verifiedQuantity: verifiedQty ? Number(verifiedQty) : undefined,
      verifiedRate: verifiedRate ? Number(verifiedRate) : undefined,
      notes: workflowNotes || undefined,
    });

    setAdvancing(false);
    if (ok) {
      setWorkflowNotes('');
      loadDetails();
    } else {
      alert('Failed to advance workflow status. Please check your admin session.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
        Loading procurement request details...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-bold text-slate-900 text-lg">Request Not Found or Cross-State Restricted</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          This procurement booking does not exist or belongs to a procurement yard outside of {assignedState}.
        </p>
        <Link
          to="/admin/requests"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Requests Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/requests')}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-700 text-lg sm:text-xl">
                {request.token}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  request.bookingStatus === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : request.bookingStatus === 'in_progress'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : request.bookingStatus === 'cancelled'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {request.bookingStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Procurement Request • {request.cropName} ({request.quantityQuintals} Quintals)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/queue"
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Go to Live Queue
          </Link>
        </div>
      </div>

      {/* 7-Step Procurement Workflow Timeline (Foundation) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Procurement Verification Lifecycle
            </h2>
            <p className="text-xs text-slate-500">
              Auditable checkpoint progression from booking gate check to payment completion.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            Step {currentStepIndex + 1} of {workflowSteps.length}
          </span>
        </div>

        {/* Progress Bar & Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {workflowSteps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.status}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-xs'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50 text-slate-700'
                    : 'border-slate-100 bg-white text-slate-400 opacity-60'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs mb-1.5 ${
                    isCurrent
                      ? 'bg-emerald-600 text-white'
                      : isCompleted
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-semibold leading-tight">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Workflow Advance Controls */}
        <div className="pt-4 border-t border-slate-100 bg-slate-50/60 -mx-6 -mb-6 p-6 rounded-b-2xl">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Officer Verification Action
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Verified Quantity (Quintals)
              </label>
              <input
                type="number"
                value={verifiedQty}
                onChange={(e) => setVerifiedQty(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={String(request.quantityQuintals)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Verified MSP Rate (₹/Qtl)
              </label>
              <input
                type="number"
                value={verifiedRate}
                onChange={(e) => setVerifiedRate(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={String(request.ratePerQuintal)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Verification Notes / Seal ID
              </label>
              <input
                type="text"
                value={workflowNotes}
                onChange={(e) => setWorkflowNotes(e.target.value)}
                placeholder="e.g. Weighbridge Slip #4912"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentStepIndex < workflowSteps.length - 1 && (
              <button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvanceStep(workflowSteps[currentStepIndex + 1].status)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 shadow-xs transition disabled:opacity-50"
              >
                <span>Advance to: {workflowSteps[currentStepIndex + 1].label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStepIndex >= 4 && request.workflowStatus !== 'payment_completed' && (
              <button
                type="button"
                disabled={advancing}
                onClick={() => handleAdvanceStep('payment_completed')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 shadow-xs transition disabled:opacity-50"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Mark Payment Completed</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Booking & Farmer Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Farmer & Booking Pass */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            Farmer Particulars
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Farmer Name:</span>
              <span className="font-semibold text-slate-900">{request.farmerName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mobile Contact:</span>
              <span className="font-mono text-slate-800">{request.farmerMobile || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Origin District:</span>
              <span className="font-semibold text-slate-900">{request.farmerDistrict}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Opaque QR Identifier:</span>
              <span className="font-mono text-[11px] text-emerald-700 font-bold truncate max-w-[200px]">
                {request.qrIdentifier}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Yard & Slot Assignment */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Centre & Slot Allocation
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Mandi Centre:</span>
              <span className="font-semibold text-slate-900">{request.centreName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Centre District & State:</span>
              <span className="font-semibold text-slate-800">
                {request.centreDistrict}, {request.centreState}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Preferred Date:</span>
              <span className="text-slate-800">{request.preferredDate} ({request.preferredTimeSlot})</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Assigned Slot Window:</span>
              <span className="font-semibold text-emerald-700">
                {request.assignedDate} • {request.assignedStartTime?.slice(0, 5)} - {request.assignedEndTime?.slice(0, 5)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Estimated Procurement Value:</span>
              <span className="font-bold text-slate-900">
                ₹{request.estimatedValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Audit Records Log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Checkpoint Audit Trail ({verificationRecords.length} records)
        </h3>

        {verificationRecords.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">
            No verification audit checkpoints logged yet for this request.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Verification Checkpoint</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Notes / Seal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verificationRecords.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2.5 px-3 text-slate-500">
                      {v.verifiedAt ? new Date(v.verifiedAt).toLocaleString() : new Date(v.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{v.verificationType}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {v.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{v.notes || '—'}</td>
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
