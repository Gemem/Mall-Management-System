import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  Layers,
  Store,
  Map,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Wrench,
  Megaphone,
  FolderLock,
  BarChart3,
  ShieldAlert,
  Settings,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'MALL_OWNER';

  interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: string[];
  }

  interface NavSection {
    title: string;
    roles?: string[];
    items: NavItem[];
  }

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT', 'MAINTENANCE', 'TENANT'] },
      ],
    },
    {
      title: role === 'MAINTENANCE' ? 'Facilities & Spaces' : 'Property & Spaces',
      roles: ['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE'],
      items: [
        { label: 'Floors & Sections', path: '/floors', icon: Layers, roles: ['MALL_OWNER', 'MALL_MANAGER'] },
        { label: 'Shops Directory', path: '/shops', icon: Store, roles: ['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE'] },
        { label: 'Visual Floor Plan', path: '/floor-plan', icon: Map, roles: ['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE'] },
      ],
    },
    {
      title: role === 'ACCOUNTANT' ? 'Tenancy Accounts' : 'Tenancy & Leasing',
      roles: ['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT'],
      items: [
        { label: 'Tenants Directory', path: '/tenants', icon: Users, roles: ['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT'] },
        { label: 'Leases & Contracts', path: '/leases', icon: FileText, roles: ['MALL_OWNER', 'MALL_MANAGER'] },
      ],
    },
    {
      title: role === 'TENANT' ? 'My Finances' : 'Finance & Ledger',
      roles: ['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT', 'TENANT'],
      items: [
        { label: role === 'TENANT' ? 'My Invoices' : 'Invoices & Billing', path: '/billing', icon: CreditCard, roles: ['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT', 'TENANT'] },
        { label: role === 'TENANT' ? 'Payment History' : 'Payments & Receipts', path: '/payments', icon: Receipt, roles: ['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT', 'TENANT'] },
      ],
    },
    {
      title: role === 'TENANT' ? 'Store Operations' : 'Operations & Service',
      roles: ['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE', 'TENANT'],
      items: [
        { label: role === 'TENANT' ? 'Service Requests' : 'Maintenance Tickets', path: '/maintenance', icon: Wrench, roles: ['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE', 'TENANT'] },
        { label: 'Mall Announcements', path: '/announcements', icon: Megaphone, roles: ['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE', 'TENANT'] },
      ],
    },
    {
      title: 'Records & Analytics',
      roles: ['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT'],
      items: [
        { label: 'Documents & Leases', path: '/documents', icon: FolderLock, roles: ['MALL_OWNER', 'MALL_MANAGER'] },
        { label: 'Reports & Export', path: '/reports', icon: BarChart3, roles: ['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT'] },
      ],
    },
    {
      title: 'Executive Governance',
      roles: ['MALL_OWNER'],
      items: [
        { label: 'User Approvals', path: '/users', icon: UserCheck, roles: ['MALL_OWNER'] },
        { label: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, roles: ['MALL_OWNER'] },
        { label: 'Mall Settings', path: '/settings', icon: Settings, roles: ['MALL_OWNER'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-200 ease-in-out lg:translate-x-0 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6">
          {sections.map((section) => {
            if (section.roles && !section.roles.includes(role)) return null;
            const visibleItems = section.items.filter((item) => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {section.title}
                </div>
                <nav className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                            isActive
                              ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};
