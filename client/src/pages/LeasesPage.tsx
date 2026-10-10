import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Lease, Tenant, Shop, LeaseStatus } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Modal } from '../components/common/Modal.js';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Clock,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const LeasesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Modals
  const [isNewLeaseModalOpen, setIsNewLeaseModalOpen] = useState(searchParams.get('action') === 'new');
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);

  // Forms
  const [leaseForm, setLeaseForm] = useState({
    tenantId: '',
    shopId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
    rentAmount: 5000,
    recurringCharges: 400,
    depositAmount: 15000,
    depositPaid: true,
    billingFrequency: 'MONTHLY',
    dueDay: 1,
    gracePeriodDays: 5,
    lateFeePercentage: 5.0,
    terms: 'Standard commercial retail lease with 5% annual escalation review.',
  });

  const [renewForm, setRenewForm] = useState({
    newEndDate: '',
    newRentAmount: 0,
    reason: '',
  });

  const [terminateForm, setTerminateForm] = useState({
    terminationDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [leasesData, tenantsData, shopsData] = await Promise.all([
        api.getLeases({ search, status: statusFilter }),
        api.getTenants(),
        api.getShops(),
      ]);
      setLeases(leasesData);
      setTenants(tenantsData);
      setShops(shopsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load lease agreements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLease({
        ...leaseForm,
        rentAmount: Math.round(Number(leaseForm.rentAmount) * 100),
        recurringCharges: Math.round(Number(leaseForm.recurringCharges) * 100),
        depositAmount: Math.round(Number(leaseForm.depositAmount) * 100),
        dueDay: Number(leaseForm.dueDay),
        gracePeriodDays: Number(leaseForm.gracePeriodDays),
        lateFeePercentage: Number(leaseForm.lateFeePercentage),
      });
      showToast('Lease contract executed successfully', 'success');
      setIsNewLeaseModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRenewLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLease) return;
    try {
      await api.renewLease(selectedLease.id, {
        newEndDate: new Date(renewForm.newEndDate),
        newRentAmount: Math.round(Number(renewForm.newRentAmount) * 100),
        reason: renewForm.reason,
      });
      showToast('Lease renewed and amendment recorded', 'success');
      setIsRenewModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTerminateLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLease) return;
    try {
      await api.terminateLease(selectedLease.id, {
        terminationDate: new Date(terminateForm.terminationDate),
        reason: terminateForm.reason,
      });
      showToast('Lease terminated and shop returned to vacant inventory', 'success');
      setIsTerminateModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openRenewModal = (lease: Lease) => {
    setSelectedLease(lease);
    const futureDate = new Date(lease.endDate);
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    setRenewForm({
      newEndDate: futureDate.toISOString().split('T')[0],
      newRentAmount: lease.rentAmount / 100,
      reason: 'Term extension agreement with tenant.',
    });
    setIsRenewModalOpen(true);
  };

  const openTerminateModal = (lease: Lease) => {
    setSelectedLease(lease);
    setTerminateForm({
      terminationDate: new Date().toISOString().split('T')[0],
      reason: 'Mutual lease termination agreement.',
    });
    setIsTerminateModalOpen(true);
  };

  const canManage = user?.role === 'MALL_OWNER' || user?.role === 'MALL_MANAGER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Lease Agreements & Legal Contracts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Contractual covenants, term durations, deposit management, rent schedules and renewals.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsNewLeaseModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Draft New Lease
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadData();
          }}
          className="flex-1 relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by lease #, tenant company, or shop number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none"
          >
            <option value="">All Contracts</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRING">Expiring (&lt;30 days)</option>
            <option value="RENEWED">Renewed</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Leases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold text-left">
              <tr>
                <th className="py-3.5 px-4">Lease #</th>
                <th className="py-3.5 px-4">Tenant / Brand</th>
                <th className="py-3.5 px-4">Shop Unit</th>
                <th className="py-3.5 px-4">Term Duration</th>
                <th className="py-3.5 px-4 text-right">Rent / Month</th>
                <th className="py-3.5 px-4 text-right">Deposit</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading lease agreements...
                  </td>
                </tr>
              ) : leases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No lease contracts found matching criteria.
                  </td>
                </tr>
              ) : (
                leases.map((lease) => {
                  const isExpiring = lease.status === 'EXPIRING';
                  return (
                    <tr key={lease.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{lease.leaseNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{lease.tenant?.companyName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{lease.tenant?.contactPerson}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 dark:text-white">{lease.shop?.shopNumber}</span>
                        <span className="block text-[11px] text-slate-400 dark:text-slate-500">{lease.shop?.floor?.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div>
                          {new Date(lease.startDate).toLocaleDateString()} —{' '}
                          <span className={isExpiring ? 'font-bold text-amber-700 dark:text-amber-400' : ''}>
                            {new Date(lease.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        {isExpiring && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">
                            <Clock className="w-3 h-3" /> Expiration Imminent
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white">${(lease.rentAmount / 100).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">+ ${(lease.recurringCharges / 100).toLocaleString()} charges</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">${(lease.depositAmount / 100).toLocaleString()}</span>
                        <span className={`text-[10px] block ${lease.depositPaid ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-500 dark:text-rose-400'}`}>
                          {lease.depositPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            lease.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                              : lease.status === 'EXPIRING'
                              ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800 animate-pulse'
                              : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {lease.status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {lease.status !== 'TERMINATED' && (
                              <>
                                <button
                                  onClick={() => openRenewModal(lease)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 text-[11px] font-bold transition-colors"
                                  title="Renew contract & amend terms"
                                >
                                  Renew
                                </button>
                                <button
                                  onClick={() => openTerminateModal(lease)}
                                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[11px] font-semibold transition-colors"
                                  title="Terminate lease"
                                >
                                  Terminate
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Draft New Lease */}
      <Modal isOpen={isNewLeaseModalOpen} onClose={() => setIsNewLeaseModalOpen(false)} title="Draft New Lease Contract" maxWidth="xl">
        <form onSubmit={handleCreateLease} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Tenant *</label>
              <select
                required
                value={leaseForm.tenantId}
                onChange={(e) => setLeaseForm({ ...leaseForm, tenantId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="">Select Tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.companyName} ({t.contactPerson})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Shop Unit *</label>
              <select
                required
                value={leaseForm.shopId}
                onChange={(e) => {
                  const sId = e.target.value;
                  const shop = shops.find((s) => s.id === sId);
                  setLeaseForm({
                    ...leaseForm,
                    shopId: sId,
                    rentAmount: shop ? shop.baseRent / 100 : leaseForm.rentAmount,
                    recurringCharges: shop ? shop.recurringCharges / 100 : leaseForm.recurringCharges,
                  });
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="">Select Shop Unit</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shopNumber} - {s.name} ({s.occupancyStatus})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lease Commencement Date *</label>
              <input
                type="date"
                required
                value={leaseForm.startDate}
                onChange={(e) => setLeaseForm({ ...leaseForm, startDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lease Expiration Date *</label>
              <input
                type="date"
                required
                value={leaseForm.endDate}
                onChange={(e) => setLeaseForm({ ...leaseForm, endDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Monthly Rent ($) *</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={leaseForm.rentAmount}
                onChange={(e) => setLeaseForm({ ...leaseForm, rentAmount: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Service Charges ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={leaseForm.recurringCharges}
                onChange={(e) => setLeaseForm({ ...leaseForm, recurringCharges: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Security Deposit ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={leaseForm.depositAmount}
                onChange={(e) => setLeaseForm({ ...leaseForm, depositAmount: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Due Day of Month</label>
              <input
                type="number"
                min={1}
                max={28}
                value={leaseForm.dueDay}
                onChange={(e) => setLeaseForm({ ...leaseForm, dueDay: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Grace Period (Days)</label>
              <input
                type="number"
                min={0}
                value={leaseForm.gracePeriodDays}
                onChange={(e) => setLeaseForm({ ...leaseForm, gracePeriodDays: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Late Fee Rate (%)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={leaseForm.lateFeePercentage}
                onChange={(e) => setLeaseForm({ ...leaseForm, lateFeePercentage: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Covenants & Legal Terms</label>
            <textarea
              rows={2}
              value={leaseForm.terms}
              onChange={(e) => setLeaseForm({ ...leaseForm, terms: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewLeaseModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold">
              Execute Lease Agreement
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Renew Lease */}
      <Modal isOpen={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title={`Renew Lease: ${selectedLease?.leaseNumber}`}>
        <form onSubmit={handleRenewLease} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">New Expiration Date *</label>
            <input
              type="date"
              required
              value={renewForm.newEndDate}
              onChange={(e) => setRenewForm({ ...renewForm, newEndDate: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">New Monthly Rent ($) *</label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={renewForm.newRentAmount}
              onChange={(e) => setRenewForm({ ...renewForm, newRentAmount: Number(e.target.value) })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Amendment Rationale *</label>
            <input
              type="text"
              required
              placeholder="e.g. 2-year option exercised with 5% indexation."
              value={renewForm.reason}
              onChange={(e) => setRenewForm({ ...renewForm, reason: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRenewModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold">
              Confirm Renewal
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Terminate Lease */}
      <Modal isOpen={isTerminateModalOpen} onClose={() => setIsTerminateModalOpen(false)} title={`Terminate Lease: ${selectedLease?.leaseNumber}`}>
        <form onSubmit={handleTerminateLease} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
            Terminating this contract will immediately return unit{' '}
            <span className="font-bold">{selectedLease?.shop?.shopNumber}</span> back to VACANT inventory.
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Effective Termination Date *</label>
            <input
              type="date"
              required
              value={terminateForm.terminationDate}
              onChange={(e) => setTerminateForm({ ...terminateForm, terminationDate: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Termination Justification *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mutual cessation, end of contract tenure..."
              value={terminateForm.reason}
              onChange={(e) => setTerminateForm({ ...terminateForm, reason: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTerminateModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">
              Execute Termination
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
