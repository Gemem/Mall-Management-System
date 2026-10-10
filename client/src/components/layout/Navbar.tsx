import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { UserRole, Notification } from '../../types/index.js';
import { api } from '../../api/client.js';
import {
  Building2,
  Bell,
  LogOut,
  UserCheck,
  CheckCircle,
  Menu,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      // Ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const rolesList: { role: UserRole; name: string; label: string }[] = [
    { role: 'MALL_OWNER', name: 'Victoria Sterling', label: 'Mall Owner' },
    { role: 'MALL_MANAGER', name: 'Arthur Pendelton', label: 'Mall Manager' },
    { role: 'ACCOUNTANT', name: 'Beatrice Morales, CPA', label: 'Accountant' },
    { role: 'MAINTENANCE', name: 'Carlos Mendez', label: 'Maintenance Staff' },
    { role: 'TENANT', name: 'Elena Rostova', label: 'Tenant (Aura Couture)' },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 sm:px-6 backdrop-blur transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">STARLIGHT GALLERIA</h1>
            <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 tracking-wide uppercase">
              Mall Management System
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <UserCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400">Role:</span>
            <span className="text-slate-900 dark:text-white font-bold">
              {user?.role ? user.role.replace('_', ' ') : 'Select Role'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl z-50">
              <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Switch Demo Role
              </div>
              <div className="space-y-1">
                {rolesList.map((r) => {
                  const isActive = user?.role === r.role;
                  return (
                    <button
                      key={r.role}
                      onClick={async () => {
                        setShowRoleMenu(false);
                        await switchDemoRole(r.role);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-900 dark:text-brand-200 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{r.label}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.name}</div>
                      </div>
                      {isActive && <CheckCircle className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Day / Night Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">No notifications at this time.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        n.isRead
                          ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          : 'bg-brand-50/40 dark:bg-brand-950/40 border-brand-100 dark:border-brand-900/60 text-slate-900 dark:text-slate-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar & logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white font-bold flex items-center justify-center text-xs shadow-sm overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'U'
            )}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
