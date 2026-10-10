import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Invoice } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { InvoiceStatusBadge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  FileCheck,
  Building,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const now = new Date();
  const [genForm, setGenForm] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoices({ search, status: statusFilter });
      setInvoices(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.generateMonthlyInvoices(genForm);
      showToast(res.message || 'Monthly invoices generated', 'success');
      setIsGenerateModalOpen(false);
      await loadInvoices();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const canGenerate = user?.role === 'MALL_OWNER' || user?.role === 'ACCOUNTANT';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-600" />
            Rent Invoices & Billing Obligations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System-generated rent schedules, recurring service charges, overdue arrears and allocation status.
          </p>
        </div>

        {canGenerate && (
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Generate Monthly Invoices
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadInvoices();
          }}
          className="flex-1 relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by invoice #, tenant company, or shop number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-none font-medium"
          >
            <option value="">All Invoices</option>
            <option value="OVERDUE">Overdue Arrears</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="DUE_TODAY">Due Today</option>
            <option value="PAID">Fully Settled (Paid)</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Tenant / Brand</th>
                <th className="py-3.5 px-4">Shop Unit</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-right">Total Obligation</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No billing obligations found matching criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{inv.tenant?.companyName}</div>
                      <div className="text-[11px] text-slate-500">{inv.tenant?.contactPerson}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900">{inv.lease?.shop?.shopNumber}</span>
                      <span className="block text-[11px] text-slate-400">{inv.lease?.shop?.floor?.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                      ${(inv.totalAmount / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-medium">
                      ${(inv.amountPaid / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">
                      ${(inv.amountOutstanding / 100).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Generate Monthly Invoices */}
      <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Generate Monthly Rent Invoices">
        <form onSubmit={handleGenerateInvoices} className="space-y-4 text-xs">
          <p className="text-slate-600">
            This will scan all currently active lease contracts and automatically generate individual billing obligations for the selected calendar month if not already created.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Year *</label>
              <input
                type="number"
                required
                min={2020}
                max={2035}
                value={genForm.year}
                onChange={(e) => setGenForm({ ...genForm, year: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Month (1 - 12) *</label>
              <input
                type="number"
                required
                min={1}
                max={12}
                value={genForm.month}
                onChange={(e) => setGenForm({ ...genForm, month: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold">
              Run Batch Invoicing
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Invoice Details */}
      {selectedInvoice && (
        <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Invoice: ${selectedInvoice.invoiceNumber}`} maxWidth="lg">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border">
              <div>
                <span className="text-slate-400 block text-[10px]">Payer / Tenant</span>
                <span className="font-bold text-slate-900 text-sm">{selectedInvoice.tenant?.companyName}</span>
                <span className="text-[11px] text-slate-500 block">Unit: {selectedInvoice.lease?.shop?.shopNumber}</span>
              </div>
              <InvoiceStatusBadge status={selectedInvoice.status} />
            </div>

            <div className="grid grid-cols-3 gap-2 border p-3 rounded-xl bg-white text-center">
              <div>
                <span className="text-slate-400 block text-[10px]">Base Rent</span>
                <span className="font-bold text-slate-900">${(selectedInvoice.baseRent / 100).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Service Charges</span>
                <span className="font-bold text-slate-900">${(selectedInvoice.recurringCharges / 100).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Late Fee</span>
                <span className="font-bold text-rose-600">${(selectedInvoice.lateFee / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border text-center font-bold">
              <div>
                <span className="text-slate-400 block text-[10px] font-normal">Total Obligation</span>
                <span className="text-slate-900">${(selectedInvoice.totalAmount / 100).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-normal">Amount Paid</span>
                <span className="text-emerald-700">${(selectedInvoice.amountPaid / 100).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-normal">Remaining Due</span>
                <span className="text-rose-600">${(selectedInvoice.amountOutstanding / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Allocations */}
            <div>
              <h4 className="font-bold text-slate-700 mb-2">Payment Settlements Allocated</h4>
              {selectedInvoice.allocations && selectedInvoice.allocations.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedInvoice.allocations.map((a) => (
                    <div key={a.id} className="flex justify-between p-2.5 rounded-lg border bg-slate-50">
                      <span>Payment Reference #{a.payment?.paymentNumber || a.paymentId}</span>
                      <span className="font-bold text-emerald-700">${(a.amountAllocated / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No payments have been allocated to this invoice yet.</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
