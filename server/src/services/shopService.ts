import { prisma } from '../db.js';
import { OccupancyStatus, OperationalStatus } from '../types/index.js';

export class ShopService {
  static async getShops(filters: {
    floorId?: string;
    sectionId?: string;
    occupancyStatus?: OccupancyStatus;
    operationalStatus?: OperationalStatus;
    search?: string;
  }) {
    const where: any = {};

    if (filters.floorId) where.floorId = filters.floorId;
    if (filters.sectionId) where.sectionId = filters.sectionId;
    if (filters.occupancyStatus) where.occupancyStatus = filters.occupancyStatus;
    if (filters.operationalStatus) where.operationalStatus = filters.operationalStatus;

    if (filters.search) {
      where.OR = [
        { shopNumber: { contains: filters.search } },
        { name: { contains: filters.search } },
        { businessCategory: { contains: filters.search } },
      ];
    }

    return prisma.shop.findMany({
      where,
      include: {
        floor: true,
        section: true,
        leases: {
          where: { status: { in: ['ACTIVE', 'EXPIRING'] } },
          include: { tenant: true },
          take: 1,
        },
      },
      orderBy: { shopNumber: 'asc' },
    });
  }

  static async getShopById(id: string) {
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        floor: true,
        section: true,
        leases: {
          include: {
            tenant: true,
            invoices: {
              orderBy: { dueDate: 'desc' },
              take: 5,
            },
          },
          orderBy: { startDate: 'desc' },
        },
        operationalLogs: {
          include: { changedBy: true },
          orderBy: { createdAt: 'desc' },
          take: 15,
        },
        maintenanceTickets: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        documents: true,
      },
    });

    if (!shop) {
      throw new Error(`Shop with ID '${id}' not found`);
    }

    return shop;
  }

  static async createShop(data: {
    floorId: string;
    sectionId?: string;
    shopNumber: string;
    name: string;
    areaSqFt: number;
    businessCategory: string;
    description?: string;
    baseRent: number; // in cents
    recurringCharges?: number; // in cents
    occupancyStatus?: OccupancyStatus;
    operationalStatus?: OperationalStatus;
  }) {
    const existing = await prisma.shop.findUnique({
      where: { shopNumber: data.shopNumber },
    });

    if (existing) {
      throw new Error(`A shop with number '${data.shopNumber}' already exists.`);
    }

    const occupancyStatus = data.occupancyStatus || 'VACANT';
    let operationalStatus = data.operationalStatus || 'NOT_APPLICABLE';

    if (occupancyStatus === 'VACANT' && operationalStatus === 'OPEN') {
      throw new Error('A vacant shop cannot be marked as OPEN. It must have an active occupant or be reserved.');
    }

    return prisma.shop.create({
      data: {
        floorId: data.floorId,
        sectionId: data.sectionId || null,
        shopNumber: data.shopNumber,
        name: data.name,
        areaSqFt: data.areaSqFt,
        businessCategory: data.businessCategory,
        description: data.description || null,
        baseRent: data.baseRent,
        recurringCharges: data.recurringCharges || 0,
        occupancyStatus,
        operationalStatus,
      },
    });
  }

  static async updateShop(id: string, data: {
    floorId?: string;
    sectionId?: string | null;
    name?: string;
    areaSqFt?: number;
    businessCategory?: string;
    description?: string;
    baseRent?: number;
    recurringCharges?: number;
    occupancyStatus?: OccupancyStatus;
  }) {
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new Error(`Shop not found`);

    if (data.occupancyStatus === 'VACANT' && shop.operationalStatus === 'OPEN') {
      // Automatically adjust operational status if made vacant
      return prisma.shop.update({
        where: { id },
        data: {
          ...data,
          operationalStatus: 'NOT_APPLICABLE',
        },
      });
    }

    return prisma.shop.update({
      where: { id },
      data,
    });
  }

  static async deleteShop(id: string) {
    const activeLease = await prisma.lease.findFirst({
      where: { shopId: id, status: { in: ['ACTIVE', 'EXPIRING'] } },
    });
    if (activeLease) {
      throw new Error('Cannot delete shop while an active lease is in effect.');
    }

    return prisma.shop.delete({ where: { id } });
  }

  static async updateOperationalStatus(
    shopId: string,
    params: {
      newStatus: OperationalStatus;
      reason?: string;
      notes?: string;
      changedById?: string;
    }
  ) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error(`Shop with ID '${shopId}' not found`);

    // Business rule validations:
    if (shop.occupancyStatus === 'VACANT' && params.newStatus === 'OPEN') {
      throw new Error('Cannot set operational status to OPEN for a VACANT shop.');
    }

    const previousStatus = shop.operationalStatus;

    const [updatedShop, log] = await prisma.$transaction([
      prisma.shop.update({
        where: { id: shopId },
        data: { operationalStatus: params.newStatus },
      }),
      prisma.shopOperationalLog.create({
        data: {
          shopId,
          previousStatus,
          newStatus: params.newStatus,
          reason: params.reason || null,
          notes: params.notes || null,
          changedById: params.changedById || null,
        },
      }),
    ]);

    return { shop: updatedShop, log };
  }

  static async getVisualFloorLayout(floorId?: string) {
    const floors = await prisma.floor.findMany({
      where: floorId ? { id: floorId } : undefined,
      include: {
        sections: {
          include: {
            shops: {
              include: {
                leases: {
                  where: { status: { in: ['ACTIVE', 'EXPIRING'] } },
                  include: { tenant: true },
                  take: 1,
                },
              },
              orderBy: { shopNumber: 'asc' },
            },
          },
        },
        shops: {
          where: { sectionId: null },
          include: {
            leases: {
              where: { status: { in: ['ACTIVE', 'EXPIRING'] } },
              include: { tenant: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { floorNumber: 'asc' },
    });

    return floors;
  }
}
