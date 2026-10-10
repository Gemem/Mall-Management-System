import { prisma } from '../db.js';
import { MaintenancePriority, MaintenanceStatus } from '../types/index.js';

export class MaintenanceService {
  static async getTickets(filters: {
    shopId?: string;
    tenantId?: string;
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
    category?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters.shopId) where.shopId = filters.shopId;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.category) where.category = filters.category;

    if (filters.search) {
      where.OR = [
        { ticketNumber: { contains: filters.search } },
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { shop: { shopNumber: { contains: filters.search } } },
      ];
    }

    return prisma.maintenanceTicket.findMany({
      where,
      include: {
        shop: {
          include: { floor: true, section: true },
        },
        tenant: true,
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getTicketById(id: string, includeInternalComments: boolean = true) {
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id },
      include: {
        shop: {
          include: { floor: true, section: true },
        },
        tenant: true,
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true },
        },
        comments: {
          where: includeInternalComments ? undefined : { isInternal: false },
          include: {
            user: {
              select: { id: true, name: true, role: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) throw new Error(`Ticket with ID '${id}' not found`);
    return ticket;
  }

  static async createTicket(data: {
    shopId: string;
    tenantId?: string;
    title: string;
    description: string;
    category: string;
    priority?: MaintenancePriority;
    assignedToId?: string;
  }) {
    const shop = await prisma.shop.findUnique({ where: { id: data.shopId } });
    if (!shop) throw new Error('Shop not found');

    const count = await prisma.maintenanceTicket.count();
    const ticketNumber = `MNT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    return prisma.maintenanceTicket.create({
      data: {
        ticketNumber,
        shopId: data.shopId,
        tenantId: data.tenantId || null,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority || 'MEDIUM',
        status: data.assignedToId ? 'ASSIGNED' : 'OPEN',
        assignedToId: data.assignedToId || null,
      },
      include: {
        shop: true,
        tenant: true,
        assignedTo: true,
      },
    });
  }

  static async updateTicketStatus(id: string, params: {
    status?: MaintenanceStatus;
    assignedToId?: string | null;
    priority?: MaintenancePriority;
    resolutionNotes?: string;
    estimatedCost?: number;
  }) {
    const ticket = await prisma.maintenanceTicket.findUnique({ where: { id } });
    if (!ticket) throw new Error('Ticket not found');

    const data: any = {};
    if (params.status) {
      data.status = params.status;
      if (params.status === 'RESOLVED' || params.status === 'CLOSED') {
        data.completedAt = new Date();
      }
    }
    if (params.assignedToId !== undefined) data.assignedToId = params.assignedToId;
    if (params.priority) data.priority = params.priority;
    if (params.resolutionNotes !== undefined) data.resolutionNotes = params.resolutionNotes;
    if (params.estimatedCost !== undefined) data.estimatedCost = params.estimatedCost;

    return prisma.maintenanceTicket.update({
      where: { id },
      data,
      include: {
        shop: true,
        tenant: true,
        assignedTo: true,
      },
    });
  }

  static async addComment(params: {
    ticketId: string;
    userId: string;
    message: string;
    isInternal?: boolean;
  }) {
    if (!params.message || params.message.trim().length === 0) {
      throw new Error('Comment message cannot be empty');
    }

    return prisma.maintenanceComment.create({
      data: {
        ticketId: params.ticketId,
        userId: params.userId,
        message: params.message,
        isInternal: params.isInternal ?? false,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
      },
    });
  }
}
