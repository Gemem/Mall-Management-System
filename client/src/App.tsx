import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { AppLayout } from './components/layout/AppLayout.js';

import { DashboardPage } from './pages/DashboardPage.js';
import { FloorsPage } from './pages/FloorsPage.js';
import { ShopsPage } from './pages/ShopsPage.js';
import { FloorPlanPage } from './pages/FloorPlanPage.js';
import { TenantsPage } from './pages/TenantsPage.js';
import { LeasesPage } from './pages/LeasesPage.js';
import { BillingPage } from './pages/BillingPage.js';
import { PaymentsPage } from './pages/PaymentsPage.js';
import { MaintenancePage } from './pages/MaintenancePage.js';
import { AnnouncementsPage } from './pages/AnnouncementsPage.js';
import { DocumentsPage } from './pages/DocumentsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { UserRole } from './types/index.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RoleRoute: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route
                  path="floors"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER']}>
                      <FloorsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="shops"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE']}>
                      <ShopsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="floor-plan"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE']}>
                      <FloorPlanPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="tenants"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT']}>
                      <TenantsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="leases"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER']}>
                      <LeasesPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="billing"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT', 'TENANT']}>
                      <BillingPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="payments"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT', 'TENANT']}>
                      <PaymentsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="maintenance"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE', 'TENANT']}>
                      <MaintenancePage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="announcements"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER', 'MAINTENANCE', 'TENANT']}>
                      <AnnouncementsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="documents"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER']}>
                      <DocumentsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER', 'MALL_MANAGER', 'ACCOUNTANT']}>
                      <ReportsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="audit-logs"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER']}>
                      <AuditLogsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER']}>
                      <UsersPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <RoleRoute allowedRoles={['MALL_OWNER']}>
                      <SettingsPage />
                    </RoleRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
