import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { UserRole } from '../types/index.js';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('owner@mall.com');
  const [password, setPassword] = useState('MallAdmin123!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      showToast('Authentication successful', 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (role: UserRole) => {
    try {
      setLoading(true);
      await switchDemoRole(role);
      showToast(`Switched into ${role.replace('_', ' ')} session`, 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const demoCards: { role: UserRole; title: string; name: string; desc: string }[] = [
    { role: 'MALL_OWNER', title: 'Mall Owner', name: 'Victoria Sterling', desc: 'Full portfolio oversight, executive KPIs, audit logs, revenue & leases.' },
    { role: 'MALL_MANAGER', title: 'Mall Manager', name: 'Arthur Pendelton', desc: 'Shop occupancy, floor layout, contract renewals, tenant compliance.' },
    { role: 'ACCOUNTANT', title: 'Accountant', name: 'Beatrice Morales, CPA', desc: 'Rent collection, multi-invoice allocations, receipt issuance & reversals.' },
    { role: 'MAINTENANCE', title: 'Maintenance Staff', name: 'Carlos Mendez', desc: 'Repair work orders, equipment SLA tracking, work notes.' },
    { role: 'TENANT', title: 'Retail Tenant', name: 'Elena Rostova', desc: 'Self-service portal: leased units, invoices, payment history & tickets.' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="max-w-xl w-full space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">STARLIGHT GALLERIA</h1>
          <p className="text-sm font-semibold text-brand-400 uppercase tracking-widest">
            Enterprise Mall Management System (MMS)
          </p>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">Work Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5">Secure Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Mall Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Selector */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <UserCheck className="w-4 h-4 text-brand-400" />
              <span>Instant 1-Click Demo Evaluation Profiles</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {demoCards.map((card) => (
                <button
                  key={card.role}
                  onClick={() => handleDemoSelect(card.role)}
                  className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white group-hover:text-brand-400 transition-colors">
                        {card.title}
                      </span>
                      <span className="text-[11px] text-slate-400">— {card.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{card.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
