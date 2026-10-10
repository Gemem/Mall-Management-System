import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Mall } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Settings, Save, Building2, Clock, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mall, setMall] = useState<Mall | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'America/New_York',
    dateFormat: 'YYYY-MM-DD',
    email: '',
    phone: '',
    address: '',
    taxId: '',
  });

  useEffect(() => {
    async function loadMall() {
      try {
        setLoading(true);
        const data = await api.getMall();
        setMall(data);
        if (data) {
          setForm({
            name: data.name || '',
            tagline: data.tagline || '',
            currency: data.currency || 'USD',
            currencySymbol: data.currencySymbol || '$',
            timezone: data.timezone || 'America/New_York',
            dateFormat: data.dateFormat || 'YYYY-MM-DD',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            taxId: data.taxId || '',
          });
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadMall();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mall) return;
    try {
      setSaving(true);
      await api.updateMall(mall.id, form);
      showToast('Mall enterprise configuration saved successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          Mall Configuration & Operational Parameters
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Identity, financial currency defaults, timezones, legal tax IDs and operational covenants.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs">
        {/* Mall Identity */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" /> Mall Property Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mall Commercial Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Management Contact Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Operations Telephone *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Physical Address *</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Financial & Regional Defaults */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-600" /> Currency & Regional Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Base Currency Code</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="CAD">CAD (Canadian Dollar)</option>
                <option value="AUD">AUD (Australian Dollar)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Operational Timezone</label>
              <input
                type="text"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
