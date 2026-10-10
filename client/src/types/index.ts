export type UserRole = 'MALL_OWNER' | 'MALL_MANAGER' | 'ACCOUNTANT' | 'MAINTENANCE' | 'TENANT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  tenantId?: string | null;
  tenant?: Tenant | null;
}

export interface Mall {
  id: string;
  name: string;
  tagline?: string | null;
  logoUrl?: string | null;
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string | null;
  floors?: Floor[];
  settings?: { key: string; value: string; description?: string }[];
}

export interface Floor {
  id: string;
  mallId: string;
  floorNumber: number;
  name: string;
  description?: string | null;
  sections?: Section[];
  shops?: Shop[];
  _count?: { shops: number };
}

export interface Section {
  id: string;
  floorId: string;
  name: string;
  code: string;
  description?: string | null;
  floor?: Floor;
  shops?: Shop[];
  _count?: { shops: number };
}

export type OccupancyStatus = 'VACANT' | 'RESERVED' | 'OCCUPIED';
export type OperationalStatus = 'NOT_APPLICABLE' | 'NOT_YET_OPENED' | 'OPEN' | 'TEMPORARILY_CLOSED' | 'UNDER_MAINTENANCE' | 'SUSPENDED';

export interface Shop {
  id: string;
  floorId: string;
  floor?: Floor;
  sectionId?: string | null;
  section?: Section | null;
  shopNumber: string;
  name: string;
  areaSqFt: number;
  businessCategory: string;
  description?: string | null;
  baseRent: number; // in cents
  recurringCharges: number; // in cents
  occupancyStatus: OccupancyStatus;
  operationalStatus: OperationalStatus;
  currentLeaseId?: string | null;
  leases?: Lease[];
  operationalLogs?: ShopOperationalLog[];
  maintenanceTickets?: MaintenanceTicket[];
  documents?: Document[];
}

export interface ShopOperationalLog {
  id: string;
  shopId: string;
  previousStatus: string;
  newStatus: string;
  reason?: string | null;
  notes?: string | null;
  changedById?: string | null;
  changedBy?: { name: string; role: string } | null;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  taxId?: string | null;
  registrationNumber?: string | null;
  emergencyContact?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'FORMER';
  notes?: string | null;
  leases?: Lease[];
  invoices?: Invoice[];
  payments?: Payment[];
  financials?: {
    totalOutstanding: number;
    overdueCount: number;
  };
  ledgerSummary?: {
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
  };
  _count?: {
    leases: number;
    maintenanceTickets: number;
    documents: number;
  };
}

export type LeaseStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRING' | 'RENEWED' | 'TERMINATED' | 'EXPIRED';

export interface Lease {
  id: string;
  leaseNumber: string;
  tenantId: string;
  tenant: Tenant;
  shopId: string;
  shop: Shop;
  startDate: string;
  endDate: string;
  rentAmount: number; // in cents
  recurringCharges: number; // in cents
  depositAmount: number; // in cents
  depositPaid: boolean;
  billingFrequency: string;
  dueDay: number;
  gracePeriodDays: number;
  lateFeePercentage: number;
  status: LeaseStatus;
  terms?: string | null;
  amendments?: LeaseAmendment[];
  invoices?: Invoice[];
}

export interface LeaseAmendment {
  id: string;
  leaseId: string;
  amendmentNumber: number;
  effectiveDate: string;
  previousRent: number;
  newRent: number;
  changeReason: string;
  approvedBy?: string | null;
}

export type InvoiceStatus = 'UPCOMING' | 'DUE_TODAY' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  leaseId: string;
  lease?: Lease;
  tenantId: string;
  tenant: Tenant;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  baseRent: number;
  recurringCharges: number;
  lateFee: number;
  totalAmount: number;
  amountPaid: number;
  amountOutstanding: number;
  status: InvoiceStatus;
  notes?: string | null;
  allocations?: PaymentAllocation[];
}

export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHECK' | 'CASH' | 'MOBILE_MONEY';

export interface Payment {
  id: string;
  paymentNumber: string;
  tenantId: string;
  tenant: Tenant;
  leaseId?: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  transactionDate: string;
  status: 'POSTED' | 'REVERSED';
  recordedBy?: { name: string; role: string } | null;
  notes?: string | null;
  allocations?: PaymentAllocation[];
  reversal?: PaymentReversal | null;
  receipt?: Receipt | null;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  payment?: Payment;
  invoiceId: string;
  invoice: Invoice;
  amountAllocated: number;
  createdAt: string;
}

export interface PaymentReversal {
  id: string;
  reversalNumber: string;
  paymentId: string;
  reason: string;
  authorizedById?: string | null;
  reversedAt: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  payment?: Payment;
  generatedAt: string;
  notes?: string | null;
}

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MaintenanceStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  shopId: string;
  shop: Shop;
  tenantId?: string | null;
  tenant?: Tenant | null;
  title: string;
  description: string;
  category: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string; phone?: string | null } | null;
  resolutionNotes?: string | null;
  estimatedCost?: number | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: MaintenanceComment[];
  _count?: { comments: number };
}

export interface MaintenanceComment {
  id: string;
  ticketId: string;
  userId: string;
  user: { id: string; name: string; role: string; avatarUrl?: string | null };
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetScope: string;
  targetFloorId?: string | null;
  targetSectionId?: string | null;
  targetTenantId?: string | null;
  priority: string;
  publishedAt: string;
  expiresAt?: string | null;
  author?: { name: string; role: string } | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  documentType: string;
  filePath: string;
  fileUrl?: string | null;
  fileSize: number;
  mimeType: string;
  expiryDate?: string | null;
  tenantId?: string | null;
  tenant?: Tenant | null;
  leaseId?: string | null;
  shopId?: string | null;
  shop?: Shop | null;
  uploadedBy?: { name: string; role: string } | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: { name: string; role: string; email: string } | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  kpis: {
    totalShops: number;
    occupiedShops: number;
    vacantShops: number;
    reservedShops: number;
    operatingShops: number;
    temporarilyClosedShops: number;
    maintenanceShops: number;
    occupancyRate: number;
    activeLeases: number;
    expiringLeasesCount: number;
    expectedRent: number;
    collectedRent: number;
    outstandingBalance: number;
    overdueCount: number;
    overdueTotalAmount: number;
    openTicketsCount: number;
    urgentTicketsCount: number;
  };
  monthlyTrend: { month: string; billed: number; collected: number }[];
  allOverdueInvoices: Invoice[];
  expiringLeasesList: Lease[];
  recentActivity: AuditLog[];
}
