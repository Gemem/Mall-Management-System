import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Payment, Tenant, Receipt } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Modal } from '../components/common/Modal.js';
import { ReceiptModal } from '../components/common/ReceiptModal.js';
import {
  Receipt as ReceiptIcon,
  Plus,
  Search,
  RotateCcw,
  Printer,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Building,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(searchParams.get('action') === 'new');
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<Receipt | null>(null);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    tenantId: '',
    amount: 1000,
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
    transactionDate: new Date().toISOString().split('T')[0],
    notes: 'Direct wire settlement.',
    autoAllocate: true,
  });

  const [reversalReason, setReversalReason] = useState('');

  const isTenant = user?.role === 'TENANT';
  const canRecord = user?.role === 'MALL_OWNER' || user?.role === 'ACCOUNTANT';

  const loadData = async () => {
    try {
      setLoading(true);
      const isStaffOrOwner = user?.role === 'MALL_OWNER' || user?.role === 'ACCOUNTANT' || user?.role === 'MALL_MANAGER';
      const [paymentsData, tenantsData] = await Promise.all([
        api.getPayments({ search }),
        isStaffOrOwner ? api.getTenants() : Promise.resolve([]),
      ]);
      setPayments(paymentsData);
      setTenants(tenantsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.recordPayment({
        ...paymentForm,
        amount: Math.round(Number(paymentForm.amount) * 100),
      });
      showToast(`Payment ${res.payment.paymentNumber} posted and receipt generated`, 'success');
      setIsRecordModalOpen(false);
      setPaymentForm({
        tenantId: '',
        amount: 1000,
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: '',
        transactionDate: new Date().toISOString().split('T')[0],
        notes: '',
        autoAllocate: true,
      });
      await loadData();

      // Show receipt right away
      if (res.receipt) {
        const fullReceipt = await api.getReceipt(res.payment.id);
        setReceiptModalData(fullReceipt);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReversePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      const res = await api.reversePayment(selectedPayment.id, { reason: reversalReason });
      showToast(`Payment ${selectedPayment.paymentNumber} reversed. Invoices restored.`, 'success');
      setIsReverseModalOpen(false);
      setReversalReason('');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleViewReceipt = async (payment: Payment) => {
    try {
      const receipt = await api.getReceipt(payment.id);
      setReceiptModalData(receipt);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // KPI Calculations
  const activePayments = payments.filter((p) => p.status !== 'REVERSED');
  const totalSettledAmount = activePayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ReceiptIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            {isTenant ? 'My Payment History & Official Receipts' : 'Payments, Allocations & Digital Receipts'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isTenant
              ? 'Complete chronological record of all cleared rent payments, allocated invoices, and downloadable tax receipts.'
              : 'Cash receipts, multi-obligation allocations, traceable reversals and audit-grade financial ledgers.'}
          </p>
        </div>

        {canRecord && (
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Record Rent Payment
          </button>
        )}
      </div>

      {/* Tenant Payment Summary Cards */}
      {isTenant && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Settled Payments</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                ${(totalSettledAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-3 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified Transactions</p>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {activePayments.length} Cleared
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tenancy Account</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {user?.tenant?.companyName || 'Registered Leased Unit'}
              </p>
            </div>
          </div>
        </div>
      )}

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
            placeholder={
              isTenant
                ? 'Search by payment number, bank reference, or payment method...'
                : 'Search by payment #, reference number, or tenant...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold text-left">
              <tr>
                <th className="py-3.5 px-4">Payment #</th>
                {isTenant ? (
                  <th className="py-3.5 px-4">Invoices Settled</th>
                ) : (
                  <th className="py-3.5 px-4">Tenant / Payer</th>
                )}
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Method & Reference</th>
                <th className="py-3.5 px-4 text-right">Amount Settled</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Loading payment records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {isTenant
                      ? 'No payment transactions recorded yet. Once your rent payments are cleared by administration, verified digital receipts will appear here.'
                      : 'No payment transactions recorded.'}
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isReversed = p.status === 'REVERSED';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{p.paymentNumber}</td>
                      <td className="py-3.5 px-4">
                        {isTenant ? (
                          <div>
                            {p.allocations && p.allocations.length > 0 ? (
                              p.allocations.map((alloc) => (
                                <div key={alloc.id} className="font-semibold text-slate-800 dark:text-slate-200">
                                  {alloc.invoice?.invoiceNumber || 'Rent Invoice'}
                                  {alloc.invoice?.lease?.shop && (
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">
                                      (Shop {alloc.invoice.lease.shop.shopNumber})
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="font-semibold text-slate-700 dark:text-slate-300">Account Credit / Direct Allocation</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{p.tenant?.companyName}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{p.tenant?.contactPerson}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {new Date(p.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{p.paymentMethod.replace('_', ' ')}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">Ref: {p.referenceNumber || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white text-sm">
                        ${(p.amount / 100).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isReversed
                              ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewReceipt(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" /> Receipt
                          </button>
                          {canRecord && !isReversed && (
                            <button
                              onClick={() => {
                                setSelectedPayment(p);
                                setIsReverseModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-[11px] font-semibold transition-colors"
                              title="Authorized reversal"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Rent Payment */}
      <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title="Record Rent Payment & Allocate Funds" maxWidth="lg">
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Payer / Tenant *</label>
            <select
              required
              value={paymentForm.tenantId}
              onChange={(e) => setPaymentForm({ ...paymentForm, tenantId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
            >
              <option value="">Select Tenant</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.companyName} (${((t.financials?.totalOutstanding || 0) / 100).toFixed(2)} balance)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Amount ($) *</label>
              <input
                type="number"
                required
                min={0.01}
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="BANK_TRANSFER">Bank Wire / ACH</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
                <option value="CHECK">Certified Bank Check</option>
                <option value="CASH">Cash Treasury Deposit</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Transaction Reference #</label>
              <input
                type="text"
                placeholder="e.g. WIRE-8849201"
                value={paymentForm.referenceNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentForm.transactionDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <input
              type="checkbox"
              id="autoAllocate"
              checked={paymentForm.autoAllocate}
              onChange={(e) => setPaymentForm({ ...paymentForm, autoAllocate: e.target.checked })}
              className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
            <label htmlFor="autoAllocate" className="font-semibold cursor-pointer">
              Automatically distribute payment across oldest outstanding invoices (FIFO FIFO allocation)
            </label>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Internal Notes</label>
            <input
              type="text"
              placeholder="e.g. Bank confirmation email attached, approved by finance"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold">
              Post Payment & Generate Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reverse Payment */}
      <Modal isOpen={isReverseModalOpen} onClose={() => setIsReverseModalOpen(false)} title={`Authorize Payment Reversal: ${selectedPayment?.paymentNumber}`}>
        <form onSubmit={handleReversePayment} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Caution: Irreversible Financial Action
            </p>
            <p>
              Reversing this payment of <span className="font-bold">${((selectedPayment?.amount || 0) / 100).toFixed(2)}</span> will immediately restore the outstanding balance on all associated rent invoices. An immutable audit reversal event will be recorded.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Documented Reversal Reason *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Bounced check, duplicated electronic funds transfer, contested chargeback..."
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReverseModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">
              Authorize Reversal
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Printable Receipt Modal */}
      <ReceiptModal
        receipt={receiptModalData}
        isOpen={!!receiptModalData}
        onClose={() => setReceiptModalData(null)}
      />
    </div>
  );
};
