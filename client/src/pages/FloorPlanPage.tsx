import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Floor, Shop } from '../types/index.js';
import { useToast } from '../context/ToastContext.js';
import { OccupancyBadge, OperationalBadge } from '../components/common/Badge.js';
import {
  Map,
  Layers,
  Store,
  Info,
  ExternalLink,
  Wrench,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FloorPlanPage: React.FC = () => {
  const { showToast } = useToast();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFloorData() {
      try {
        setLoading(true);
        const data = await api.getVisualLayout();
        setFloors(data);
        if (data.length > 0) {
          setSelectedFloorId(data[0].id);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load visual floor plan', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadFloorData();
  }, []);

  const activeFloor = floors.find((f) => f.id === selectedFloorId);

  // Collect all shops on this floor across sections
  const allFloorShops: Shop[] = [];
  if (activeFloor) {
    activeFloor.sections?.forEach((sec) => {
      if (sec.shops) allFloorShops.push(...sec.shops);
    });
    if (activeFloor.shops) {
      allFloorShops.push(...activeFloor.shops);
    }
  }

  const occupiedCount = allFloorShops.filter((s) => s.occupancyStatus === 'OCCUPIED').length;
  const vacantCount = allFloorShops.filter((s) => s.occupancyStatus === 'VACANT').length;
  const reservedCount = allFloorShops.filter((s) => s.occupancyStatus === 'RESERVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Map className="w-6 h-6 text-brand-600" />
          Interactive Architectural Floor Plan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Visual multi-level shopping arcade map. Select any retail block to inspect tenancy, occupancy boundaries and operational status.
        </p>
      </div>

      {/* Floor Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {floors.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setSelectedFloorId(f.id);
              setSelectedShop(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedFloorId === f.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Level {f.floorNumber}: {f.name}
          </button>
        ))}
      </div>

      {/* Floor Overview Bar */}
      {activeFloor && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-extrabold text-slate-900 text-sm">{activeFloor.name}</span>
            <p className="text-slate-500 mt-0.5">{activeFloor.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>{occupiedCount} Occupied</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-sky-700">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              <span>{vacantCount} Vacant</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-amber-700">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>{reservedCount} Reserved</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Floor Plan Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Floor Canvas */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 text-white min-h-[460px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                Architectural Schematic — Level {activeFloor?.floorNumber}
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800 px-2.5 py-1 rounded-full">
                Interactive Grid View
              </span>
            </div>

            {/* Sections and Units Visual Grid */}
            <div className="space-y-6">
              {activeFloor?.sections?.map((section) => (
                <div key={section.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                    <span>{section.name} ({section.code})</span>
                    <span className="text-[10px] text-slate-500">{section.description}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {section.shops?.map((shop) => {
                      const isSelected = selectedShop?.id === shop.id;
                      const isOccupied = shop.occupancyStatus === 'OCCUPIED';
                      const isVacant = shop.occupancyStatus === 'VACANT';
                      const isReserved = shop.occupancyStatus === 'RESERVED';

                      let bgClass = 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500';
                      if (isOccupied) {
                        bgClass = isSelected
                          ? 'bg-emerald-600 border-emerald-400 text-white ring-2 ring-emerald-300'
                          : 'bg-emerald-950/80 border-emerald-700/60 text-emerald-100 hover:bg-emerald-900';
                      } else if (isVacant) {
                        bgClass = isSelected
                          ? 'bg-sky-600 border-sky-400 text-white ring-2 ring-sky-300'
                          : 'bg-sky-950/80 border-sky-700/60 text-sky-100 hover:bg-sky-900';
                      } else if (isReserved) {
                        bgClass = isSelected
                          ? 'bg-amber-600 border-amber-400 text-white ring-2 ring-amber-300'
                          : 'bg-amber-950/80 border-amber-700/60 text-amber-100 hover:bg-amber-900';
                      }

                      return (
                        <button
                          key={shop.id}
                          onClick={() => setSelectedShop(shop)}
                          className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[110px] ${bgClass}`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-sm tracking-tight">{shop.shopNumber}</span>
                              <span className="text-[10px] font-mono opacity-80">{shop.areaSqFt} sq ft</span>
                            </div>
                            <div className="text-xs font-semibold mt-1 truncate">{shop.name}</div>
                          </div>

                          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                            <span className="font-medium">
                              {shop.leases?.[0]?.tenant ? shop.leases[0].tenant.companyName : shop.occupancyStatus}
                            </span>
                            <span className="font-bold opacity-90">${(shop.baseRent / 100).toLocaleString()}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atrium walkway indicator */}
          <div className="mt-8 pt-4 border-t border-slate-800 text-center">
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">
              ▲ Central Atrium Walkway & Escalator Hub ▼
            </span>
          </div>
        </div>

        {/* Selected Shop Unit Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          {selectedShop ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Unit</span>
                  <h3 className="text-2xl font-black text-slate-900">{selectedShop.shopNumber}</h3>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{selectedShop.name}</p>
                </div>
                <div className="text-right space-y-1">
                  <OccupancyBadge status={selectedShop.occupancyStatus} />
                  <div><OperationalBadge status={selectedShop.operationalStatus} /></div>
                </div>
              </div>

              {/* Physical Specifications */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border">
                <div>
                  <span className="text-slate-400 block text-[11px]">Floor Area</span>
                  <span className="font-bold text-slate-900">{selectedShop.areaSqFt} sq ft</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Category</span>
                  <span className="font-bold text-slate-900">{selectedShop.businessCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Base Monthly Rent</span>
                  <span className="font-bold text-slate-900">${(selectedShop.baseRent / 100).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Service Charges</span>
                  <span className="font-bold text-slate-900">${(selectedShop.recurringCharges / 100).toLocaleString()}/mo</span>
                </div>
              </div>

              {/* Tenant Occupant Info */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Occupant & Active Lease
                </h4>
                {selectedShop.leases && selectedShop.leases.length > 0 ? (
                  <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{selectedShop.leases[0].tenant?.companyName}</span>
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                        {selectedShop.leases[0].leaseNumber}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Contact: {selectedShop.leases[0].tenant?.contactPerson} ({selectedShop.leases[0].tenant?.phone})
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Lease Term: {new Date(selectedShop.leases[0].startDate).toLocaleDateString()} to{' '}
                      {new Date(selectedShop.leases[0].endDate).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed text-center text-xs text-slate-400">
                    No active tenant. Unit is currently vacant and available for leasing.
                  </div>
                )}
              </div>

              {/* Quick Navigation Action */}
              <div className="pt-2">
                <Link
                  to={`/shops`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Store className="w-4 h-4" /> Open Full Shop Records
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="p-4 rounded-full bg-slate-100 text-slate-400">
                <Store className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Select a Retail Unit</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Click any shop block on the schematic layout to view its occupancy status, tenant profile, and lease details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
