import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Tenant } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Modal } from '../components/common/Modal.js';
import { InvoiceStatusBadge } from '../components/common/Badge.js';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  ChevronRight,
  Store,
  DollarSign,
  AlertCircle,
  FileText,
  Wrench,
  FolderLock,
} from 'lucide-react';

export const TenantsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & drawers
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const [tenantForm, setTenantForm] = useState({
    companyName: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    taxId: '',
    registrationNumber: '',
    emergencyContact: '',
    notes: '',
  });

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await api.getTenants({ search, status: statusFilter });
      setTenants(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTenants();
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTenant({
        ...tenantForm,
        name: tenantForm.companyName,
      });
      showToast('Tenant registered successfully', 'success');
      setIsNewTenantModalOpen(false);
      setTenantForm({
        companyName: '',
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        taxId: '',
        registrationNumber: '',
        emergencyContact: '',
        notes: '',
      });
      await loadTenants();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const viewTenantDetails = async (tenant: Tenant) => {
    try {
      const full = await api.getTenantById(tenant.id);
      setSelectedTenant(full);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const canManage = user?.role === 'MALL_OWNER' || user?.role === 'MALL_MANAGER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            Tenants & Business Partners
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Directory of retail brands, corporate operators, tenancy contracts and consolidated accounts ledger.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsNewTenantModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Register New Tenant
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by company, trade brand, contact person, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Tenancy</option>
            <option value="INACTIVE">Inactive</option>
            <option value="FORMER">Former Tenant</option>
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
              <tr>
                <th className="py-3.5 px-4">Brand / Company</th>
                <th className="py-3.5 px-4">Key Contact</th>
                <th className="py-3.5 px-4">Leased Units</th>
                <th className="py-3.5 px-4 text-right">Outstanding Balance</th>
                <th className="py-3.5 px-4 text-center">Arrears Flag</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Loading tenants...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No tenants found matching criteria.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{t.companyName}</div>
                      <div className="text-[11px] text-slate-500">{t.name}</div>
                      {t.taxId && <div className="text-[10px] text-slate-400 font-mono">Tax ID: {t.taxId}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-semibold text-slate-800">{t.contactPerson}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" /> {t.email}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {t.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {t.leases && t.leases.length > 0 ? (
                          t.leases.map((l) => (
                            <span
                              key={l.id}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-mono font-bold"
                            >
                              {l.shop?.shopNumber}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No active unit</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-extrabold ${t.financials && t.financials.totalOutstanding > 0 ? 'text-slate-900' : 'text-emerald-700'}`}>
                        ${((t.financials?.totalOutstanding || 0) / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {t.financials && t.financials.overdueCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertCircle className="w-3 h-3" /> {t.financials.overdueCount} Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => viewTenantDetails(t)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                      >
                        Ledger & Profile <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Tenant */}
      <Modal isOpen={isNewTenantModalOpen} onClose={() => setIsNewTenantModalOpen(false)} title="Register Business Tenant">
        <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Luxury Retail LLC"
                value={tenantForm.companyName}
                onChange={(e) => setTenantForm({ ...tenantForm, companyName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Trade / Brand Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aura Haute Couture"
                value={tenantForm.name}
                onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Primary Contact Person *</label>
              <input
                type="text"
                required
                placeholder="e.g. Elena Rostova"
                value={tenantForm.contactPerson}
                onChange={(e) => setTenantForm({ ...tenantForm, contactPerson: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email *</label>
              <input
                type="email"
                required
                placeholder="e.g. contact@fashionhub.com"
                value={tenantForm.email}
                onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Telephone *</label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                value={tenantForm.phone}
                onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tax / VAT ID</label>
              <input
                type="text"
                placeholder="TX-1234567"
                value={tenantForm.taxId}
                onChange={(e) => setTenantForm({ ...tenantForm, taxId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">24/7 Emergency Facility Contact</label>
            <input
              type="text"
              placeholder="e.g. Duty Manager desk +1 (555) 999-8888"
              value={tenantForm.emergencyContact}
              onChange={(e) => setTenantForm({ ...tenantForm, emergencyContact: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewTenantModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold">
              Save Tenant Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Drawer: Detailed Tenant Financial Ledger & Leases */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{selectedTenant.companyName}</h2>
                <p className="text-xs text-slate-500">Contact: {selectedTenant.contactPerson} ({selectedTenant.email})</p>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close Drawer
              </button>
            </div>

            {/* Consolidated Ledger KPI Cards */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border text-xs text-center">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Billed</span>
                <span className="text-sm font-bold text-slate-900">
                  ${((selectedTenant.ledgerSummary?.totalBilled || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Cash Paid</span>
                <span className="text-sm font-bold text-emerald-700">
                  ${((selectedTenant.ledgerSummary?.totalPaid || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Balance Due</span>
                <span className="text-sm font-bold text-slate-900">
                  ${((selectedTenant.ledgerSummary?.totalOutstanding || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Overdue Arrears</span>
                <span className="text-sm font-bold text-rose-600">
                  ${((selectedTenant.ledgerSummary?.overdueAmount || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Active Leases */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Leased Retail Units & Tenancy Contracts
              </h4>
              <div className="space-y-2">
                {selectedTenant.leases?.map((lease) => (
                  <div key={lease.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{lease.shop?.shopNumber}</span>
                        <span className="text-slate-500 font-semibold">{lease.shop?.name}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[10px] text-slate-600">
                          {lease.leaseNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Term: {new Date(lease.startDate).toLocaleDateString()} to {new Date(lease.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">${(lease.rentAmount / 100).toLocaleString()}/mo</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">{lease.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Obligations */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recent Invoices & Payment Obligations
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Invoice #</th>
                      <th className="py-2.5 px-3 text-left">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTenant.invoices?.slice(0, 5).map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-3 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 text-right font-medium">${(inv.totalAmount / 100).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${(inv.amountOutstanding / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
