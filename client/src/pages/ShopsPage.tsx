import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Shop, Floor, Section, OperationalStatus } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { OccupancyBadge, OperationalBadge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import {
  Store,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Clock,
  Wrench,
  ChevronRight,
  Info,
} from 'lucide-react';

export const ShopsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [occupancyFilter, setOccupancyFilter] = useState('');
  const [operationalFilter, setOperationalFilter] = useState('');

  // Modals state
  const [isNewShopModalOpen, setIsNewShopModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopDetailDrawer, setShopDetailDrawer] = useState<Shop | null>(null);

  // Form states
  const [newShopForm, setNewShopForm] = useState({
    floorId: '',
    sectionId: '',
    shopNumber: '',
    name: '',
    areaSqFt: 1000,
    businessCategory: 'Fashion & Apparel',
    baseRent: 5000, // in dollars
    recurringCharges: 400, // in dollars
    description: '',
  });

  const [statusForm, setStatusForm] = useState({
    newStatus: 'OPEN' as OperationalStatus,
    reason: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [shopsData, floorsData, sectionsData] = await Promise.all([
        api.getShops({
          search,
          floorId: floorFilter,
          occupancyStatus: occupancyFilter,
          operationalStatus: operationalFilter,
        }),
        api.getFloors(),
        api.getSections(),
      ]);
      setShops(shopsData);
      setFloors(floorsData);
      setSections(sectionsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load shops', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [floorFilter, occupancyFilter, operationalFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createShop({
        ...newShopForm,
        baseRent: Math.round(Number(newShopForm.baseRent) * 100),
        recurringCharges: Math.round(Number(newShopForm.recurringCharges) * 100),
        areaSqFt: Number(newShopForm.areaSqFt),
      });
      showToast('Shop unit registered successfully', 'success');
      setIsNewShopModalOpen(false);
      setNewShopForm({
        floorId: '',
        sectionId: '',
        shopNumber: '',
        name: '',
        areaSqFt: 1000,
        businessCategory: 'Fashion & Apparel',
        baseRent: 5000,
        recurringCharges: 400,
        description: '',
      });
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;

    try {
      await api.updateShopStatus(selectedShop.id, statusForm);
      showToast(`Operational status updated for ${selectedShop.shopNumber}`, 'success');
      setIsStatusModalOpen(false);
      setStatusForm({ newStatus: 'OPEN', reason: '', notes: '' });
      await loadData();
      if (shopDetailDrawer?.id === selectedShop.id) {
        const refreshed = await api.getShopById(selectedShop.id);
        setShopDetailDrawer(refreshed);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openStatusModal = (shop: Shop) => {
    setSelectedShop(shop);
    setStatusForm({
      newStatus: shop.operationalStatus === 'OPEN' ? 'TEMPORARILY_CLOSED' : 'OPEN',
      reason: '',
      notes: '',
    });
    setIsStatusModalOpen(true);
  };

  const viewShopDetails = async (shop: Shop) => {
    try {
      const fullShop = await api.getShopById(shop.id);
      setShopDetailDrawer(fullShop);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const canManage = user?.role === 'MALL_OWNER' || user?.role === 'MALL_MANAGER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Shops & Physical Units</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Directory of commercial retail units, floor distribution, occupancy and operational states.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsNewShopModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Retail Unit
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by shop number, title, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none"
          >
            <option value="">All Floors</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <select
            value={occupancyFilter}
            onChange={(e) => setOccupancyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none"
          >
            <option value="">All Occupancy</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="VACANT">Vacant</option>
            <option value="RESERVED">Reserved</option>
          </select>

          <select
            value={operationalFilter}
            onChange={(e) => setOperationalFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none"
          >
            <option value="">All Operational</option>
            <option value="OPEN">Open</option>
            <option value="TEMPORARILY_CLOSED">Temporarily Closed</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="NOT_YET_OPENED">Opening Soon</option>
          </select>
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold text-left">
              <tr>
                <th className="py-3.5 px-4">Unit #</th>
                <th className="py-3.5 px-4">Shop Title / Category</th>
                <th className="py-3.5 px-4">Floor / Section</th>
                <th className="py-3.5 px-4 text-right">Area (sq ft)</th>
                <th className="py-3.5 px-4 text-right">Base Rent</th>
                <th className="py-3.5 px-4 text-center">Occupancy</th>
                <th className="py-3.5 px-4 text-center">Operational</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading retail units...
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No shops match the selected criteria.
                  </td>
                </tr>
              ) : (
                shops.map((shop) => {
                  const activeLease = shop.leases?.[0];
                  return (
                    <tr key={shop.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">{shop.shopNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{shop.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{shop.businessCategory}</div>
                        {activeLease?.tenant && (
                          <div className="text-[10px] text-brand-700 dark:text-brand-400 font-medium">
                            Tenant: {activeLease.tenant.companyName}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div>{shop.floor?.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{shop.section?.name || 'Central Corridor'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                        {shop.areaSqFt.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white">${(shop.baseRent / 100).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">/month</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <OccupancyBadge status={shop.occupancyStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <OperationalBadge status={shop.operationalStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManage && shop.occupancyStatus !== 'VACANT' && (
                            <button
                              onClick={() => openStatusModal(shop)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold transition-colors"
                              title="Update operational status"
                            >
                              Status
                            </button>
                          )}
                          <button
                            onClick={() => viewShopDetails(shop)}
                            className="p-1.5 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
                            title="View Unit Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
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

      {/* Modal: Add New Shop */}
      <Modal
        isOpen={isNewShopModalOpen}
        onClose={() => setIsNewShopModalOpen(false)}
        title="Register New Retail Unit"
      >
        <form onSubmit={handleCreateShop} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Floor *</label>
              <select
                required
                value={newShopForm.floorId}
                onChange={(e) => setNewShopForm({ ...newShopForm, floorId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              >
                <option value="">Select Floor</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Section</label>
              <select
                value={newShopForm.sectionId}
                onChange={(e) => setNewShopForm({ ...newShopForm, sectionId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              >
                <option value="">Select Section (Optional)</option>
                {sections
                  .filter((s) => !newShopForm.floorId || s.floorId === newShopForm.floorId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unit Code / Shop # *</label>
              <input
                type="text"
                required
                placeholder="e.g. L1-205"
                value={newShopForm.shopNumber}
                onChange={(e) => setNewShopForm({ ...newShopForm, shopNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Display Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Prime Corner Suite"
                value={newShopForm.name}
                onChange={(e) => setNewShopForm({ ...newShopForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Area (Sq Ft) *</label>
              <input
                type="number"
                required
                min={10}
                value={newShopForm.areaSqFt}
                onChange={(e) => setNewShopForm({ ...newShopForm, areaSqFt: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Category *</label>
              <input
                type="text"
                required
                placeholder="e.g. Fashion, Dining, Tech"
                value={newShopForm.businessCategory}
                onChange={(e) => setNewShopForm({ ...newShopForm, businessCategory: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Base Monthly Rent ($) *</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={newShopForm.baseRent}
                onChange={(e) => setNewShopForm({ ...newShopForm, baseRent: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Service Charges ($/mo)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={newShopForm.recurringCharges}
                onChange={(e) => setNewShopForm({ ...newShopForm, recurringCharges: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Unit Description</label>
            <textarea
              rows={2}
              placeholder="Architectural specs, high ceiling, loading dock proximity..."
              value={newShopForm.description}
              onChange={(e) => setNewShopForm({ ...newShopForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewShopModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              Save Retail Unit
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Change Operational Status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Change Operational Status: ${selectedShop?.shopNumber}`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">New Operational State *</label>
            <select
              value={statusForm.newStatus}
              onChange={(e) => setStatusForm({ ...statusForm, newStatus: e.target.value as OperationalStatus })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
            >
              <option value="OPEN">Open (Normal Trade)</option>
              <option value="TEMPORARILY_CLOSED">Temporarily Closed</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="SUSPENDED">Suspended (Health / Safety)</option>
              <option value="NOT_YET_OPENED">Not Yet Opened</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Status Transition *</label>
            <input
              type="text"
              required
              placeholder="e.g. Interior lighting repair, seasonal inventory turnover..."
              value={statusForm.reason}
              onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Operational Notes</label>
            <textarea
              rows={3}
              placeholder="Expected reopening schedule, contractor reference, security escort details..."
              value={statusForm.notes}
              onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
            >
              Commit Transition
            </button>
          </div>
        </form>
      </Modal>

      {/* Drawer: Detailed Shop Unit View */}
      {/* Drawer: Detailed Shop Unit View */}
      {shopDetailDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 h-full shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{shopDetailDrawer.shopNumber}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{shopDetailDrawer.name}</p>
              </div>
              <button
                onClick={() => setShopDetailDrawer(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close Drawer
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Occupancy</span>
                <OccupancyBadge status={shopDetailDrawer.occupancyStatus} />
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Operational</span>
                <OperationalBadge status={shopDetailDrawer.operationalStatus} />
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px]">Base Rent</span>
                <span className="font-bold text-slate-900 dark:text-white">${(shopDetailDrawer.baseRent / 100).toLocaleString()}/mo</span>
              </div>
            </div>

            {/* Current Lease */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Current Occupant</h4>
              {shopDetailDrawer.leases && shopDetailDrawer.leases.length > 0 ? (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {shopDetailDrawer.leases[0].tenant.companyName}
                    </span>
                    <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                      {shopDetailDrawer.leases[0].leaseNumber}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">Contact: {shopDetailDrawer.leases[0].tenant.contactPerson} ({shopDetailDrawer.leases[0].tenant.phone})</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Tenure: {new Date(shopDetailDrawer.leases[0].startDate).toLocaleDateString()} to {new Date(shopDetailDrawer.leases[0].endDate).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
                  Vacant unit. No active tenancy agreement in effect.
                </div>
              )}
            </div>

            {/* Operational History Logs */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Operational Status Transition Audit
              </h4>
              <div className="space-y-2">
                {shopDetailDrawer.operationalLogs && shopDetailDrawer.operationalLogs.length > 0 ? (
                  shopDetailDrawer.operationalLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{log.previousStatus} → {log.newStatus}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {log.reason && <p className="text-slate-600 dark:text-slate-300 mt-1 font-medium">{log.reason}</p>}
                      {log.notes && <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">{log.notes}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No historical status transitions recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
