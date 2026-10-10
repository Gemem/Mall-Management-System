import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.js';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Building,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [aging, setAging] = useState<any>(null);
  const [occupancy, setOccupancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const [sumData, agingData, occData] = await Promise.all([
          api.getReportSummary(),
          api.getAgingReceivables(),
          api.getOccupancyReport(),
        ]);
        setSummary(sumData);
        setAging(agingData);
        setOccupancy(occData);
      } catch (err: any) {
        showToast(err.message || 'Failed to load analytical reports', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const handleDownloadCsv = (type: string) => {
    const token = api.getToken();
    const url = `/api/v1/reports/export-csv?type=${type}`;
    // Fetch with auth and trigger browser download
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to generate CSV export');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast(`Exported ${type} report to CSV`, 'success');
      })
      .catch((err) => {
        showToast(err.message, 'error');
      });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Compiling financial & occupancy reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            Executive Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Period billing reconciliation, aging receivables, cash collections, and portfolio occupancy.
          </p>
        </div>

        {/* CSV Export Quick Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadCsv('invoices')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition-colors border border-transparent dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" /> Invoices CSV
          </button>
          <button
            onClick={() => handleDownloadCsv('payments')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition-colors border border-transparent dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" /> Payments CSV
          </button>
          <button
            onClick={() => handleDownloadCsv('shops')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition-colors border border-transparent dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" /> Inventory CSV
          </button>
        </div>
      </div>

      {/* Financial Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Billed Obligations</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            ${((summary?.totalBilled || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">{summary?.invoiceCount} Posted Invoices</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Cash Collected</span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
            ${((summary?.totalCollected || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">{summary?.paymentCount} Cleared Transactions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Total Outstanding</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            ${((summary?.totalOutstanding || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Active Receivables</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Overdue Arrears</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            ${((summary?.totalOverdue || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1 block">Past Due Date</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Collection Rate</span>
          <span className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1 block">
            {summary?.collectionRate}%
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Realization Efficiency</span>
        </div>
      </div>

      {/* Aging Receivables Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Aging Receivables Analysis</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Delinquency distribution of uncollected rent across aging aging tranches</p>
        </div>

        {/* Tranches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Current (0 - 30 Days)</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              ${((aging?.buckets?.current?.total || 0) / 100).toFixed(2)}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{aging?.buckets?.current?.count || 0} Invoices</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">31 - 60 Days Overdue</span>
            <span className="text-xl font-extrabold text-amber-900 dark:text-amber-200 mt-1 block">
              ${((aging?.buckets?.days30to60?.total || 0) / 100).toFixed(2)}
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">{aging?.buckets?.days30to60?.count || 0} Invoices</span>
          </div>

          <div className="p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50">
            <span className="text-xs font-bold text-orange-800 dark:text-orange-300 block">61 - 90 Days Overdue</span>
            <span className="text-xl font-extrabold text-orange-900 dark:text-orange-200 mt-1 block">
              ${((aging?.buckets?.days60to90?.total || 0) / 100).toFixed(2)}
            </span>
            <span className="text-[11px] text-orange-700 dark:text-orange-400">{aging?.buckets?.days60to90?.count || 0} Invoices</span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">90+ Days Critical Arrears</span>
            <span className="text-xl font-extrabold text-rose-900 dark:text-rose-200 mt-1 block">
              ${((aging?.buckets?.days90Plus?.total || 0) / 100).toFixed(2)}
            </span>
            <span className="text-[11px] text-rose-700 dark:text-rose-400">{aging?.buckets?.days90Plus?.count || 0} Invoices</span>
          </div>
        </div>

        {/* Tenant Aging Breakdown Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold text-left">
              <tr>
                <th className="py-3 px-4">Tenant / Business</th>
                <th className="py-3 px-4">Occupied Unit(s)</th>
                <th className="py-3 px-4">Oldest Overdue Date</th>
                <th className="py-3 px-4 text-center">Days Delinquent</th>
                <th className="py-3 px-4 text-right">Total Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {aging?.tenants && aging.tenants.length > 0 ? (
                aging.tenants.map((t: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{t.tenantName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{t.shopNumbers.join(', ')}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{new Date(t.oldestDueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        {t.daysOverdue} days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                      ${(t.totalOutstanding / 100).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-slate-500 italic">
                    Zero delinquent accounts in aging report.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Occupancy and Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Floor */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Occupancy Distribution by Floor</h3>
          <div className="space-y-3">
            {occupancy?.byFloor?.map((floor: any, idx: number) => {
              const occPercent = floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0;
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800 dark:text-slate-200">{floor.floorName}</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {floor.occupied} / {floor.total} Units ({occPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-brand-600 h-full rounded-full" style={{ width: `${occPercent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Category */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Retail Units by Business Category</h3>
          <div className="grid grid-cols-2 gap-3">
            {occupancy?.byCategory?.map((cat: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">{cat.category}</span>
                <span className="text-slate-500 dark:text-slate-400 mt-1 block font-semibold">{cat.count} Units</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
