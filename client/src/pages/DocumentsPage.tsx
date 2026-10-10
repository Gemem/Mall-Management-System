import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Document, Tenant, Shop } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Modal } from '../components/common/Modal.js';
import {
  FolderLock,
  Plus,
  Search,
  AlertTriangle,
  FileCheck,
  Calendar,
  Trash2,
  Download,
  Building,
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<Document[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    documentType: 'INSURANCE',
    tenantId: '',
    shopId: '',
    expiryDate: '',
    filePath: '/storage/docs/sample-certificate.pdf',
    fileSize: 1048576,
    mimeType: 'application/pdf',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, expData, tenantsData, shopsData] = await Promise.all([
        api.getDocuments({ search, documentType: typeFilter }),
        api.getExpiringDocuments(30),
        api.getTenants(),
        api.getShops(),
      ]);
      setDocuments(docsData);
      setExpiringDocs(expData);
      setTenants(tenantsData);
      setShops(shopsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDocument({
        ...form,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : undefined,
      });
      showToast('Compliance record registered in vault', 'success');
      setIsModalOpen(false);
      setForm({
        title: '',
        documentType: 'INSURANCE',
        tenantId: '',
        shopId: '',
        expiryDate: '',
        filePath: '/storage/docs/sample-certificate.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
      });
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this compliance record?')) return;
    try {
      await api.deleteDocument(id);
      showToast('Document removed', 'success');
      await loadData();
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderLock className="w-6 h-6 text-brand-600" />
            Compliance Records & Document Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Certified insurance binders, commercial operating permits, signed leases and fire certificates.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Register Document
          </button>
        )}
      </div>

      {/* Expiring Documents Alert Banner */}
      {expiringDocs.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {expiringDocs.length} Document{expiringDocs.length > 1 ? 's' : ''} Approaching Expiration (&lt;30 days)
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Mandatory tenant liability insurance certificates or permits require urgent renewal verification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadData();
          }}
          className="flex-1 relative"
        >
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search document title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:outline-none"
          >
            <option value="">All Document Categories</option>
            <option value="LEASE_AGREEMENT">Lease Agreement</option>
            <option value="INSURANCE">Insurance Policy</option>
            <option value="BUSINESS_PERMIT">Operating Permit</option>
            <option value="TAX_CERTIFICATE">Tax Certificate</option>
            <option value="INSPECTION_REPORT">Inspection Report</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold text-left">
              <tr>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Associated Tenant / Unit</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    Loading compliance documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No documents found matching criteria.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const isExpiringSoon =
                    doc.expiryDate &&
                    new Date(doc.expiryDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{doc.title}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {doc.documentType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {doc.tenant?.companyName ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{doc.tenant.companyName}</span>
                            {doc.shop?.shopNumber && (
                              <span className="block text-[11px] text-slate-400 dark:text-slate-500">Unit: {doc.shop.shopNumber}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">General Facility Record</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'Perpetual / N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Expiring Soon
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60">
                            Compliant
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManage && (
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Modal: Upload Document */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Compliance Document">
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. 2026 Commercial General Liability Certificate"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Document Category *</label>
              <select
                value={form.documentType}
                onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs font-semibold"
              >
                <option value="INSURANCE">Insurance Binder / Certificate</option>
                <option value="BUSINESS_PERMIT">Operating & Trade Permit</option>
                <option value="LEASE_AGREEMENT">Executed Lease Agreement</option>
                <option value="TAX_CERTIFICATE">Tax Compliance Certificate</option>
                <option value="INSPECTION_REPORT">Fire & Health Inspection</option>
                <option value="OTHER">Other Operational Document</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expiration Date</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Associated Tenant</label>
              <select
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
              >
                <option value="">Select Tenant (Optional)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Associated Shop</label>
              <select
                value={form.shopId}
                onChange={(e) => setForm({ ...form, shopId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-xs"
              >
                <option value="">Select Shop Unit (Optional)</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shopNumber} - {s.name}
                  </option>
                ))}
              </select>
            </div>
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
              Register Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
