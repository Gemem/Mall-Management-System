import { prisma } from '../db.js';
import { ReportService } from './reportService.js';

export class DashboardService {
  static async getExecutiveMetrics() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      shops,
      leases,
      invoices,
      payments,
      tickets,
      expiringLeases,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.shop.findMany({ select: { occupancyStatus: true, operationalStatus: true } }),
      prisma.lease.findMany({ select: { id: true, status: true, endDate: true } }),
      prisma.invoice.findMany({
        where: {
          dueDate: { gte: currentMonthStart, lte: currentMonthEnd },
        },
        include: { tenant: true, lease: { include: { shop: true } } },
      }),
      prisma.payment.findMany({
        where: {
          transactionDate: { gte: currentMonthStart, lte: currentMonthEnd },
          status: 'POSTED',
        },
      }),
      prisma.maintenanceTicket.findMany({
        select: { status: true, priority: true },
      }),
      ReportService.getExpiringLeases(30),
      prisma.auditLog.findMany({
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Shop metrics
    const totalShops = shops.length;
    const occupiedShops = shops.filter((s) => s.occupancyStatus === 'OCCUPIED').length;
    const vacantShops = shops.filter((s) => s.occupancyStatus === 'VACANT').length;
    const reservedShops = shops.filter((s) => s.occupancyStatus === 'RESERVED').length;
    const operatingShops = shops.filter((s) => s.operationalStatus === 'OPEN').length;
    const temporarilyClosedShops = shops.filter((s) => s.operationalStatus === 'TEMPORARILY_CLOSED').length;
    const maintenanceShops = shops.filter((s) => s.operationalStatus === 'UNDER_MAINTENANCE').length;

    const occupancyRate = totalShops > 0 ? Number(((occupiedShops / totalShops) * 100).toFixed(1)) : 0;

    // Lease metrics
    const activeLeases = leases.filter((l) => l.status === 'ACTIVE').length;
    const expiringLeasesCount = expiringLeases.length;

    // Financial metrics (Current period)
    const expectedRent = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const collectedRent = payments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalance = invoices.reduce((sum, inv) => sum + inv.amountOutstanding, 0);

    // Overdue invoices across ALL time
    const allOverdueInvoices = await prisma.invoice.findMany({
      where: { status: 'OVERDUE' },
      include: {
        tenant: true,
        lease: { include: { shop: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const overdueCount = allOverdueInvoices.length;
    const overdueTotalAmount = allOverdueInvoices.reduce((sum, inv) => sum + inv.amountOutstanding, 0);

    // Maintenance metrics
    const openTicketsCount = tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
    const urgentTicketsCount = tickets.filter(
      (t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
    ).length;

    // Monthly collection trend (Last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const mEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const mInvoices = await prisma.invoice.findMany({
        where: { dueDate: { gte: mStart, lte: mEnd } },
        select: { totalAmount: true },
      });
      const mPayments = await prisma.payment.findMany({
        where: { transactionDate: { gte: mStart, lte: mEnd }, status: 'POSTED' },
        select: { amount: true },
      });

      const monthName = mStart.toLocaleString('default', { month: 'short' });
      monthlyTrend.push({
        month: monthName,
        billed: mInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) / 100,
        collected: mPayments.reduce((sum, p) => sum + p.amount, 0) / 100,
      });
    }

    return {
      kpis: {
        totalShops,
        occupiedShops,
        vacantShops,
        reservedShops,
        operatingShops,
        temporarilyClosedShops,
        maintenanceShops,
        occupancyRate,
        activeLeases,
        expiringLeasesCount,
        expectedRent,
        collectedRent,
        outstandingBalance,
        overdueCount,
        overdueTotalAmount,
        openTicketsCount,
        urgentTicketsCount,
      },
      monthlyTrend,
      allOverdueInvoices: allOverdueInvoices.slice(0, 5),
      expiringLeasesList: expiringLeases.slice(0, 5),
      recentActivity: recentAuditLogs,
    };
  }
}
