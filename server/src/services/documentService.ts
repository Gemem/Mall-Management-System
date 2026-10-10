import { prisma } from '../db.js';

export class DocumentService {
  static async getDocuments(filters: {
    tenantId?: string;
    shopId?: string;
    leaseId?: string;
    documentType?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.shopId) where.shopId = filters.shopId;
    if (filters.leaseId) where.leaseId = filters.leaseId;
    if (filters.documentType) where.documentType = filters.documentType;

    if (filters.search) {
      where.title = { contains: filters.search };
    }

    return prisma.document.findMany({
      where,
      include: {
        tenant: true,
        shop: true,
        lease: true,
        uploadedBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createDocument(data: {
    title: string;
    documentType: string;
    filePath: string;
    fileUrl?: string;
    fileSize: number;
    mimeType: string;
    expiryDate?: Date;
    tenantId?: string;
    leaseId?: string;
    shopId?: string;
    uploadedById?: string;
  }) {
    return prisma.document.create({
      data: {
        title: data.title,
        documentType: data.documentType,
        filePath: data.filePath,
        fileUrl: data.fileUrl || data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        tenantId: data.tenantId || null,
        leaseId: data.leaseId || null,
        shopId: data.shopId || null,
        uploadedById: data.uploadedById || null,
      },
    });
  }

  static async deleteDocument(id: string) {
    return prisma.document.delete({ where: { id } });
  }

  static async getExpiringDocuments(daysThreshold: number = 30) {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return prisma.document.findMany({
      where: {
        expiryDate: {
          gte: now,
          lte: thresholdDate,
        },
      },
      include: {
        tenant: true,
        shop: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }
}
