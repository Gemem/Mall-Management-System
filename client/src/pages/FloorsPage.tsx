import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Floor, Section } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Modal } from '../components/common/Modal.js';
import { Layers, Plus, Trash2, Building, Store } from 'lucide-react';

export const FloorsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [targetFloorId, setTargetFloorId] = useState<string>('');

  const [floorForm, setFloorForm] = useState({
    floorNumber: 4,
    name: '',
    description: '',
  });

  const [sectionForm, setSectionForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  const loadFloors = async () => {
    try {
      setLoading(true);
      const data = await api.getFloors();
      setFloors(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load floors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFloors();
  }, []);

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mall = await api.getMall();
      await api.createFloor({
        mallId: mall.id,
        floorNumber: Number(floorForm.floorNumber),
        name: floorForm.name,
        description: floorForm.description,
      });
      showToast('New floor added to mall inventory', 'success');
      setIsFloorModalOpen(false);
      setFloorForm({ floorNumber: 4, name: '', description: '' });
      await loadFloors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFloorId) return;

    try {
      await api.createSection({
        floorId: targetFloorId,
        name: sectionForm.name,
        code: sectionForm.code,
        description: sectionForm.description,
      });
      showToast('Section created successfully', 'success');
      setIsSectionModalOpen(false);
      setSectionForm({ name: '', code: '', description: '' });
      await loadFloors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!window.confirm('Are you sure you want to delete this floor?')) return;
    try {
      await api.deleteFloor(floorId);
      showToast('Floor removed', 'success');
      await loadFloors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const canManage = user?.role === 'MALL_OWNER' || user?.role === 'MALL_MANAGER';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-600" />
            Floors & Architectural Sections
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure multi-tier floor levels, arcade wings, concourses and section subdivisions.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsFloorModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Floor Level
          </button>
        )}
      </div>

      {/* Floors Cards */}
      <div className="space-y-4">
        {floors.map((floor) => (
          <div key={floor.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-extrabold text-sm">
                  L{floor.floorNumber}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{floor.name}</h3>
                  <p className="text-xs text-slate-500">{floor.description || 'General retail arcade level'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {floor._count?.shops || 0} Registered Units
                </span>
                {canManage && (
                  <button
                    onClick={() => {
                      setTargetFloorId(floor.id);
                      setIsSectionModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-600" /> Add Section
                  </button>
                )}
                {user?.role === 'MALL_OWNER' && (floor._count?.shops || 0) === 0 && (
                  <button
                    onClick={() => handleDeleteFloor(floor.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Sections under this floor */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Designated Sections & Wings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {floor.sections && floor.sections.length > 0 ? (
                  floor.sections.map((sec) => (
                    <div key={sec.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{sec.name}</span>
                        <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                          {sec.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{sec.description || 'Retail corridor'}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-3 text-center text-xs text-slate-400 italic">
                    No specific sections mapped. Units are positioned on the open concourse.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Floor */}
      <Modal isOpen={isFloorModalOpen} onClose={() => setIsFloorModalOpen(false)} title="Register Floor Level">
        <form onSubmit={handleCreateFloor} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Floor Level Number *</label>
            <input
              type="number"
              required
              value={floorForm.floorNumber}
              onChange={(e) => setFloorForm({ ...floorForm, floorNumber: Number(e.target.value) })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Floor Display Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Level 4 (Rooftop Promenade)"
              value={floorForm.name}
              onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Commercial focus, anchor tenants, terrace access..."
              value={floorForm.description}
              onChange={(e) => setFloorForm({ ...floorForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFloorModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold">
              Save Floor
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Section */}
      <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title="Add Section to Floor">
        <form onSubmit={handleCreateSection} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Section Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. North Promenade, Atrium South"
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Section Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. L4-NP"
              value={sectionForm.code}
              onChange={(e) => setSectionForm({ ...sectionForm, code: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. Luxury boutiques corridor"
              value={sectionForm.description}
              onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSectionModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold">
              Save Section
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
