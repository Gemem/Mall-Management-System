import { prisma } from '../db.js';

export class MallService {
  static async getMallDetails() {
    const mall = await prisma.mall.findFirst({
      include: {
        floors: {
          include: {
            sections: true,
            _count: {
              select: { shops: true },
            },
          },
          orderBy: { floorNumber: 'asc' },
        },
        settings: true,
      },
    });
    return mall;
  }

  static async updateMallDetails(id: string, data: {
    name?: string;
    tagline?: string;
    currency?: string;
    currencySymbol?: string;
    timezone?: string;
    dateFormat?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
  }) {
    return prisma.mall.update({
      where: { id },
      data,
    });
  }

  static async getFloors() {
    return prisma.floor.findMany({
      include: {
        sections: true,
        _count: {
          select: { shops: true },
        },
      },
      orderBy: { floorNumber: 'asc' },
    });
  }

  static async createFloor(data: {
    mallId: string;
    floorNumber: number;
    name: string;
    description?: string;
  }) {
    return prisma.floor.create({
      data,
    });
  }

  static async updateFloor(id: string, data: {
    floorNumber?: number;
    name?: string;
    description?: string;
  }) {
    return prisma.floor.update({
      where: { id },
      data,
    });
  }

  static async deleteFloor(id: string) {
    const shopsCount = await prisma.shop.count({ where: { floorId: id } });
    if (shopsCount > 0) {
      throw new Error(`Cannot delete floor: ${shopsCount} shops are registered on this floor. Remove or move shops first.`);
    }
    return prisma.floor.delete({ where: { id } });
  }

  static async getSections(floorId?: string) {
    return prisma.section.findMany({
      where: floorId ? { floorId } : undefined,
      include: {
        floor: true,
        _count: {
          select: { shops: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  static async createSection(data: {
    floorId: string;
    name: string;
    code: string;
    description?: string;
  }) {
    return prisma.section.create({
      data,
    });
  }
}
