import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { InvoiceStatusBadge, PriorityBadge, MaintenanceStatusBadge } from '../components/common/Badge.js';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  Clock,
  Wrench,
  DollarSign,
  Store,
  FileText,
  CreditCard,
  PlusCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Megaphone,
  CheckCircle2,
  Receipt,
  FolderLock,
  Lock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState(false);

  const role = user?.role || 'MALL_OWNER';
  const isExecutive = role === 'MALL_OWNER' || role === 'MALL_MANAGER';

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboard();
      setMetrics(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRunChecks = async () => {
    try {
      setRunningJob(true);
      const res = await api.triggerAutomatedChecks();
      showToast(res.message || 'Automated checks completed', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setRunningJob(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading Mall Operations Intelligence...</p>
        </div>
      </div>
    );
  }

  const kpis = metrics?.kpis;

  // =========================================================================
  // VIEW 1: RETAIL TENANT SELF-SERVICE PORTAL
  // Strictly isolates tenant's store, personal dues, tickets and bulletins
  // Hides mall-wide cash earned, revenue charts, and other tenants' agreements
  // =========================================================================
  if (role === 'TENANT') {
    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Tenant Portal Dashboard
              </h1>
              <span className="bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Store Self-Service
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span> ({user?.tenant?.companyName || 'Retail Tenant'}). Manage your store space, invoices and service requests.
            </p>
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm transition-colors self-start sm:self-center"
            title="Refresh Portal"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tenant KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Leased Store Unit(s)</span>
              <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis?.myShopsCount || 1}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Active Tenancy
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {metrics?.myShops?.[0]?.shopNumber ? `Unit: ${metrics.myShops[0].shopNumber}` : 'Trading Floor Access'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Current Rent Due</span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                ${((kpis?.myOutstandingBalance || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
              <Link to="/billing" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                View My Invoices <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">My Service Requests</span>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis?.myOpenTicketsCount || 0}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Tickets</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
              <Link to="/maintenance" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                Request Work Order <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Store Status</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">OPEN & TRADING</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Daily Hours: 10:00 - 21:00
            </div>
          </div>
        </div>

        {/* Tenant Details & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tenant Invoices */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Rent Statements</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your latest billed lease charges and payments</p>
              </div>
              <Link to="/billing" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
                View All →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 font-semibold text-left">
                    <th className="pb-2.5">Invoice #</th>
                    <th className="pb-2.5">Due Date</th>
                    <th className="pb-2.5 text-right">Balance Due</th>
                    <th className="pb-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {metrics?.myInvoices && metrics.myInvoices.length > 0 ? (
                    metrics.myInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                          ${(inv.amountOutstanding / 100).toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                        No outstanding statements.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mall Bulletins */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Mall Bulletins & Circulars</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Official management announcements and schedules</p>
              </div>
              <Link to="/announcements" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
                All Bulletins →
              </Link>
            </div>

            <div className="space-y-3">
              {metrics?.announcements && metrics.announcements.length > 0 ? (
                metrics.announcements.map((ann: any) => (
                  <div key={ann.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{ann.title}</span>
                      <span className="text-[10px] text-slate-400">{new Date(ann.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{ann.content}</p>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-slate-400 italic text-xs">No active bulletins published.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MAINTENANCE & FACILITY OPERATIONS DASHBOARD
  // Work orders, SLA tracking, physical repair queues
  // Hides all financial figures, cash earned, charts, and lease contracts
  // =========================================================================
  if (role === 'MAINTENANCE') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Maintenance & Facility Operations Hub
              </h1>
              <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Facilities & Work Orders
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span> (Maintenance Staff). Real-time repairs, equipment SLAs and unit work notes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/maintenance?action=new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Log Repair Ticket
            </Link>
            <button
              onClick={loadData}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Maintenance KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Open Work Orders</span>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis?.openTicketsCount || 0}</span>
              <span className="text-xs text-slate-500 font-medium">Awaiting Resolution</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
              <Link to="/maintenance" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                Open Kanban Board <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Urgent SLA Tickets</span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{kpis?.urgentTicketsCount || 0}</span>
              <span className="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">High Priority</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Immediate inspection requested
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Units Under Repair</span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{kpis?.maintenanceShops || 0}</span>
              <span className="text-xs text-slate-500 font-medium">Shops Suspended</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Facility contractor sign-off needed
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Trading Operations</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis?.operatingShops || 0}</span>
              <span className="text-xs text-slate-500 font-medium">of {kpis?.totalShops || 0} Units Open</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Physical facility operational
            </div>
          </div>
        </div>

        {/* Work Order Queue Table */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Facility Repair Queue</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">All submitted work requests across retail spaces and common areas</p>
            </div>
            <Link to="/maintenance" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
              Inspect Full Board →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 font-semibold text-left">
                  <th className="pb-2.5">Ticket #</th>
                  <th className="pb-2.5">Shop Unit & Tenant</th>
                  <th className="pb-2.5">Issue Title</th>
                  <th className="pb-2.5 text-center">Priority</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {metrics?.recentTickets && metrics.recentTickets.length > 0 ? (
                  metrics.recentTickets.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-white">{t.ticketNumber}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Unit: {t.shop?.shopNumber || 'Common Area'}</span>
                        <span className="block text-[11px] text-slate-400">{t.tenant?.companyName || 'General Facility'}</span>
                      </td>
                      <td className="py-2.5 font-medium text-slate-700 dark:text-slate-300">{t.title}</td>
                      <td className="py-2.5 text-center">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-2.5 text-right">
                        <MaintenanceStatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      Zero active work tickets pending.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: ACCOUNTANT DASHBOARD
  // Operational ledger, billing counts, payment allocations, arrears list
  // Hides total executive profit charts and property owner lease agreements
  // =========================================================================
  if (role === 'ACCOUNTANT') {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Billing & Collections Operations Hub
              </h1>
              <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Accounting Ledger
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span> (Accountant). Manage invoices, payment reconciliations, receipts and arrears follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to="/payments?action=new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" /> Record Payment
            </Link>
            <button
              onClick={loadData}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Accountant KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Billing Cycle Invoices</span>
              <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis?.invoicesCount || 0}</span>
              <span className="text-xs text-slate-500 font-medium">Statements Posted</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
              <Link to="/billing" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                View Invoices <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cleared Transactions</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{kpis?.paymentsCount || 0}</span>
              <span className="text-xs text-slate-500 font-medium">Payments Logged</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium">
              <Link to="/payments" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
                Payments Ledger <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Overdue Delinquencies</span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{kpis?.overdueCount || 0}</span>
              <span className="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">Past Due</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Actionable for collections
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Arrears Recovery Target</span>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                ${((kpis?.overdueTotalAmount || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Unsettled rent balance
            </div>
          </div>
        </div>

        {/* Delinquent Accounts Table */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delinquent Accounts Ledger</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Unsettled tenant balances requiring payment follow-up</p>
            </div>
            <Link to="/billing?status=OVERDUE" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">
              View All Overdue →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 font-semibold text-left">
                  <th className="pb-2.5">Invoice #</th>
                  <th className="pb-2.5">Tenant & Unit</th>
                  <th className="pb-2.5">Due Date</th>
                  <th className="pb-2.5 text-right">Balance Due</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {metrics?.allOverdueInvoices && metrics.allOverdueInvoices.length > 0 ? (
                  metrics.allOverdueInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{inv.tenant?.companyName}</span>
                        <span className="block text-[11px] text-slate-400">Unit: {inv.lease?.shop?.shopNumber}</span>
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                        ${(inv.amountOutstanding / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          to={`/payments?action=new&tenantId=${inv.tenantId}`}
                          className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-[11px]"
                        >
                          Collect
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      Zero overdue accounts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: FULL EXECUTIVE DASHBOARD (MALL_OWNER and MALL_MANAGER)
  // Has complete portfolio visibility: cash earned, monthly charts, agreements, audit logs
  // =========================================================================
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Intelligence Dashboard
            </h1>
            <span className="bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Full Portfolio Oversight
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span> ({user?.role?.replace('_', ' ')}). Comprehensive real-time status of Starlight Galleria.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunChecks}
            disabled={runningJob}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-600 dark:text-brand-400 ${runningJob ? 'animate-spin' : ''}`} />
            Run Overdue & Expiry Audit
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm transition-colors"
            title="Refresh Dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* High Priority Alerts (if overdue accounts or expiring leases exist) */}
      {(kpis && (kpis.overdueCount > 0 || kpis.expiringLeasesCount > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kpis.overdueCount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-600 text-white rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    {kpis.overdueCount} Overdue Rent Obligation{kpis.overdueCount > 1 ? 's' : ''}
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    Total outstanding arrears: <span className="font-bold">${((kpis.overdueTotalAmount || 0) / 100).toFixed(2)}</span>
                  </p>
                </div>
              </div>
              <Link
                to="/billing?status=OVERDUE"
                className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 shadow-sm"
              >
                Inspect Arrears
              </Link>
            </div>
          )}

          {kpis.expiringLeasesCount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-600 text-white rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {kpis.expiringLeasesCount} Lease Agreement{kpis.expiringLeasesCount > 1 ? 's' : ''} Expiring Soon
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Tenancies expiring within 30 days require renewal action.</p>
                </div>
              </div>
              <Link
                to="/leases?status=EXPIRING"
                className="text-xs font-bold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 shadow-sm"
              >
                View Expirations
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Primary KPI Grid (Cash Earned & Property Health) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Shops & Occupancy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Units</span>
            <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis?.totalShops}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {kpis?.occupancyRate}% Occupied
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{kpis?.occupiedShops} Occupied</span>
            <span>{kpis?.vacantShops} Vacant</span>
            <span>{kpis?.reservedShops} Reserved</span>
          </div>
        </div>

        {/* Operating Statuses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Operations</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis?.operatingShops}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Shops Trading</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{kpis?.temporarilyClosedShops} Temp Closed</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{kpis?.maintenanceShops} In Maintenance</span>
          </div>
        </div>

        {/* Financial: Cash Earned vs Expected Rent */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cash Earned & Collected</span>
            <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${((kpis?.collectedRent || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Cash In</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Billed: ${((kpis?.expectedRent || 0) / 100).toLocaleString()}</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">Due: ${((kpis?.outstandingBalance || 0) / 100).toLocaleString()}</span>
          </div>
        </div>

        {/* Maintenance Requests */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Maintenance</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{kpis?.openTicketsCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Tickets</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
            <span className="text-rose-600 dark:text-rose-400 font-bold">{kpis?.urgentTicketsCount} High/Urgent SLA</span>
            <Link to="/maintenance" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold flex items-center gap-1">
              Board <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Analytical Charts & Financial Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collection Trend Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Revenue & Cash Collection Trends</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comparison of total monthly invoiced obligations vs cash collected ($)</p>
            </div>
            <Link to="/reports" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
              Full Breakdown →
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val.toLocaleString()}`} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="billed" name="Billed Obligations" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Cash Collected" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operational Actions */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Operational Actions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Authorized administrative and transactional workflows</p>

            <div className="space-y-2.5">
              <Link
                to="/payments?action=new"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-slate-800 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span>Record Rent Payment</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/leases?action=new"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-slate-800 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Draft New Lease Contract</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              {role === 'MALL_OWNER' && (
                <Link
                  to="/users"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-slate-800 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>Manage User Approvals</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              )}

              <Link
                to="/floor-plan"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-slate-800 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span>Interactive Floor Plan</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" /> Executive Access
            </span>
            <span>Server Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Overdue Invoices & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Accounts Table */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Arrears & Overdue Obligations</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Unsettled accounts past grace period deadline</p>
            </div>
            <Link to="/billing?status=OVERDUE" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 font-semibold text-left">
                  <th className="pb-2.5">Invoice #</th>
                  <th className="pb-2.5">Tenant & Unit</th>
                  <th className="pb-2.5">Due Date</th>
                  <th className="pb-2.5 text-right">Balance Due</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {metrics?.allOverdueInvoices && metrics.allOverdueInvoices.length > 0 ? (
                  metrics.allOverdueInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{inv.tenant?.companyName}</span>
                        <span className="block text-[11px] text-slate-400 dark:text-slate-500">Unit: {inv.lease?.shop?.shopNumber}</span>
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                        ${(inv.amountOutstanding / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-slate-500 italic">
                      Zero overdue accounts recorded. Financial health optimal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Trail / Recent Activity */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Operational Activity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Audited events performed by staff & management</p>
            </div>
            {role === 'MALL_OWNER' && (
              <Link to="/audit-logs" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
                Audit Trail →
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shrink-0">
                    {log.action.substring(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {log.user?.name || 'System Scheduler'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                      {log.action} on <span className="font-medium text-slate-900 dark:text-white">{log.entity}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400 dark:text-slate-500 italic text-xs">No recent activity recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
