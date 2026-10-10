import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { AuditLog } from '../types/index.js';
import { useToast } from '../context/ToastContext.js';
import { ShieldAlert, Search, Filter, Clock, UserCheck, Terminal } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({
        entity: entityFilter,
        action: actionFilter,
      });
      setLogs(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit trail', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [entityFilter, actionFilter]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-brand-600" />
          System Security & Operational Audit Log
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tamper-evident record of all administrative, financial, operational and authentication actions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 font-medium"
        >
          <option value="">All Entities</option>
          <option value="Payment">Payment Transactions</option>
          <option value="Lease">Lease Contracts</option>
          <option value="Shop">Shop Units</option>
          <option value="Tenant">Tenants</option>
          <option value="Floor">Floors</option>
          <option value="User">User Authentication</option>
          <option value="MaintenanceTicket">Maintenance</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 font-medium"
        >
          <option value="">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="PAYMENT_RECORDED">PAYMENT_RECORDED</option>
          <option value="PAYMENT_REVERSED">PAYMENT_REVERSED</option>
          <option value="STATUS_CHANGE">STATUS_CHANGE</option>
          <option value="LOGIN">LOGIN</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-left font-sans">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">Details / Payload</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-sans">
                    Loading audit stream...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    Zero audit events matching filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      {log.user?.name || 'System Scheduler'}
                      <span className="block text-[10px] text-slate-400 font-normal">{log.user?.role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-800">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[120px]">
                      {log.entityId || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={log.details || ''}>
                      {log.details || '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
