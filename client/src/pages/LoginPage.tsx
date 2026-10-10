import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  UserCheck,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserRole } from '../types/index.js';

export const LoginPage: React.FC = () => {
  const { login, register, switchDemoRole } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('owner@mall.com');
  const [loginPassword, setLoginPassword] = useState('MallAdmin123!');
  const [loading, setLoading] = useState(false);
  const [pendingApprovalAlert, setPendingApprovalAlert] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('TENANT');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  // Demo accounts accordion
  const [showDemoSelector, setShowDemoSelector] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingApprovalAlert(null);
    try {
      setLoading(true);
      await login(loginEmail, loginPassword);
      showToast('Authentication successful. Welcome to Starlight Galleria!', 'success');
      navigate('/');
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      if (msg.includes('Pending Approval') || msg.includes('awaiting approval')) {
        setPendingApprovalAlert(msg);
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingApprovalAlert(null);
    setRegSuccessMessage(null);
    try {
      setLoading(true);
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        phone: regPhone,
      });

      setRegSuccessMessage(
        res.message || 'Registration submitted! Your individual account is pending permission/approval from the Mall Owner.'
      );
      showToast('Registration submitted for Mall Owner approval', 'info');
      // Reset form
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegPhone('');
      setActiveTab('LOGIN');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (role: UserRole) => {
    setPendingApprovalAlert(null);
    try {
      setLoading(true);
      await switchDemoRole(role);
      showToast(`Logged in as ${role.replace('_', ' ')}`, 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const demoCards: { role: UserRole; title: string; name: string; email: string; pass: string; desc: string }[] = [
    {
      role: 'MALL_OWNER',
      title: 'Mall Owner',
      name: 'Victoria Sterling',
      email: 'owner@mall.com',
      pass: 'MallAdmin123!',
      desc: 'Full portfolio executive oversight, cash earnings, charts, leases, audit logs & user approval permissions.',
    },
    {
      role: 'MALL_MANAGER',
      title: 'Mall Manager',
      name: 'Arthur Pendelton',
      email: 'manager@mall.com',
      pass: 'MallAdmin123!',
      desc: 'Operations director: unit occupancy, floor layouts, contract renewals, tenant compliance & full dashboard.',
    },
    {
      role: 'ACCOUNTANT',
      title: 'Accountant',
      name: 'Beatrice Morales, CPA',
      email: 'accountant@mall.com',
      pass: 'MallAdmin123!',
      desc: 'Billing & collections ledger: records rent payments, receipts & reversals. (Confidential owner profit charts & leases hidden).',
    },
    {
      role: 'MAINTENANCE',
      title: 'Maintenance Staff',
      name: 'Carlos Mendez',
      email: 'maintenance@mall.com',
      pass: 'MallAdmin123!',
      desc: 'Facility work orders, repair queues & equipment SLAs. (Zero cash amounts, zero financial charts, zero lease contracts).',
    },
    {
      role: 'TENANT',
      title: 'Retail Tenant',
      name: 'Elena Rostova (Fashion Hub)',
      email: 'tenant@fashionhub.com',
      pass: 'Tenant123!',
      desc: 'Self-service portal: personal leased store, invoice balance, payment history & tickets. (Zero mall cash or other leases).',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8 relative transition-colors">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Day Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span>Night Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-xl w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">STARLIGHT GALLERIA</h1>
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
            Enterprise Mall Management System (MMS)
          </p>
        </div>

        {/* Pending Approval Warning Alert */}
        {pendingApprovalAlert && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs shadow-md space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Permission & Activation Required</span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              {pendingApprovalAlert}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              Every staff member and tenant must be reviewed and approved by the Mall Owner (<strong>Victoria Sterling</strong>) before gaining access.
            </p>
          </div>
        )}

        {/* Registration Success Alert */}
        {regSuccessMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs shadow-md space-y-1 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Registration Submitted Successfully</span>
            </div>
            <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
              {regSuccessMessage}
            </p>
          </div>
        )}

        {/* Main Auth Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
            <button
              onClick={() => {
                setActiveTab('LOGIN');
                setPendingApprovalAlert(null);
              }}
              className={`flex-1 py-3.5 text-xs font-bold transition-colors ${
                activeTab === 'LOGIN'
                  ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Sign In with Credentials
            </button>
            <button
              onClick={() => {
                setActiveTab('REGISTER');
                setPendingApprovalAlert(null);
                setRegSuccessMessage(null);
              }}
              className={`flex-1 py-3.5 text-xs font-bold transition-colors ${
                activeTab === 'REGISTER'
                  ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Request Access / Register
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {activeTab === 'LOGIN' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">User ID / Work Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@mall.com or tenant@shop.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Secure Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="Enter account password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying Credentials...' : 'Sign In to Mall Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 text-[11px] text-brand-900 dark:text-brand-300 leading-relaxed">
                  <strong>Notice:</strong> All new individual accounts require authorization and approval by the Mall Owner before access is enabled.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Requested Role *</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option value="TENANT">Retail Tenant (Store Representative)</option>
                      <option value="MAINTENANCE">Maintenance / Facility Technician</option>
                      <option value="ACCOUNTANT">Billing & Accounting Staff</option>
                      <option value="MALL_MANAGER">Mall Operations Manager</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Work Email / User ID *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. jdoe@retailtenant.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Set Account Password *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        placeholder="Minimum 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="+1 (555) 000-0000"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Submitting Registration...' : 'Submit Access Request for Owner Approval'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Quick Demo Profiles Collapsible Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDemoSelector(!showDemoSelector)}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Pre-Configured Evaluation Profiles & Credentials</span>
                </div>
                {showDemoSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDemoSelector && (
                <div className="grid grid-cols-1 gap-2.5 mt-3 animate-fadeIn">
                  {demoCards.map((card) => (
                    <div
                      key={card.role}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:border-brand-500 dark:hover:border-brand-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{card.title}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">— {card.name}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 mt-0.5">
                          ID: <span className="font-bold">{card.email}</span> &bull; Pass: <span className="font-bold">{card.pass}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{card.desc}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail(card.email);
                            setLoginPassword(card.pass);
                            setActiveTab('LOGIN');
                            setPendingApprovalAlert(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          Fill Form
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDemoSelect(card.role)}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold shadow-sm"
                        >
                          1-Click Sign In
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
