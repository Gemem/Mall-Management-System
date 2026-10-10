import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BillingService } from '../src/services/billingService.js';
import { PaymentService } from '../src/services/paymentService.js';
import { LeaseService } from '../src/services/leaseService.js';
import { prisma } from '../src/db.js';

describe('Financial Rules and Billing Calculations', () => {
  it('determines status correctly: fully paid has precedence', () => {
    const status = BillingService.determineStatus(
      100000, // $1,000.00
      100000,
      0,
      new Date('2026-01-01') // in past
    );
    expect(status).toBe('PAID');
  });

  it('determines status correctly: overdue precedence even if partially paid', () => {
    const pastDueDate = new Date('2026-01-01');
    const status = BillingService.determineStatus(
      100000,
      50000, // partially paid $500
      50000, // $500 still outstanding
      pastDueDate,
      new Date('2026-02-01')
    );
    // Precedence rule: past due date with remaining balance MUST be OVERDUE
    expect(status).toBe('OVERDUE');
  });

  it('determines status correctly: partially paid when not yet overdue', () => {
    const futureDueDate = new Date('2026-12-31');
    const status = BillingService.determineStatus(
      100000,
      40000,
      60000,
      futureDueDate,
      new Date('2026-10-01')
    );
    expect(status).toBe('PARTIALLY_PAID');
  });

  it('determines status correctly: upcoming when zero paid and before due date', () => {
    const futureDueDate = new Date('2026-12-31');
    const status = BillingService.determineStatus(
      100000,
      0,
      100000,
      futureDueDate,
      new Date('2026-10-01')
    );
    expect(status).toBe('UPCOMING');
  });
});

describe('Lease Conflict Detection & Overlap Prevention', () => {
  it('rejects lease where end date is before or equal to start date', async () => {
    const tenant = await prisma.tenant.findFirstOrThrow();
    const shop = await prisma.shop.findFirstOrThrow();

    await expect(
      LeaseService.createLease({
        tenantId: tenant.id,
        shopId: shop.id,
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-04-01'),
        rentAmount: 500000,
      })
    ).rejects.toThrow('Lease end date must be strictly after the start date.');
  });

  it('prohibits overlapping active leases for the same shop', async () => {
    const activeLease = await prisma.lease.findFirstOrThrow({
      where: { status: 'ACTIVE' },
    });
    const anotherTenant = await prisma.tenant.findFirstOrThrow({
      where: { id: { not: activeLease.tenantId } },
    });

    // Try to create lease overlapping activeLease dates on same shop
    await expect(
      LeaseService.createLease({
        tenantId: anotherTenant.id,
        shopId: activeLease.shopId,
        startDate: new Date(activeLease.startDate),
        endDate: new Date(activeLease.endDate),
        rentAmount: 800000,
      })
    ).rejects.toThrow('Overlapping active leases are prohibited.');
  });
});

