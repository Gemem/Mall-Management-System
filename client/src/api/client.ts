const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('mms_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('mms_token', token);
    } else {
      localStorage.removeItem('mms_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignored
      }
      throw new Error(errorMessage);
    }

    // If 204 or no content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(data.token);
    return data;
  }

  async register(data: { email: string; password: string; name: string; role?: string; phone?: string; tenantId?: string }) {
    return this.request<{ message: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  async getDemoAccounts() {
    return this.request<{ accounts: any[] }>('/auth/demo-accounts');
  }

  // Users & Approvals (Owner/Admin)
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async createUser(data: any) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveUser(id: string) {
    return this.request<any>(`/users/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async revokeUser(id: string) {
    return this.request<any>(`/users/${id}/revoke`, {
      method: 'PATCH',
    });
  }

  async toggleUserStatus(id: string, isActive: boolean) {
    return this.request<any>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Mall & Floors
  async getMall() {
    return this.request<any>('/mall');
  }

  async updateMall(id: string, data: any) {
    return this.request<any>(`/mall/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getFloors() {
    return this.request<any[]>('/floors');
  }

  async createFloor(data: any) {
    return this.request<any>('/floors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFloor(id: string, data: any) {
    return this.request<any>(`/floors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFloor(id: string) {
    return this.request<any>(`/floors/${id}`, {
      method: 'DELETE',
    });
  }

  async getSections(floorId?: string) {
    const query = floorId ? `?floorId=${floorId}` : '';
    return this.request<any[]>(`/sections${query}`);
  }

  async createSection(data: any) {
    return this.request<any>('/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Shops
  async getShops(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/shops${query ? `?${query}` : ''}`);
  }

  async getShopById(id: string) {
    return this.request<any>(`/shops/${id}`);
  }

  async createShop(data: any) {
    return this.request<any>('/shops', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateShop(id: string, data: any) {
    return this.request<any>(`/shops/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteShop(id: string) {
    return this.request<any>(`/shops/${id}`, {
      method: 'DELETE',
    });
  }

  async updateShopStatus(id: string, data: { newStatus: string; reason?: string; notes?: string }) {
    return this.request<any>(`/shops/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getVisualLayout(floorId?: string) {
    const query = floorId ? `?floorId=${floorId}` : '';
    return this.request<any[]>(`/shops/visual-layout${query}`);
  }

  // Tenants
  async getTenants(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/tenants${query ? `?${query}` : ''}`);
  }

  async getTenantById(id: string) {
    return this.request<any>(`/tenants/${id}`);
  }

  async createTenant(data: any) {
    return this.request<any>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTenant(id: string, data: any) {
    return this.request<any>(`/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Leases
  async getLeases(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/leases${query ? `?${query}` : ''}`);
  }

  async getLeaseById(id: string) {
    return this.request<any>(`/leases/${id}`);
  }

  async createLease(data: any) {
    return this.request<any>('/leases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async renewLease(id: string, data: any) {
    return this.request<any>(`/leases/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async terminateLease(id: string, data: any) {
    return this.request<any>(`/leases/${id}/terminate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Billing
  async getInvoices(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/invoices${query ? `?${query}` : ''}`);
  }

  async getInvoiceById(id: string) {
    return this.request<any>(`/invoices/${id}`);
  }

  async generateMonthlyInvoices(data: { year: number; month: number }) {
    return this.request<any>('/invoices/generate-monthly', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payments
  async getPayments(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/payments${query ? `?${query}` : ''}`);
  }

  async getPaymentById(id: string) {
    return this.request<any>(`/payments/${id}`);
  }

  async recordPayment(data: any) {
    return this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async reversePayment(id: string, data: { reason: string }) {
    return this.request<any>(`/payments/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReceipt(paymentId: string) {
    return this.request<any>(`/receipts/${paymentId}`);
  }

  // Maintenance
  async getTickets(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/maintenance${query ? `?${query}` : ''}`);
  }

  async getTicketById(id: string) {
    return this.request<any>(`/maintenance/${id}`);
  }

  async createTicket(data: any) {
    return this.request<any>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTicket(id: string, data: any) {
    return this.request<any>(`/maintenance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async addComment(ticketId: string, data: { message: string; isInternal?: boolean }) {
    return this.request<any>(`/maintenance/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Announcements & Notifications
  async getAnnouncements() {
    return this.request<any[]>('/announcements');
  }

  async createAnnouncement(data: any) {
    return this.request<any>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request<any>('/notifications/read-all', {
      method: 'POST',
    });
  }

  // Documents
  async getDocuments(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/documents${query ? `?${query}` : ''}`);
  }

  async getExpiringDocuments(days: number = 30) {
    return this.request<any[]>(`/documents/expiring?days=${days}`);
  }

  async createDocument(data: any) {
    return this.request<any>('/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string) {
    return this.request<any>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Reports
  async getReportSummary(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request<any>(`/reports/summary${query ? `?${query}` : ''}`);
  }

  async getAgingReceivables() {
    return this.request<any>('/reports/aging-receivables');
  }

  async getOccupancyReport() {
    return this.request<any>('/reports/occupancy');
  }

  async getExpiringLeasesReport(days: number = 60) {
    return this.request<any[]>(`/reports/expiring-leases?days=${days}`);
  }

  // Dashboard
  async getDashboard() {
    return this.request<any>('/dashboard');
  }

  // Audit Logs
  async getAuditLogs(filters: Record<string, string> = {}) {
    const query = new URLSearchParams(filters).toString();
    return this.request<any[]>(`/audit-logs${query ? `?${query}` : ''}`);
  }

  // Background Job Check
  async triggerAutomatedChecks() {
    return this.request<any>('/jobs/run-checks', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
