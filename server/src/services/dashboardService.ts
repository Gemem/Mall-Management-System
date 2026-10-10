import { prisma } from '../db.js';
import { ReportService } from './reportService.js';
import { JwtPayload } from '../types/index.js';

export class DashboardService {
  static async getExecutiveMetrics() {
    return this.getDashboardMetrics();
  }

  static async getDashboardMetrics(user?: JwtPayload) {
    const role = user?.role || 'MALL_OWNER';
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. TENANT DASHBOARD: Only see their own unit, invoices, tickets, announcements
    if (role === 'TENANT') {
      const tenantId = user?.tenantId;
      const [myShops, myInvoices, myTickets, announcements] = await Promise.all([
        tenantId
          ? prisma.shop.findMany({
              where: { leases: { some: { tenantId, status: 'ACTIVE' } } },
              include: { floor: true },
            })
          : [],
        tenantId
          ? prisma.invoice.findMany({
              where: { tenantId },
              include: { lease: { include: { shop: true } } },
              orderBy: { dueDate: 'desc' },
              take: 5,
            })
          : [],
        tenantId
          ? prisma.maintenanceTicket.findMany({
              where: { tenantId },
              include: { shop: true },
              orderBy: { createdAt: 'desc' },
              take: 5,
            })
          : [],
        prisma.announcement.findMany({
          orderBy: { publishedAt: 'desc' },
          take: 3,
        }),
      ]);

      const myOutstandingBalance = myInvoices.reduce((sum, inv) => sum + inv.amountOutstanding, 0);
      const myOpenTicketsCount = myTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
      const overdueInvoices = myInvoices.filter((i) => i.status === 'OVERDUE');

      return {
        role: 'TENANT',
        kpis: {
          myShopsCount: myShops.length,
          myOutstandingBalance,
          myOpenTicketsCount,
          overdueCount: overdueInvoices.length,
          overdueTotalAmount: overdueInvoices.reduce((sum, i) => sum + i.amountOutstanding, 0),
          // Stripped executive figures:
          totalShops: myShops.length,
          occupiedShops: 0,
          vacantShops: 0,
          reservedShops: 0,
          operatingShops: myShops.filter((s) => s.operationalStatus === 'OPEN').length,
          temporarilyClosedShops: 0,
          maintenanceShops: 0,
          occupancyRate: 100,
          activeLeases: myShops.length,
          expiringLeasesCount: 0,
          expectedRent: 0,
          collectedRent: 0,
          outstandingBalance: myOutstandingBalance,
          openTicketsCount: myOpenTicketsCount,
          urgentTicketsCount: myTickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length,
        },
        monthlyTrend: [], // Zero financial charts
        allOverdueInvoices: overdueInvoices,
        expiringLeasesList: [], // Zero lease agreements
        recentActivity: [],
        myShops,
        myInvoices,
        myTickets,
        announcements,
      };
    }

    // 2. MAINTENANCE DASHBOARD: Facilities, open tickets, SLAs, repair queues
    if (role === 'MAINTENANCE') {
      const [shops, tickets, recentTickets, announcements] = await Promise.all([
        prisma.shop.findMany({ select: { occupancyStatus: true, operationalStatus: true } }),
        prisma.maintenanceTicket.findMany({ select: { status: true, priority: true } }),
        prisma.maintenanceTicket.findMany({
          include: { shop: true, tenant: true },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
        prisma.announcement.findMany({
          orderBy: { publishedAt: 'desc' },
          take: 3,
        }),
      ]);

      const totalShops = shops.length;
      const operatingShops = shops.filter((s) => s.operationalStatus === 'OPEN').length;
      const temporarilyClosedShops = shops.filter((s) => s.operationalStatus === 'TEMPORARILY_CLOSED').length;
      const maintenanceShops = shops.filter((s) => s.operationalStatus === 'UNDER_MAINTENANCE').length;
      const openTicketsCount = tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
      const urgentTicketsCount = tickets.filter(
        (t) => (t.priority === 'URGENT' || t.priority === 'HIGH') && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
      ).length;

      return {
        role: 'MAINTENANCE',
        kpis: {
          totalShops,
          operatingShops,
          temporarilyClosedShops,
          maintenanceShops,
          openTicketsCount,
          urgentTicketsCount,
          // Stripped financial figures:
          occupiedShops: 0,
          vacantShops: 0,
          reservedShops: 0,
          occupancyRate: 0,
          activeLeases: 0,
          expiringLeasesCount: 0,
          expectedRent: 0,
          collectedRent: 0,
          outstandingBalance: 0,
          overdueCount: 0,
          overdueTotalAmount: 0,
        },
        monthlyTrend: [], // Zero financial charts
        allOverdueInvoices: [], // Zero arrears
        expiringLeasesList: [], // Zero lease agreements
        recentActivity: [],
        recentTickets,
        announcements,
      };
    }

    // 3. ACCOUNTANT DASHBOARD: Billing verification, receipts, collections ledger
    if (role === 'ACCOUNTANT') {
      const [allOverdueInvoices, invoices, payments] = await Promise.all([
        prisma.invoice.findMany({
          where: { status: 'OVERDUE' },
          include: { tenant: true, lease: { include: { shop: true } } },
          orderBy: { dueDate: 'asc' },
          take: 8,
        }),
        prisma.invoice.findMany({
          where: { dueDate: { gte: currentMonthStart, lte: currentMonthEnd } },
          select: { id: true, status: true, totalAmount: true },
        }),
        prisma.payment.findMany({
          where: { transactionDate: { gte: currentMonthStart, lte: currentMonthEnd }, status: 'POSTED' },
          select: { id: true, amount: true },
        }),
      ]);

      const overdueCount = allOverdueInvoices.length;
      const overdueTotalAmount = allOverdueInvoices.reduce((sum, inv) => sum + inv.amountOutstanding, 0);

      return {
        role: 'ACCOUNTANT',
        kpis: {
          invoicesCount: invoices.length,
          paymentsCount: payments.length,
          overdueCount,
          overdueTotalAmount,
          outstandingBalance: overdueTotalAmount,
          // Stripped executive figures:
          expectedRent: 0,
          collectedRent: 0,
          totalShops: 0,
          occupiedShops: 0,
          vacantShops: 0,
          reservedShops: 0,
          operatingShops: 0,
          temporarilyClosedShops: 0,
          maintenanceShops: 0,
          occupancyRate: 0,
          activeLeases: 0,
          expiringLeasesCount: 0,
          openTicketsCount: 0,
          urgentTicketsCount: 0,
        },
        monthlyTrend: [], // Zero executive revenue trend charts
        allOverdueInvoices,
        expiringLeasesList: [], // Zero lease agreements
        recentActivity: [],
      };
    }

    // 4. EXECUTIVE DASHBOARD (MALL_OWNER and MALL_MANAGER): Full portfolio metrics
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
      role,
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