describe('Payment Processing, Multi-Invoice Allocation and Reversal', () => {
  let testTenantId: string;
  let testLeaseId: string;
  let testInvoice1Id: string;
  let testInvoice2Id: string;

  beforeAll(async () => {
    // Setup test tenant, vacant shop, lease, and 2 invoices
    const floor = await prisma.floor.findFirstOrThrow();
    const shop = await prisma.shop.create({
      data: {
        floorId: floor.id,
        shopNumber: 'TEST-UNIT-999',
        name: 'Test Experimental Shop',
        areaSqFt: 500,
        businessCategory: 'Testing',
        baseRent: 200000,
        occupancyStatus: 'VACANT',
        operationalStatus: 'NOT_APPLICABLE',
      },
    });

    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant Ltd',
        companyName: 'Test Enterprises',
        contactPerson: 'Tester John',
        email: `test-${Date.now()}@test.com`,
        phone: '+1 555-000-1111',
      },
    });

    testTenantId = tenant.id;

    const lease = await prisma.lease.create({
      data: {
        leaseNumber: `TEST-LSE-${Date.now()}`,
        tenantId: tenant.id,
        shopId: shop.id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        rentAmount: 200000,
        status: 'ACTIVE',
      },
    });

    testLeaseId = lease.id;

    const inv1 = await prisma.invoice.create({
      data: {
        invoiceNumber: `TEST-INV-1-${Date.now()}`,
        leaseId: lease.id,
        tenantId: tenant.id,
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
        dueDate: new Date('2026-01-05'),
        baseRent: 150000, // $1,500.00
        totalAmount: 150000,
        amountPaid: 0,
        amountOutstanding: 150000,
        status: 'OVERDUE',
      },
    });
    testInvoice1Id = inv1.id;

    const inv2 = await prisma.invoice.create({
      data: {
        invoiceNumber: `TEST-INV-2-${Date.now()}`,
        leaseId: lease.id,
        tenantId: tenant.id,
        periodStart: new Date('2026-02-01'),
        periodEnd: new Date('2026-02-28'),
        dueDate: new Date('2026-02-05'),
        baseRent: 150000, // $1,500.00
        totalAmount: 150000,
        amountPaid: 0,
        amountOutstanding: 150000,
        status: 'OVERDUE',
      },
    });
    testInvoice2Id = inv2.id;
  });

  afterAll(async () => {
    // Cleanup test records
    await prisma.paymentAllocation.deleteMany({ where: { invoice: { tenantId: testTenantId } } });
    await prisma.receipt.deleteMany({ where: { payment: { tenantId: testTenantId } } });
    await prisma.paymentReversal.deleteMany({ where: { payment: { tenantId: testTenantId } } });
    await prisma.payment.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.invoice.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.lease.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.shop.deleteMany({ where: { shopNumber: 'TEST-UNIT-999' } });
    await prisma.tenant.deleteMany({ where: { id: testTenantId } });
  });

  it('rejects non-positive payment amounts', async () => {
    await expect(
      PaymentService.recordPayment({
        tenantId: testTenantId,
        amount: 0,
        paymentMethod: 'CASH',
        transactionDate: new Date(),
      })
    ).rejects.toThrow('Payment amount must be greater than zero.');
  });

  it('allocates payment across multiple invoices greedily by oldest due date', async () => {
    // Pay $2,000.00 (200000 cents):
    // Should fully pay inv1 ($1,500.00) and partially pay inv2 ($500.00), leaving inv2 outstanding balance = $1,000.00
    const result = await PaymentService.recordPayment({
      tenantId: testTenantId,
      amount: 200000,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'TEST-WIRE-888',
      transactionDate: new Date(),
      autoAllocate: true,
    });

    expect(result.payment.status).toBe('POSTED');
    expect(result.receipt.receiptNumber).toMatch(/^RCP-/);
    expect(result.allocationsCount).toBe(2);

    // Verify invoice 1 is PAID
    const updatedInv1 = await prisma.invoice.findUniqueOrThrow({ where: { id: testInvoice1Id } });
    expect(updatedInv1.amountPaid).toBe(150000);
    expect(updatedInv1.amountOutstanding).toBe(0);
    expect(updatedInv1.status).toBe('PAID');

    // Verify invoice 2 is PARTIALLY PAID or OVERDUE (since due date was in past)
    const updatedInv2 = await prisma.invoice.findUniqueOrThrow({ where: { id: testInvoice2Id } });
    expect(updatedInv2.amountPaid).toBe(50000);
    expect(updatedInv2.amountOutstanding).toBe(100000);
    expect(updatedInv2.status).toBe('OVERDUE'); // Past due date with remaining balance
  });

  it('atomically reverses payment, restores invoice balances and records immutable reversal audit', async () => {
    // Find the payment made above
    const payment = await prisma.payment.findFirstOrThrow({
      where: { tenantId: testTenantId, referenceNumber: 'TEST-WIRE-888' },
    });

    const reversalResult = await PaymentService.reversePayment(payment.id, {
      reason: 'Bounced ACH check / transaction contested by payer bank.',
    });

    expect(reversalResult.payment.status).toBe('REVERSED');
    expect(reversalResult.reversal.reversalNumber).toMatch(/^REV-/);
    expect(reversalResult.reversal.reason).toContain('Bounced ACH check');

    // Verify invoice 1 is restored back to original balance
    const restoredInv1 = await prisma.invoice.findUniqueOrThrow({ where: { id: testInvoice1Id } });
    expect(restoredInv1.amountPaid).toBe(0);
    expect(restoredInv1.amountOutstanding).toBe(150000);
    expect(restoredInv1.status).toBe('OVERDUE');

    // Verify invoice 2 is restored back to original balance
    const restoredInv2 = await prisma.invoice.findUniqueOrThrow({ where: { id: testInvoice2Id } });
    expect(restoredInv2.amountPaid).toBe(0);
    expect(restoredInv2.amountOutstanding).toBe(150000);
    expect(restoredInv2.status).toBe('OVERDUE');
  });
});
