import { prisma } from '../db.js';
import { BillingService } from './billingService.js';
import { PaymentMethod } from '../types/index.js';

export interface InvoiceAllocationInput {
  invoiceId: string;
  amountAllocated: number; // in cents
}

export class PaymentService {
  static async getPayments(filters: {
    tenantId?: string;
    leaseId?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.leaseId) where.leaseId = filters.leaseId;
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.OR = [
        { paymentNumber: { contains: filters.search } },
        { referenceNumber: { contains: filters.search } },
        { tenant: { companyName: { contains: filters.search } } },
      ];
    }

    return prisma.payment.findMany({
      where,
      include: {
        tenant: true,
        recordedBy: true,
        receipt: true,
        reversal: true,
        allocations: {
          include: {
            invoice: {
              include: {
                lease: {
                  include: { shop: true },
                },
              },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }

  static async getPaymentById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        tenant: true,
        recordedBy: true,
        receipt: true,
        reversal: true,
        allocations: {
          include: {
            invoice: {
              include: {
                lease: {
                  include: { shop: true },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) throw new Error(`Payment with ID '${id}' not found`);
    return payment;
  }

  /**
   * Atomic recording of a payment with deterministic invoice allocations and receipt generation.
   */
  static async recordPayment(params: {
    tenantId: string;
    leaseId?: string;
    amount: number; // in cents
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    transactionDate: Date;
    recordedById?: string;
    notes?: string;
    autoAllocate?: boolean;
    invoiceAllocations?: InvoiceAllocationInput[];
  }) {
    if (!params.amount || params.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
    if (!tenant) throw new Error('Tenant not found.');

    const now = new Date();

    return prisma.$transaction(async (tx) => {
      // 1. Determine allocation breakdown
      let allocationsToProcess: { invoiceId: string; amountAllocated: number }[] = [];

      if (params.autoAllocate) {
        // Fetch unpaid or partially paid invoices ordered by oldest dueDate
        const unpaidInvoices = await tx.invoice.findMany({
          where: {
            tenantId: params.tenantId,
            amountOutstanding: { gt: 0 },
            status: { not: 'VOID' },
          },
          orderBy: { dueDate: 'asc' },
        });

        let remainingToAllocate = params.amount;

        for (const inv of unpaidInvoices) {
          if (remainingToAllocate <= 0) break;
          const alloc = Math.min(remainingToAllocate, inv.amountOutstanding);
          allocationsToProcess.push({
            invoiceId: inv.id,
            amountAllocated: alloc,
          });
          remainingToAllocate -= alloc;
        }
      } else if (params.invoiceAllocations && params.invoiceAllocations.length > 0) {
        const totalAllocated = params.invoiceAllocations.reduce((sum, a) => sum + a.amountAllocated, 0);
        if (totalAllocated > params.amount) {
          throw new Error(`Total allocated amount ($${(totalAllocated / 100).toFixed(2)}) cannot exceed payment amount ($${(params.amount / 100).toFixed(2)}).`);
        }

        for (const alloc of params.invoiceAllocations) {
          const inv = await tx.invoice.findUnique({ where: { id: alloc.invoiceId } });
          if (!inv) throw new Error(`Invoice '${alloc.invoiceId}' not found.`);
          if (alloc.amountAllocated <= 0) throw new Error('Allocation amount must be greater than zero.');
          if (alloc.amountAllocated > inv.amountOutstanding) {
            throw new Error(
              `Allocation of $${(alloc.amountAllocated / 100).toFixed(2)} exceeds invoice ${inv.invoiceNumber} outstanding balance of $${(inv.amountOutstanding / 100).toFixed(2)}.`
            );
          }
          allocationsToProcess.push(alloc);
        }
      }

      // 2. Create Payment record
      const paymentCount = await tx.payment.count();
      const paymentNumber = `PAY-${now.getFullYear()}-${String(paymentCount + 1).padStart(3, '0')}`;

      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          tenantId: params.tenantId,
          leaseId: params.leaseId || null,
          amount: params.amount,
          paymentMethod: params.paymentMethod,
          referenceNumber: params.referenceNumber || null,
          transactionDate: new Date(params.transactionDate),
          status: 'POSTED',
          recordedById: params.recordedById || null,
          notes: params.notes || null,
        },
      });

      // 3. Process each allocation and update invoice balances atomically
      for (const item of allocationsToProcess) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            invoiceId: item.invoiceId,
            amountAllocated: item.amountAllocated,
          },
        });

        const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: item.invoiceId } });
        const newPaid = invoice.amountPaid + item.amountAllocated;
        const newOutstanding = invoice.totalAmount - newPaid;
        const newStatus = BillingService.determineStatus(
          invoice.totalAmount,
          newPaid,
          newOutstanding,
          invoice.dueDate,
          now
        );

        await tx.invoice.update({
          where: { id: item.invoiceId },
          data: {
            amountPaid: newPaid,
            amountOutstanding: newOutstanding,
            status: newStatus,
          },
        });
      }

      // 4. Generate official digital receipt
      const receiptCount = await tx.receipt.count();
      const receiptNumber = `RCP-${now.getFullYear()}-${String(receiptCount + 1).padStart(3, '0')}`;

      const receipt = await tx.receipt.create({
        data: {
          receiptNumber,
          paymentId: payment.id,
          generatedAt: now,
          notes: `Official settlement receipt for ${tenant.companyName}.`,
        },
      });

      return {
        payment,
        receipt,
        allocationsCount: allocationsToProcess.length,
      };
    });
  }

  /**
   * Financial Reversal Workflow: Reverses allocations, restores invoice balances,
   * creates immutable reversal record, and marks payment REVERSED.
   */
  static async reversePayment(paymentId: string, params: {
    reason: string;
    authorizedById?: string;
  }) {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('A specific, documented reason is required to authorize a payment reversal.');
    }

    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          allocations: {
            include: { invoice: true },
          },
          reversal: true,
        },
      });

      if (!payment) throw new Error('Payment not found');
      if (payment.status === 'REVERSED' || payment.reversal) {
        throw new Error('This payment has already been reversed.');
      }

      // 1. Restore balances on all allocated invoices
      for (const alloc of payment.allocations) {
        const inv = alloc.invoice;
        const restoredPaid = Math.max(0, inv.amountPaid - alloc.amountAllocated);
        const restoredOutstanding = inv.totalAmount - restoredPaid;
        const newStatus = BillingService.determineStatus(
          inv.totalAmount,
          restoredPaid,
          restoredOutstanding,
          inv.dueDate,
          now
        );

        await tx.invoice.update({
          where: { id: inv.id },
          data: {
            amountPaid: restoredPaid,
            amountOutstanding: restoredOutstanding,
            status: newStatus,
          },
        });
      }

      // 2. Mark payment as REVERSED
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'REVERSED' },
      });

      // 3. Create immutable reversal record
      const revCount = await tx.paymentReversal.count();
      const reversalNumber = `REV-${now.getFullYear()}-${String(revCount + 1).padStart(3, '0')}`;

      const reversal = await tx.paymentReversal.create({
        data: {
          reversalNumber,
          paymentId: payment.id,
          reason: params.reason,
          authorizedById: params.authorizedById || null,
          reversedAt: now,
        },
      });

      return {
        payment: updatedPayment,
        reversal,
        restoredInvoicesCount: payment.allocations.length,
      };
    });
  }

  static async getReceiptByPaymentId(paymentId: string) {
    const receipt = await prisma.receipt.findUnique({
      where: { paymentId },
      include: {
        payment: {
          include: {
            tenant: true,
            recordedBy: true,
            allocations: {
              include: {
                invoice: {
                  include: {
                    lease: {
                      include: { shop: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!receipt) throw new Error(`Receipt for payment '${paymentId}' not found`);
    return receipt;
  }
}
