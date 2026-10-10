import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { User, UserRole, Tenant } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Modal } from '../components/common/Modal.js';
import {
  UserCheck,
  UserX,
  UserPlus,
  Search,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Trash2,
  ShieldAlert,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal: Provision New User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TENANT' as UserRole,
    phone: '',
    tenantId: '',
    isApproved: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, tenantsData] = await Promise.all([
        api.getUsers(),
        api.getTenants(),
      ]);
      setUsers(usersData);
      setTenants(tenantsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load user records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    try {
      await api.approveUser(id);
      showToast(`Access granted! ${name} is now approved to sign in.`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!window.confirm(`Revoke login access for ${name}? They will no longer be able to log in.`)) return;
    try {
      await api.revokeUser(id);
      showToast(`Access revoked for ${name}. Account set to pending.`, 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Revocation failed', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete user account for ${name}?`)) return;
    try {
      await api.deleteUser(id);
      showToast(`User account ${name} deleted`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        ...form,
        tenantId: form.tenantId || undefined,
      });
      showToast(`User ${form.name} provisioned with approved credentials!`, 'success');
      setIsModalOpen(false);
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'TENANT',
        phone: '',
        tenantId: '',
        isApproved: true,
      });
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'User creation failed', 'error');
    }
  };

  const pendingUsers = users.filter((u) => !u.isApproved);
  const approvedUsers = users.filter((u) => u.isApproved);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && !u.isApproved) ||
      (statusFilter === 'APPROVED' && u.isApproved);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600" />
            User Access Governance & Approvals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review individual credential requests, grant system permissions, and provision staff & tenant accounts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Provision New User
        </button>
      </div>

      {/* Pending Approvals Urgent Alert Banner */}
      {pendingUsers.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-xl shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {pendingUsers.length} Individual Account{pendingUsers.length > 1 ? 's' : ''} Awaiting Your Approval
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                New staff or tenants have registered individual credentials and cannot log in until you grant permission.
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 self-start sm:self-center transition-colors"
          >
            Review Pending ({pendingUsers.length})
          </button>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
            Total System Credentials
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {users.length}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Registered Users</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
            Awaiting Owner Permission
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {pendingUsers.length}
          </span>
          <span className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 block font-semibold">
            Action Required
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider block">
            Approved & Active Access
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {approvedUsers.length}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Verified Logins</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name or email ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none font-semibold"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="PENDING">⏳ Pending Owner Approval</option>
            <option value="APPROVED">✓ Approved & Active</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none font-semibold"
          >
            <option value="ALL">All Roles</option>
            <option value="TENANT">Retail Tenant</option>
            <option value="MAINTENANCE">Maintenance Staff</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="MALL_MANAGER">Mall Manager</option>
            <option value="MALL_OWNER">Mall Owner</option>
          </select>
        </div>
      </div>

      {/* Users & Approvals Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold text-left">
              <tr>
                <th className="py-3.5 px-4">User / Name</th>
                <th className="py-3.5 px-4">Role & Scope</th>
                <th className="py-3.5 px-4">Contact & Tenant</th>
                <th className="py-3.5 px-4 text-center">Approval Status</th>
                <th className="py-3.5 px-4 text-right">Owner Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    Loading user credentials...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No user accounts found matching selected criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isOwnerAccount = u.role === 'MALL_OWNER';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        !u.isApproved ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 px-1.5 py-0.2 rounded font-normal">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono block">
                          {u.email}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${
                            u.role === 'MALL_OWNER'
                              ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : u.role === 'MALL_MANAGER'
                              ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : u.role === 'ACCOUNTANT'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : u.role === 'MAINTENANCE'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {u.tenant?.companyName ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {u.tenant.companyName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Mall Operations Staff</span>
                        )}
                        {u.phone && <span className="block text-[11px] text-slate-400 mt-0.5">{u.phone}</span>}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {u.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Owner Approval
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!u.isApproved ? (
                            <button
                              onClick={() => handleApprove(u.id, u.name)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                              title="Grant permission to sign in"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve Access
                            </button>
                          ) : (
                            !isOwnerAccount && (
                              <button
                                onClick={() => handleRevoke(u.id, u.name)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-300 text-[11px] font-medium"
                                title="Revoke approval"
                              >
                                Revoke
                              </button>
                            )
                          )}

                          {!isOwnerAccount && (
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal: Provision User Directly */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision New User Account">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            As the Mall Owner, creating a user here immediately activates their login credentials without waiting for further approval.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold"
              >
                <option value="TENANT">Retail Tenant</option>
                <option value="MAINTENANCE">Maintenance Staff</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="MALL_MANAGER">Mall Manager</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email / User ID *</label>
            <input
              type="email"
              required
              placeholder="e.g. jdoe@mall.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                placeholder="Temporary login password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
              />
            </div>
          </div>

          {form.role === 'TENANT' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Link to Tenant Business</label>
              <select
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold"
              >
                <option value="">Select Tenant Company</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.companyName} ({t.name})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold">
              Provision & Approve User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
