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
import { LoginPage } from './pages/LoginPage.js';

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
                <Route path="floors" element={<FloorsPage />} />
                <Route path="shops" element={<ShopsPage />} />
                <Route path="floor-plan" element={<FloorPlanPage />} />
                <Route path="tenants" element={<TenantsPage />} />
                <Route path="leases" element={<LeasesPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
