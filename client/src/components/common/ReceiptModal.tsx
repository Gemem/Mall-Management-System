import React from 'react';
import { Modal } from './Modal.js';
import { Receipt } from '../../types/index.js';
import { Printer, CheckCircle, Building2 } from 'lucide-react';

interface ReceiptModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, isOpen, onClose }) => {
  if (!receipt || !receipt.payment) return null;

  const payment = receipt.payment;
  const tenant = payment.tenant;
  const allocations = payment.allocations || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Settlement Receipt" maxWidth="2xl">
      <div id="printable-receipt" className="space-y-6 text-slate-800 dark:text-slate-100">
        {/* Receipt Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-600 text-white rounded-xl shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">STARLIGHT GALLERIA</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">8500 Grand Boulevard, Metropolis, NY 10021</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              Receipt Verified
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{receipt.receiptNumber}</p>
          </div>
        </div>

        {/* Transaction Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Payer / Tenant</span>
            <span className="font-bold text-slate-900 dark:text-white">{tenant?.companyName || 'Valued Tenant'}</span>
            <span className="text-xs text-slate-600 dark:text-slate-300 block">{tenant?.contactPerson}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Payment Method</span>
            <span className="font-semibold text-slate-900 dark:text-white">{payment.paymentMethod.replace('_', ' ')}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Ref: {payment.referenceNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Date & Time</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {new Date(payment.transactionDate).toLocaleDateString()}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Posted & Cleared
            </span>
          </div>
        </div>

        {/* Allocations breakdown */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Obligation Settlement Breakdown
          </h4>
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold text-left">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Shop Unit</th>
                  <th className="py-2.5 px-4 text-right">Allocated Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {allocations.map((alloc) => (
                  <tr key={alloc.id}>
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">{alloc.invoice.invoiceNumber}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                      {alloc.invoice.lease?.shop?.shopNumber || 'Assigned Unit'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      ${(alloc.amountAllocated / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-center text-slate-500 italic">
                      Direct unallocated advance / credit entry
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-800">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-slate-700 dark:text-slate-200">Total Cleared Payment</td>
                  <td className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400 text-base">
                    ${(payment.amount / 100).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer notes */}
        <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p>Authorized Cashier / Finance Desk: {payment.recordedBy?.name || 'Treasury Operations'}</p>
            <p className="italic text-slate-400 dark:text-slate-500">Electronic verification code: {payment.id.substring(0, 12)}</p>
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
};
