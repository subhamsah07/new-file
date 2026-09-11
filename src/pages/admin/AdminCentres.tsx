import * as React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminCentreItem } from '../../types/admin';
import { CentreOperatingStatus } from '../../types/database';
import { districtService } from '../../services/districtService';
import { District, IndianState } from '../../types';
import {
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Scale,
  Users,
  Edit2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export const AdminCentres: React.FC = () => {
  const { assignedState } = useAdminAuth();
  const [centres, setCentres] = React.useState<AdminCentreItem[]>([]);
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [districtFilter, setDistrictFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Status editing modal state
  const [editingCentre, setEditingCentre] = React.useState<AdminCentreItem | null>(null);
  const [newStatus, setNewStatus] = React.useState<CentreOperatingStatus>('OPEN');
  const [isSaving, setIsSaving] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadCentres = async () => {
    if (!assignedState) return;
    setLoading(true);
    try {
      const [centresData, districtsData] = await Promise.all([
        adminService.getCentresByState(assignedState),
        districtService.getDistrictsByState(assignedState as IndianState),
      ]);
      setCentres(centresData);
      setDistricts(districtsData);
    } catch (err) {
      console.error('Failed to load centres or districts:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCentres();
  }, [assignedState]);

  // Filtered list
  const filteredCentres = React.useMemo(() => {
    return centres.filter((c) => {
      if (districtFilter !== 'all' && c.district.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (statusFilter !== 'all' && c.operatingStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [centres, districtFilter, statusFilter, searchQuery]);

  const handleOpenStatusEdit = (centre: AdminCentreItem) => {
    setEditingCentre(centre);
    setNewStatus(centre.operatingStatus);
  };

  const handleSaveStatus = async () => {
    if (!editingCentre) return;
    setIsSaving(true);
    try {
      const ok = await adminService.updateCentreOperatingStatus(editingCentre.id, newStatus);
      if (ok) {
        setCentres((prev) =>
          prev.map((c) => (c.id === editingCentre.id ? { ...c, operatingStatus: newStatus } : c))
        );
        setToastMessage(`Centre "${editingCentre.name}" operating status changed to ${newStatus}.`);
        setEditingCentre(null);
      } else {
        alert('Failed to update centre status. Ensure your admin session is active.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating centre status');
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Official Yard Directory
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Procurement Centres in {assignedState}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Authorized Mandi intake yards and weighbridge centers strictly isolated to {assignedState}.
          </p>
        </div>

        <button
          onClick={loadCentres}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Centres</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by centre name, code, district..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* District Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="admin-centres-district-filter"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option key="all" value="all">All Districts ({districts.length})</option>
              {districts.map((d) => (
                <option key={d.id || d.districtCode || d.districtName} value={d.districtName}>
                  {d.districtName}
                </option>
              ))}
            </select>
          </div>

          {/* Operating Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="BUSY">BUSY</option>
              <option value="LUNCH_BREAK">LUNCH_BREAK</option>
              <option value="CLOSED">CLOSED</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Centres List / Table */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
          Loading {assignedState} procurement centres from Supabase...
        </div>
      ) : filteredCentres.length === 0 ? (
        districtFilter !== 'all' ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="font-semibold text-slate-800 text-sm">
              No verified procurement centre is currently registered in this district.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              District {districtFilter} is a recognized administrative district of {assignedState}. Once registered by the state authority, certified mandis will appear here.
            </p>
            <button
              type="button"
              onClick={() => setDistrictFilter('all')}
              className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
            >
              Show all centres in {assignedState}
            </button>
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 text-xs">
            No procurement centres matched the search criteria in {assignedState}.
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCentres.map((centre) => (
            <div
              key={centre.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
            >
              <div className="space-y-2">
                {/* Header: Name and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{centre.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {centre.code}
                      </span>
                      {centre.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Yard
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      centre.operatingStatus === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : centre.operatingStatus === 'BUSY'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : centre.operatingStatus === 'LUNCH_BREAK'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {centre.operatingStatus}
                  </span>
                </div>

                {/* Location Info */}
                <div className="flex items-start gap-1.5 text-xs text-slate-600 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800">{centre.district} District</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{centre.address}</p>
                  </div>
                </div>

                {/* Operating Hours & Capacity */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>09:00 – 18:00</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    <span>{centre.capacityPerDayQuintals} Qtl/day</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Lunch Interval:</span>
                    <span className="font-medium text-slate-700">14:00 – 15:00 (1 Hr)</span>
                  </div>
                </div>

                {centre.contactNumber && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{centre.contactNumber}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Active Queue: <strong className="text-slate-800">{centre.todayQueueCount}</strong>
                  </span>
                </div>

                <button
                  onClick={() => handleOpenStatusEdit(centre)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                >
                  <Edit2 className="w-3 h-3" />
                  Change Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Edit Modal */}
      {editingCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Update Operating Status</h3>
                <p className="text-xs text-slate-500">{editingCentre.name} ({editingCentre.code})</p>
              </div>
              <button
                onClick={() => setEditingCentre(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Select Centre Operating Mode:
              </label>
              {(['OPEN', 'BUSY', 'LUNCH_BREAK', 'CLOSED', 'MAINTENANCE'] as CentreOperatingStatus[]).map(
                (status) => (
                  <label
                    key={status}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer text-xs transition ${
                      newStatus === status
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          status === 'OPEN'
                            ? 'bg-emerald-500'
                            : status === 'BUSY'
                            ? 'bg-amber-500'
                            : status === 'LUNCH_BREAK'
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {status}
                    </span>
                    <input
                      type="radio"
                      name="centreStatus"
                      value={status}
                      checked={newStatus === status}
                      onChange={() => setNewStatus(status)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                )
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCentre(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveStatus}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition disabled:opacity-50"
              >
                {isSaving ? 'Updating Database...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
