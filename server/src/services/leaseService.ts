import { prisma } from '../db.js';
import { LeaseStatus } from '../types/index.js';

export class LeaseService {
  static async getLeases(filters: {
    tenantId?: string;
    shopId?: string;
    status?: LeaseStatus;
    search?: string;
  }) {
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.shopId) where.shopId = filters.shopId;
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.OR = [
        { leaseNumber: { contains: filters.search } },
        { tenant: { companyName: { contains: filters.search } } },
        { shop: { shopNumber: { contains: filters.search } } },
      ];
    }

    return prisma.lease.findMany({
      where,
      include: {
        tenant: true,
        shop: {
          include: { floor: true, section: true },
        },
        _count: {
          select: { invoices: true, amendments: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  static async getLeaseById(id: string) {
    const lease = await prisma.lease.findUnique({
      where: { id },
      include: {
        tenant: true,
        shop: {
          include: { floor: true, section: true },
        },
        amendments: {
          orderBy: { effectiveDate: 'desc' },
        },
        invoices: {
          include: {
            allocations: {
              include: { payment: true },
            },
          },
          orderBy: { dueDate: 'desc' },
        },
        documents: true,
      },
    });

    if (!lease) throw new Error(`Lease with ID '${id}' not found`);
    return lease;
  }

  static async createLease(data: {
    tenantId: string;
    shopId: string;
    startDate: Date;
    endDate: Date;
    rentAmount: number; // in cents
    recurringCharges?: number; // in cents
    depositAmount?: number; // in cents
    depositPaid?: boolean;
    billingFrequency?: string;
    dueDay?: number;
    gracePeriodDays?: number;
    lateFeePercentage?: number;
    terms?: string;
    status?: LeaseStatus;
  }) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      throw new Error('Lease end date must be strictly after the start date.');
    }

    const shop = await prisma.shop.findUnique({ where: { id: data.shopId } });
    if (!shop) throw new Error(`Shop not found.`);

    const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } });
    if (!tenant) throw new Error(`Tenant not found.`);

    // Collision check: prevent overlapping active leases on the same shop
    const overlappingLease = await prisma.lease.findFirst({
      where: {
        shopId: data.shopId,
        status: { in: ['ACTIVE', 'EXPIRING'] },
        AND: [
          { startDate: { lte: endDate } },
          { endDate: { gte: startDate } },
        ],
      },
      include: { tenant: true },
    });

    if (overlappingLease) {
      throw new Error(
        `Shop ${shop.shopNumber} is already occupied by ${overlappingLease.tenant.companyName} (Lease ${overlappingLease.leaseNumber}) from ${overlappingLease.startDate.toISOString().split('T')[0]} to ${overlappingLease.endDate.toISOString().split('T')[0]}. Overlapping active leases are prohibited.`
      );
    }

    const count = await prisma.lease.count();
    const leaseNumber = `LSE-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    const status = data.status || 'ACTIVE';

    const lease = await prisma.$transaction(async (tx) => {
      const createdLease = await tx.lease.create({
        data: {
          leaseNumber,
          tenantId: data.tenantId,
          shopId: data.shopId,
          startDate,
          endDate,
          rentAmount: data.rentAmount,
          recurringCharges: data.recurringCharges || 0,
          depositAmount: data.depositAmount || 0,
          depositPaid: data.depositPaid ?? false,
          billingFrequency: data.billingFrequency || 'MONTHLY',
          dueDay: data.dueDay || 1,
          gracePeriodDays: data.gracePeriodDays || 5,
          lateFeePercentage: data.lateFeePercentage || 5.0,
          terms: data.terms || null,
          status,
        },
      });

      // Update shop occupancy
      await tx.shop.update({
        where: { id: data.shopId },
        data: {
          occupancyStatus: status === 'ACTIVE' ? 'OCCUPIED' : 'RESERVED',
          currentLeaseId: createdLease.id,
          operationalStatus: shop.operationalStatus === 'NOT_APPLICABLE' ? 'NOT_YET_OPENED' : shop.operationalStatus,
        },
      });

      return createdLease;
    });

    return lease;
  }

  static async renewLease(id: string, params: {
    newEndDate: Date;
    newRentAmount: number; // in cents
    newRecurringCharges?: number;
    reason: string;
    approvedById?: string;
  }) {
    const lease = await prisma.lease.findUnique({ where: { id } });
    if (!lease) throw new Error(`Lease not found`);

    const newEndDate = new Date(params.newEndDate);
    if (newEndDate <= lease.endDate) {
      throw new Error(`Renewal end date must be after current lease end date (${lease.endDate.toISOString().split('T')[0]}).`);
    }

    const previousRent = lease.rentAmount;
    const amendmentCount = await prisma.leaseAmendment.count({ where: { leaseId: id } });

    return prisma.$transaction(async (tx) => {
      // 1. Record amendment to preserve historical rent and audit terms
      await tx.leaseAmendment.create({
        data: {
          leaseId: id,
          amendmentNumber: amendmentCount + 1,
          effectiveDate: new Date(),
          previousRent,
          newRent: params.newRentAmount,
          changeReason: params.reason,
          approvedBy: params.approvedById || null,
        },
      });

      // 2. Update lease terms
      const updated = await tx.lease.update({
        where: { id },
        data: {
          endDate: newEndDate,
          rentAmount: params.newRentAmount,
          recurringCharges: params.newRecurringCharges ?? lease.recurringCharges,
          status: 'ACTIVE',
        },
        include: {
          amendments: true,
          shop: true,
          tenant: true,
        },
      });

      return updated;
    });
  }

  static async terminateLease(id: string, params: {
    terminationDate: Date;
    reason: string;
  }) {
    const lease = await prisma.lease.findUnique({
      where: { id },
      include: { shop: true },
    });
    if (!lease) throw new Error('Lease not found');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.lease.update({
        where: { id },
        data: {
          status: 'TERMINATED',
          endDate: new Date(params.terminationDate),
        },
      });

      // Update shop back to vacant
      await tx.shop.update({
        where: { id: lease.shopId },
        data: {
          occupancyStatus: 'VACANT',
          operationalStatus: 'NOT_APPLICABLE',
          currentLeaseId: null,
        },
      });

      return updated;
    });
  }
}
