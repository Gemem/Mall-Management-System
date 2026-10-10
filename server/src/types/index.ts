export const Roles = {
  MALL_OWNER: 'MALL_OWNER',
  MALL_MANAGER: 'MALL_MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  MAINTENANCE: 'MAINTENANCE',
  TENANT: 'TENANT',
} as const;

export type UserRole = (typeof Roles)[keyof typeof Roles];

export const OccupancyStatuses = {
  VACANT: 'VACANT',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
} as const;

export type OccupancyStatus = (typeof OccupancyStatuses)[keyof typeof OccupancyStatuses];

export const OperationalStatuses = {
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  NOT_YET_OPENED: 'NOT_YET_OPENED',
  OPEN: 'OPEN',
  TEMPORARILY_CLOSED: 'TEMPORARILY_CLOSED',
  UNDER_MAINTENANCE: 'UNDER_MAINTENANCE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type OperationalStatus = (typeof OperationalStatuses)[keyof typeof OperationalStatuses];

export const LeaseStatuses = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  EXPIRING: 'EXPIRING',
  RENEWED: 'RENEWED',
  TERMINATED: 'TERMINATED',
  EXPIRED: 'EXPIRED',
} as const;

export type LeaseStatus = (typeof LeaseStatuses)[keyof typeof LeaseStatuses];

export const InvoiceStatuses = {
  UPCOMING: 'UPCOMING',
  DUE_TODAY: 'DUE_TODAY',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  VOID: 'VOID',
} as const;

export type InvoiceStatus = (typeof InvoiceStatuses)[keyof typeof InvoiceStatuses];

export const PaymentMethods = {
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT_CARD: 'CREDIT_CARD',
  CHECK: 'CHECK',
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY',
} as const;

export type PaymentMethod = (typeof PaymentMethods)[keyof typeof PaymentMethods];

export const MaintenancePriorities = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type MaintenancePriority = (typeof MaintenancePriorities)[keyof typeof MaintenancePriorities];

export const MaintenanceStatuses = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING: 'WAITING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type MaintenanceStatus = (typeof MaintenanceStatuses)[keyof typeof MaintenanceStatuses];

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
