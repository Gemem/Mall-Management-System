import { prisma } from '../db.js';

export class ReportService {
  static async getFinancialSummary(periodStart?: Date, periodEnd?: Date) {
    const whereInvoice: any = {};
    const wherePayment: any = { status: 'POSTED' };

    if (periodStart || periodEnd) {
      whereInvoice.dueDate = {};
      wherePayment.transactionDate = {};
      if (periodStart) {
        whereInvoice.dueDate.gte = new Date(periodStart);
        wherePayment.transactionDate.gte = new Date(periodStart);
      }
      if (periodEnd) {
        whereInvoice.dueDate.lte = new Date(periodEnd);
        wherePayment.transactionDate.lte = new Date(periodEnd);
      }
    }

    const invoices = await prisma.invoice.findMany({ where: whereInvoice });
    const payments = await prisma.payment.findMany({ where: wherePayment });
    const reversals = await prisma.paymentReversal.findMany({
      include: { payment: true },
    });

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalCollected = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.amountOutstanding, 0);
    const totalOverdue = invoices
      .filter((inv) => inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.amountOutstanding, 0);

    const totalReversed = reversals.reduce((sum, rev) => sum + rev.payment.amount, 0);
    const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      totalReversed,
      collectionRate,
      invoiceCount: invoices.length,
      paymentCount: payments.length,
      reversalCount: reversals.length,
    };
  }

  static async getAgingReceivables() {
    const now = new Date();
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        amountOutstanding: { gt: 0 },
        status: { not: 'VOID' },
      },
      include: {
        tenant: true,
        lease: {
          include: { shop: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const buckets = {
      current: { label: 'Current (0-30 Days)', total: 0, count: 0 },
      days30to60: { label: '31-60 Days Overdue', total: 0, count: 0 },
      days60to90: { label: '61-90 Days Overdue', total: 0, count: 0 },
      days90Plus: { label: '90+ Days Overdue', total: 0, count: 0 },
    };

    const tenantBreakdownMap = new Map<string, {
      tenantName: string;
      shopNumbers: string[];
      totalOutstanding: number;
      oldestDueDate: Date;
      daysOverdue: number;
    }>();

    for (const inv of unpaidInvoices) {
      const diffMs = now.getTime() - new Date(inv.dueDate).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        buckets.current.total += inv.amountOutstanding;
        buckets.current.count += 1;
      } else if (diffDays <= 60) {
        buckets.days30to60.total += inv.amountOutstanding;
        buckets.days30to60.count += 1;
      } else if (diffDays <= 90) {
        buckets.days60to90.total += inv.amountOutstanding;
        buckets.days60to90.count += 1;
      } else {
        buckets.days90Plus.total += inv.amountOutstanding;
        buckets.days90Plus.count += 1;
      }

      const tenantId = inv.tenantId;
      if (!tenantBreakdownMap.has(tenantId)) {
        tenantBreakdownMap.set(tenantId, {
          tenantName: inv.tenant.companyName,
          shopNumbers: [inv.lease.shop.shopNumber],
          totalOutstanding: 0,
          oldestDueDate: inv.dueDate,
          daysOverdue: Math.max(0, diffDays),
        });
      }

      const tRecord = tenantBreakdownMap.get(tenantId)!;
      tRecord.totalOutstanding += inv.amountOutstanding;
      if (inv.dueDate < tRecord.oldestDueDate) {
        tRecord.oldestDueDate = inv.dueDate;
        tRecord.daysOverdue = Math.max(0, diffDays);
      }
      if (!tRecord.shopNumbers.includes(inv.lease.shop.shopNumber)) {
        tRecord.shopNumbers.push(inv.lease.shop.shopNumber);
      }
    }

    return {
      buckets,
      tenants: Array.from(tenantBreakdownMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding),
    };
  }

  static async getOccupancyReport() {
    const shops = await prisma.shop.findMany({
      include: {
        floor: true,
      },
    });

    const totalShops = shops.length;
    const occupiedShops = shops.filter((s) => s.occupancyStatus === 'OCCUPIED').length;
    const vacantShops = shops.filter((s) => s.occupancyStatus === 'VACANT').length;
    const reservedShops = shops.filter((s) => s.occupancyStatus === 'RESERVED').length;

    const totalArea = shops.reduce((sum, s) => sum + s.areaSqFt, 0);
    const occupiedArea = shops
      .filter((s) => s.occupancyStatus === 'OCCUPIED')
      .reduce((sum, s) => sum + s.areaSqFt, 0);

    const occupancyRate = totalShops > 0 ? Number(((occupiedShops / totalShops) * 100).toFixed(1)) : 0;
    const areaOccupancyRate = totalArea > 0 ? Number(((occupiedArea / totalArea) * 100).toFixed(1)) : 0;

    // Breakdown by Floor
    const floorMap = new Map<string, { floorName: string; total: number; occupied: number; vacant: number }>();
    for (const s of shops) {
      if (!floorMap.has(s.floorId)) {
        floorMap.set(s.floorId, {
          floorName: s.floor.name,
          total: 0,
          occupied: 0,
          vacant: 0,
        });
      }
      const f = floorMap.get(s.floorId)!;
      f.total += 1;
      if (s.occupancyStatus === 'OCCUPIED') f.occupied += 1;
      if (s.occupancyStatus === 'VACANT') f.vacant += 1;
    }

    // Breakdown by Category
    const categoryMap = new Map<string, number>();
    for (const s of shops) {
      const cat = s.businessCategory || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }

    return {
      totalShops,
      occupiedShops,
      vacantShops,
      reservedShops,
      totalArea,
      occupiedArea,
      occupancyRate,
      areaOccupancyRate,
      byFloor: Array.from(floorMap.values()),
      byCategory: Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count })),
    };
  }

  static async getExpiringLeases(daysThreshold: number = 60) {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return prisma.lease.findMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING'] },
        endDate: {
          gte: now,
          lte: thresholdDate,
        },
      },
      include: {
        tenant: true,
        shop: {
          include: { floor: true },
        },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  static async generateCsv(reportType: string): Promise<string> {
    if (reportType === 'invoices') {
      const invoices = await prisma.invoice.findMany({
        include: { tenant: true, lease: { include: { shop: true } } },
        orderBy: { dueDate: 'desc' },
      });

      const headers = ['Invoice Number', 'Tenant', 'Shop', 'Due Date', 'Total Amount ($)', 'Paid ($)', 'Outstanding ($)', 'Status'];
      const rows = invoices.map((inv) => [
        inv.invoiceNumber,
        `"${inv.tenant.companyName.replace(/"/g, '""')}"`,
        inv.lease.shop.shopNumber,
        inv.dueDate.toISOString().split('T')[0],
        (inv.totalAmount / 100).toFixed(2),
        (inv.amountPaid / 100).toFixed(2),
        (inv.amountOutstanding / 100).toFixed(2),
        inv.status,
      ]);

      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (reportType === 'payments') {
      const payments = await prisma.payment.findMany({
        include: { tenant: true, reversal: true },
        orderBy: { transactionDate: 'desc' },
      });

      const headers = ['Payment Number', 'Tenant', 'Date', 'Method', 'Reference', 'Amount ($)', 'Status'];
      const rows = payments.map((p) => [
        p.paymentNumber,
        `"${p.tenant.companyName.replace(/"/g, '""')}"`,
        p.transactionDate.toISOString().split('T')[0],
        p.paymentMethod,
        p.referenceNumber || '',
        (p.amount / 100).toFixed(2),
        p.status,
      ]);

      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (reportType === 'shops') {
      const shops = await prisma.shop.findMany({
        include: { floor: true },
        orderBy: { shopNumber: 'asc' },
      });

      const headers = ['Shop Number', 'Unit Name', 'Floor', 'Area (Sq Ft)', 'Category', 'Base Rent ($)', 'Occupancy', 'Operational Status'];
      const rows = shops.map((s) => [
        s.shopNumber,
        `"${s.name.replace(/"/g, '""')}"`,
        s.floor.name,
        s.areaSqFt,
        `"${s.businessCategory}"`,
        (s.baseRent / 100).toFixed(2),
        s.occupancyStatus,
        s.operationalStatus,
      ]);

      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    throw new Error(`Unknown report type: ${reportType}`);
  }
}
