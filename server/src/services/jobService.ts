import { prisma } from '../db.js';

export class JobService {
  static async runAutomatedChecks() {
    const now = new Date();
    const results = {
      invoicesMarkedOverdue: 0,
      leaseExpiryNotifications: 0,
    };

    // 1. Check for unpaid invoices past due date
    const overdueCandidates = await prisma.invoice.findMany({
      where: {
        amountOutstanding: { gt: 0 },
        dueDate: { lt: now },
        status: { notIn: ['OVERDUE', 'VOID', 'PAID'] },
      },
      include: { tenant: true },
    });

    for (const inv of overdueCandidates) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { status: 'OVERDUE' },
      });
      results.invoicesMarkedOverdue++;
    }

    // 2. Check for expiring leases (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringLeases = await prisma.lease.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: now, lte: thirtyDaysFromNow },
      },
      include: { tenant: true, shop: true },
    });

    for (const lease of expiringLeases) {
      await prisma.lease.update({
        where: { id: lease.id },
        data: { status: 'EXPIRING' },
      });
      results.leaseExpiryNotifications++;
    }

    // Record job execution
    await prisma.backgroundJob.create({
      data: {
        jobType: 'OVERDUE_AND_EXPIRY_CHECK',
        status: 'COMPLETED',
        payload: JSON.stringify({ runAt: now }),
        result: JSON.stringify(results),
        completedAt: new Date(),
      },
    });

    return results;
  }
}
