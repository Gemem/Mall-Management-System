import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { MaintenanceTicket, Shop, MaintenanceStatus, MaintenancePriority } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { MaintenanceStatusBadge, PriorityBadge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Send,
  Lock,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const MaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals & drawers
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(searchParams.get('action') === 'new');
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);

  // Forms
  const [ticketForm, setTicketForm] = useState({
    shopId: '',
    title: '',
    description: '',
    category: 'HVAC',
    priority: 'MEDIUM' as MaintenancePriority,
  });

  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);

  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: 'IN_PROGRESS' as MaintenanceStatus,
    resolutionNotes: '',
    estimatedCost: 0,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, shopsData] = await Promise.all([
        api.getTickets({ search, status: statusFilter, priority: priorityFilter }),
        api.getShops(),
      ]);
      setTickets(ticketsData);
      setShops(shopsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load maintenance requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTicket(ticketForm);
      showToast('Maintenance work order submitted', 'success');
      setIsNewTicketModalOpen(false);
      setTicketForm({
        shopId: '',
        title: '',
        description: '',
        category: 'HVAC',
        priority: 'MEDIUM',
      });
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleViewTicket = async (ticket: MaintenanceTicket) => {
    try {
      const fullTicket = await api.getTicketById(ticket.id);
      setSelectedTicket(fullTicket);
      setStatusUpdateForm({
        status: fullTicket.status,
        resolutionNotes: fullTicket.resolutionNotes || '',
        estimatedCost: fullTicket.estimatedCost ? fullTicket.estimatedCost / 100 : 0,
      });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !commentText.trim()) return;

    try {
      await api.addComment(selectedTicket.id, {
        message: commentText,
        isInternal: isInternalComment,
      });
      setCommentText('');
      const refreshed = await api.getTicketById(selectedTicket.id);
      setSelectedTicket(refreshed);
      showToast('Work note added', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      await api.updateTicket(selectedTicket.id, {
        status: statusUpdateForm.status,
        resolutionNotes: statusUpdateForm.resolutionNotes,
        estimatedCost: Math.round(Number(statusUpdateForm.estimatedCost) * 100),
      });
      showToast('Ticket status updated', 'success');
      const refreshed = await api.getTicketById(selectedTicket.id);
      setSelectedTicket(refreshed);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const isStaff = user?.role !== 'TENANT';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Facility Maintenance Work Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Service requests, repair dispatches, mechanical SLAs and staff resolution logs.
          </p>
        </div>

        <button
          onClick={() => setIsNewTicketModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Log Maintenance Request
        </button>
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
            placeholder="Search by ticket #, description, title, or shop unit..."
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
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent SLA</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500">Loading work orders...</div>
        ) : tickets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500">
            No maintenance tickets found matching active criteria.
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => handleViewTicket(t)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{t.ticketNumber}</span>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={t.priority} />
                    <MaintenanceStatusBadge status={t.status} />
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-3 line-clamp-1">{t.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{t.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Unit: {t.shop?.shopNumber}</span>
                <span className="flex items-center gap-1 text-[11px]">
                  <MessageSquare className="w-3.5 h-3.5" /> {t._count?.comments || 0} notes
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Ticket */}
      <Modal isOpen={isNewTicketModalOpen} onClose={() => setIsNewTicketModalOpen(false)} title="Log Facility Maintenance Request">
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Retail Unit *</label>
            <select
              required
              value={ticketForm.shopId}
              onChange={(e) => setTicketForm({ ...ticketForm, shopId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
            >
              <option value="">Select Shop Unit</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shopNumber} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Service Category *</label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="HVAC">HVAC / Air Conditioning</option>
                <option value="PLUMBING">Plumbing & Water</option>
                <option value="ELECTRICAL">Electrical & Lighting</option>
                <option value="STRUCTURAL">Structural & Glass</option>
                <option value="CLEANING">Sanitation & Cleaning</option>
                <option value="SECURITY">Security & Access</option>
                <option value="OTHER">Other Facility Matter</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Severity / Priority *</label>
              <select
                value={ticketForm.priority}
                onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as MaintenancePriority })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="LOW">Low (Routine)</option>
                <option value="MEDIUM">Medium (Standard)</option>
                <option value="HIGH">High (Urgent Attention)</option>
                <option value="URGENT">Urgent (Immediate Safety/Trade Halt)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Summary Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Condenser coil rattling during peak hours"
              value={ticketForm.title}
              onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide exact location inside unit, symptoms, timing, and impact on operations..."
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewTicketModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold">
              Dispatch Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Drawer: Detailed Ticket View with Comments & Status Workflow */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">{selectedTicket.ticketNumber}</span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{selectedTicket.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close Drawer
              </button>
            </div>

            {/* Badges and Unit */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Shop Unit</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTicket.shop?.shopNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Priority</span>
                <PriorityBadge priority={selectedTicket.priority} />
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Status</span>
                <MaintenanceStatusBadge status={selectedTicket.status} />
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Issue Description</span>
              {selectedTicket.description}
            </div>

            {/* Status Transition (Staff only) */}
            {isStaff && (
              <form onSubmit={handleUpdateStatus} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">Update Ticket Status & Resolution</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Ticket Status</label>
                    <select
                      value={statusUpdateForm.status}
                      onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value as MaintenanceStatus })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-bold"
                    >
                      <option value="OPEN">Open</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING">Waiting on Parts</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Cost Incurred ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={statusUpdateForm.estimatedCost}
                      onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, estimatedCost: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Resolution Details</label>
                  <input
                    type="text"
                    placeholder="Work performed, replaced part numbers, sign-off..."
                    value={statusUpdateForm.resolutionNotes}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, resolutionNotes: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-brand-600 dark:hover:bg-brand-700 text-white font-bold text-xs">
                    Save Resolution Update
                  </button>
                </div>
              </form>
            )}

            {/* Comments Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Work Notes & Activity Log
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedTicket.comments?.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      c.isInternal
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <span>{c.user?.name}</span>
                        {c.isInternal && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            <Lock className="w-2.5 h-2.5" /> Staff Internal
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{c.message}</p>
                  </div>
                ))}
              </div>

              {/* Add comment input */}
              <form onSubmit={handleAddComment} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type work note or tenant response..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-brand-500"
                  />
                  <button type="submit" className="p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {isStaff && (
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded text-brand-600"
                    />
                    <span>Mark as internal staff work note (hidden from tenant)</span>
                  </label>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
