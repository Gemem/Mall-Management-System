import { prisma } from '../db.js';

export class TenantService {
  static async getTenants(filters: {
    status?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { companyName: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        leases: {
          where: { status: { in: ['ACTIVE', 'EXPIRING'] } },
          include: { shop: true },
        },
        invoices: {
          select: {
            amountOutstanding: true,
            status: true,
          },
        },
        _count: {
          select: {
            leases: true,
            maintenanceTickets: true,
            documents: true,
          },
        },
      },
      orderBy: { companyName: 'asc' },
    });

    return tenants.map((tenant) => {
      const totalOutstanding = tenant.invoices.reduce((sum, inv) => sum + inv.amountOutstanding, 0);
      const overdueCount = tenant.invoices.filter((inv) => inv.status === 'OVERDUE').length;

      return {
        ...tenant,
        financials: {
          totalOutstanding,
          overdueCount,
        },
      };
    });
  }

  static async getTenantById(id: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        leases: {
          include: {
            shop: {
              include: { floor: true, section: true },
            },
            amendments: true,
          },
          orderBy: { startDate: 'desc' },
        },
        invoices: {
          include: {
            allocations: {
              include: { payment: true },
            },
          },
          orderBy: { dueDate: 'desc' },
        },
        payments: {
          include: {
            receipt: true,
            reversal: true,
            allocations: {
              include: { invoice: true },
            },
          },
          orderBy: { transactionDate: 'desc' },
        },
        maintenanceTickets: {
          include: { shop: true },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
      },
    });

    if (!tenant) throw new Error(`Tenant with ID '${id}' not found`);

    const totalBilled = tenant.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = tenant.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalOutstanding = tenant.invoices.reduce((sum, inv) => sum + inv.amountOutstanding, 0);
    const overdueAmount = tenant.invoices
      .filter((inv) => inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.amountOutstanding, 0);

    return {
      ...tenant,
      ledgerSummary: {
        totalBilled,
        totalPaid,
        totalOutstanding,
        overdueAmount,
      },
    };
  }

  static async createTenant(data: {
    name: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    taxId?: string;
    registrationNumber?: string;
    emergencyContact?: string;
    notes?: string;
  }) {
    const existing = await prisma.tenant.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error(`A tenant with email '${data.email}' already exists.`);
    }

    return prisma.tenant.create({
      data: {
        name: data.name,
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        taxId: data.taxId || null,
        registrationNumber: data.registrationNumber || null,
        emergencyContact: data.emergencyContact || null,
        notes: data.notes || null,
        status: 'ACTIVE',
      },
    });
  }

  static async updateTenant(id: string, data: {
    name?: string;
    companyName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    taxId?: string;
    registrationNumber?: string;
    emergencyContact?: string;
    status?: string;
    notes?: string;
  }) {
    return prisma.tenant.update({
      where: { id },
      data,
    });
  }
}
