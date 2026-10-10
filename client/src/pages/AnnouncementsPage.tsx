import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Announcement, Floor } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Modal } from '../components/common/Modal.js';
import { Megaphone, Plus, Bell, Calendar, Pin, AlertCircle } from 'lucide-react';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetScope: 'ALL',
    targetFloorId: '',
    priority: 'NORMAL',
    expiresAt: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [annData, floorData] = await Promise.all([
        api.getAnnouncements(),
        api.getFloors(),
      ]);
      setAnnouncements(annData);
      setFloors(floorData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAnnouncement({
        ...form,
        targetFloorId: form.targetFloorId || undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
      });
      showToast('Announcement broadcast published', 'success');
      setIsModalOpen(false);
      setForm({
        title: '',
        content: '',
        targetScope: 'ALL',
        targetFloorId: '',
        priority: 'NORMAL',
        expiresAt: '',
      });
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const canBroadcast = user?.role === 'MALL_OWNER' || user?.role === 'MALL_MANAGER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-brand-600" />
            Mall Operational Announcements & Bulletins
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official management notifications, safety drills, scheduled repairs and tenancy circulars.
          </p>
        </div>

        {canBroadcast && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Publish Announcement
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">No active bulletins published.</div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-2xl border transition-all ${
                ann.priority === 'URGENT'
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                  : ann.priority === 'IMPORTANT'
                  ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${
                      ann.priority === 'URGENT'
                        ? 'bg-rose-600 text-white'
                        : ann.priority === 'IMPORTANT'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Scope: <span className="font-bold text-slate-800 dark:text-slate-200">{ann.targetScope}</span>
                  </span>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  Published {new Date(ann.publishedAt).toLocaleDateString()} by{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{ann.author?.name || 'Mall Management'}</span>
                </div>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">{ann.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{ann.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Announcement */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Broadcast Bulletin to Tenants">
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bulletin Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mandatory Life-Safety System Inspection"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Audience *</label>
              <select
                value={form.targetScope}
                onChange={(e) => setForm({ ...form, targetScope: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold"
              >
                <option value="ALL">All Mall Tenants</option>
                <option value="FLOOR">Specific Floor Level</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority Classification *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold"
              >
                <option value="NORMAL">Normal Notice</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent Alert</option>
              </select>
            </div>
          </div>

          {form.targetScope === 'FLOOR' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Floor</label>
              <select
                value={form.targetFloorId}
                onChange={(e) => setForm({ ...form, targetFloorId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
              >
                <option value="">Select Floor</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Announcement Body *</label>
            <textarea
              required
              rows={4}
              placeholder="Official message text, instructions, and timelines..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold">
              Dispatch Bulletin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
