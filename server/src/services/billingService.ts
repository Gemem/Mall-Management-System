import { prisma } from '../db.js';
import { InvoiceStatus } from '../types/index.js';

export class BillingService {
  /**
   * Deterministically calculates invoice status from financial state, due date and current time.
   * Edge-case Precedence Rule: If past due date and any amount is outstanding, it is OVERDUE (even if partially paid).
   */
  static determineStatus(
    totalAmount: number,
    amountPaid: number,
    amountOutstanding: number,
    dueDate: Date,
    currentDate: Date = new Date()
  ): InvoiceStatus {
    if (amountOutstanding <= 0) {
      return 'PAID';
    }

    const dueTime = new Date(dueDate).setHours(23, 59, 59, 999);
    const currTime = currentDate.getTime();

    // Past due date with remaining balance
    if (currTime > dueTime) {
      return 'OVERDUE';
    }

    // Has received payment but not yet past due
    if (amountPaid > 0 && amountOutstanding > 0) {
      return 'PARTIALLY_PAID';
    }

    const isSameDay =
      dueDate.getFullYear() === currentDate.getFullYear() &&
      dueDate.getMonth() === currentDate.getMonth() &&
      dueDate.getDate() === currentDate.getDate();

    if (isSameDay) {
      return 'DUE_TODAY';
    }

    return 'UPCOMING';
  }

  static async getInvoices(filters: {
    tenantId?: string;
    leaseId?: string;
    status?: InvoiceStatus;
    search?: string;
  }) {
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.leaseId) where.leaseId = filters.leaseId;
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search } },
        { tenant: { companyName: { contains: filters.search } } },
        { lease: { shop: { shopNumber: { contains: filters.search } } } },
      ];
    }

    return prisma.invoice.findMany({
      where,
      include: {
        tenant: true,
        lease: {
          include: {
            shop: {
              include: { floor: true, section: true },
            },
          },
        },
        allocations: {
          include: {
            payment: true,
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  static async getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        tenant: true,
        lease: {
          include: {
            shop: {
              include: { floor: true, section: true },
            },
          },
        },
        allocations: {
          include: {
            payment: {
              include: {
                recordedBy: true,
                receipt: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) throw new Error(`Invoice with ID '${id}' not found`);
    return invoice;
  }

  /**
   * Generates monthly billing invoices for all active leases for a given year & month.
   */
  static async generateMonthlyInvoices(year: number, month: number) {
    const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // Find all active or expiring leases spanning this period
    const leases = await prisma.lease.findMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING'] },
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      include: { tenant: true, shop: true },
    });

    const generatedInvoices = [];
    const now = new Date();

    for (const lease of leases) {
      // Check if invoice for this period already exists
      const existing = await prisma.invoice.findFirst({
        where: {
          leaseId: lease.id,
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
        },
      });

      if (!existing) {
        // Compute due date based on lease dueDay
        const dueDay = Math.min(lease.dueDay || 1, 28);
        const dueDate = new Date(Date.UTC(year, month - 1, dueDay, 23, 59, 59));

        const baseRent = lease.rentAmount;
        const recurringCharges = lease.recurringCharges;
        const totalAmount = baseRent + recurringCharges;
        const amountPaid = 0;
        const amountOutstanding = totalAmount;

        const status = this.determineStatus(totalAmount, amountPaid, amountOutstanding, dueDate, now);

        const count = await prisma.invoice.count();
        const invoiceNumber = `INV-${year}-${String(count + 1).padStart(3, '0')}`;

        const created = await prisma.invoice.create({
          data: {
            invoiceNumber,
            leaseId: lease.id,
            tenantId: lease.tenantId,
            periodStart,
            periodEnd,
            dueDate,
            baseRent,
            recurringCharges,
            lateFee: 0,
            totalAmount,
            amountPaid,
            amountOutstanding,
            status,
            notes: `Regular monthly billing for ${lease.shop.shopNumber} (${lease.tenant.companyName}).`,
          },
        });

        generatedInvoices.push(created);
      }
    }

    return {
      message: `Generated ${generatedInvoices.length} billing obligations for ${year}-${String(month).padStart(2, '0')}.`,
      count: generatedInvoices.length,
      invoices: generatedInvoices,
    };
  }
}
