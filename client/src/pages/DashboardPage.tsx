import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { DashboardMetrics } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { InvoiceStatusBadge } from '../components/common/Badge.js';
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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState(false);

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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Executive Dashboard
            </h1>
            <span className="bg-brand-100 text-brand-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Live Operations
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{user?.name}</span> ({user?.role?.replace('_', ' ')}). Comprehensive real-time status of Starlight Galleria.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {user?.role !== 'TENANT' && (
            <button
              onClick={handleRunChecks}
              disabled={runningJob}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${runningJob ? 'animate-spin' : ''}`} />
              Run Overdue & Expiry Audit
            </button>
          )}
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm transition-colors"
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
            <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-600 text-white rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-900">
                    {kpis.overdueCount} Overdue Rent Obligation{kpis.overdueCount > 1 ? 's' : ''}
                  </h4>
                  <p className="text-xs text-rose-700">
                    Total outstanding arrears: <span className="font-bold">${((kpis.overdueTotalAmount || 0) / 100).toFixed(2)}</span>
                  </p>
                </div>
              </div>
              <Link
                to="/billing?status=OVERDUE"
                className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-white px-3 py-1.5 rounded-lg border border-rose-300 shadow-sm"
              >
                Inspect Arrears
              </Link>
            </div>
          )}

          {kpis.expiringLeasesCount > 0 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-600 text-white rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {kpis.expiringLeasesCount} Lease Agreement{kpis.expiringLeasesCount > 1 ? 's' : ''} Expiring Soon
                  </h4>
                  <p className="text-xs text-amber-700">Tenancies expiring within the next 30 days require renewal action.</p>
                </div>
              </div>
              <Link
                to="/leases?status=EXPIRING"
                className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-sm"
              >
                View Expirations
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Shops & Occupancy */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Units</span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{kpis?.totalShops}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {kpis?.occupancyRate}% Occupied
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{kpis?.occupiedShops} Occupied</span>
            <span>{kpis?.vacantShops} Vacant</span>
            <span>{kpis?.reservedShops} Reserved</span>
          </div>
        </div>

        {/* Operating Statuses */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operations</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{kpis?.operatingShops}</span>
            <span className="text-xs text-slate-500 font-medium">Shops Trading</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="text-amber-600 font-semibold">{kpis?.temporarilyClosedShops} Temp Closed</span>
            <span className="text-indigo-600 font-semibold">{kpis?.maintenanceShops} In Maintenance</span>
          </div>
        </div>

        {/* Financial: Expected vs Collected */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Period Rent</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              ${((kpis?.collectedRent || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-500 font-medium">Collected</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Billed: ${((kpis?.expectedRent || 0) / 100).toLocaleString()}</span>
            <span className="text-rose-600 font-bold">Due: ${((kpis?.outstandingBalance || 0) / 100).toLocaleString()}</span>
          </div>
        </div>

        {/* Maintenance Requests */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Maintenance</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{kpis?.openTicketsCount}</span>
            <span className="text-xs text-slate-500 font-medium">Active Tickets</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-rose-600 font-bold">{kpis?.urgentTicketsCount} High/Urgent SLA</span>
            <Link to="/maintenance" className="text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
              Board <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Analytical Charts & Financial Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collection Trend Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue & Cash Collection Trends</h3>
              <p className="text-xs text-slate-500">Comparison of total monthly invoiced obligations vs cash collected ($)</p>
            </div>
            <Link to="/reports" className="text-xs font-bold text-brand-600 hover:text-brand-700">
              Full Breakdown →
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Operational Actions</h3>
            <p className="text-xs text-slate-500 mb-4">Authorized administrative and transactional workflows</p>

            <div className="space-y-2.5">
              {(user?.role === 'MALL_OWNER' || user?.role === 'ACCOUNTANT') && (
                <Link
                  to="/payments?action=new"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span>Record Rent Payment</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              )}

              {(user?.role === 'MALL_OWNER' || user?.role === 'MALL_MANAGER') && (
                <Link
                  to="/leases?action=new"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-800">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>Draft New Lease Contract</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              )}

              <Link
                to="/maintenance?action=new"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span>Log Maintenance Request</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              {(user?.role === 'MALL_OWNER' || user?.role === 'MALL_MANAGER') && (
                <Link
                  to="/floor-plan"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-800">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span>Interactive Floor Plan</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> RBAC Enforced
            </span>
            <span>Server Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Overdue Invoices & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Accounts Table */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Arrears & Overdue Obligations</h3>
              <p className="text-xs text-slate-500">Unsettled accounts past grace period deadline</p>
            </div>
            <Link to="/billing?status=OVERDUE" className="text-xs font-bold text-brand-600 hover:text-brand-700">
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead>
                <tr className="text-slate-500 font-semibold text-left">
                  <th className="pb-2.5">Invoice #</th>
                  <th className="pb-2.5">Tenant & Unit</th>
                  <th className="pb-2.5">Due Date</th>
                  <th className="pb-2.5 text-right">Balance Due</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.allOverdueInvoices && metrics.allOverdueInvoices.length > 0 ? (
                  metrics.allOverdueInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2.5">
                        <span className="font-semibold text-slate-800">{inv.tenant.companyName}</span>
                        <span className="block text-[11px] text-slate-400">Unit: {inv.lease?.shop?.shopNumber}</span>
                      </td>
                      <td className="py-2.5 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-2.5 text-right font-bold text-rose-600">
                        ${(inv.amountOutstanding / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      Zero overdue accounts recorded. Financial health optimal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Trail / Recent Activity */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Operational Activity</h3>
              <p className="text-xs text-slate-500">Audited events performed by staff & management</p>
            </div>
            {user?.role === 'MALL_OWNER' && (
              <Link to="/audit-logs" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                Audit Trail →
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="p-1.5 rounded-lg bg-slate-200 text-slate-700 font-bold shrink-0">
                    {log.action.substring(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {log.user?.name || 'System Scheduler'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 truncate">
                      {log.action} on <span className="font-medium text-slate-900">{log.entity}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400 italic text-xs">No recent activity recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
