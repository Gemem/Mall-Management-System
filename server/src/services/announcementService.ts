import { prisma } from '../db.js';

export class AnnouncementService {
  static async getAnnouncements(filters?: {
    floorId?: string;
    sectionId?: string;
    tenantId?: string;
  }) {
    const now = new Date();

    const where: any = {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    };

    if (filters?.floorId || filters?.sectionId || filters?.tenantId) {
      where.AND = [
        {
          OR: [
            { targetScope: 'ALL' },
            filters.floorId ? { targetScope: 'FLOOR', targetFloorId: filters.floorId } : null,
            filters.sectionId ? { targetScope: 'SECTION', targetSectionId: filters.sectionId } : null,
            filters.tenantId ? { targetScope: 'TENANT', targetTenantId: filters.tenantId } : null,
          ].filter(Boolean),
        },
      ];
    }

    return prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  static async createAnnouncement(data: {
    title: string;
    content: string;
    targetScope?: string;
    targetFloorId?: string;
    targetSectionId?: string;
    targetTenantId?: string;
    priority?: string;
    expiresAt?: Date;
    authorId?: string;
  }) {
    return prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        targetScope: data.targetScope || 'ALL',
        targetFloorId: data.targetFloorId || null,
        targetSectionId: data.targetSectionId || null,
        targetTenantId: data.targetTenantId || null,
        priority: data.priority || 'NORMAL',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        authorId: data.authorId || null,
      },
      include: { author: true },
    });
  }

  static async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  static async markNotificationRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  static async markAllNotificationsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
