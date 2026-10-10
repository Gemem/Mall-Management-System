import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Mall Management System Database Seeding ---');

  // Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.maintenanceComment.deleteMany();
  await prisma.maintenanceTicket.deleteMany();
  await prisma.document.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.paymentReversal.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.leaseAmendment.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.shopOperationalLog.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.section.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.mallSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.mall.deleteMany();

  console.log('Cleared existing records.');

  // 1. Create Example Mall
  const mall = await prisma.mall.create({
    data: {
      name: 'Starlight Galleria',
      tagline: 'Premier Retail, Dining & Entertainment Destination',
      logoUrl: '/assets/mall-logo.png',
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'America/New_York',
      dateFormat: 'YYYY-MM-DD',
      email: 'operations@starlightgalleria.com',
      phone: '+1 (555) 890-4400',
      address: '8500 Grand Boulevard, Metropolis, NY 10021',
      taxId: 'US-TAX-9948271',
    },
  });

  await prisma.mallSetting.createMany({
    data: [
      { mallId: mall.id, key: 'LATE_FEE_RATE', value: '5.0', description: 'Default percent late fee on overdue invoices' },
      { mallId: mall.id, key: 'GRACE_PERIOD_DAYS', value: '5', description: 'Standard days before late fees apply' },
      { mallId: mall.id, key: 'OPERATING_HOURS_WEEKDAY', value: '10:00 - 21:00', description: 'Standard weekday mall hours' },
      { mallId: mall.id, key: 'OPERATING_HOURS_WEEKEND', value: '10:00 - 22:00', description: 'Standard weekend mall hours' },
    ],
  });

  // 2. Create Floors
  const floorG = await prisma.floor.create({
    data: {
      mallId: mall.id,
      floorNumber: 0,
      name: 'Ground Level (Grand Atrium)',
      description: 'Main entrance, anchor department stores, luxury accessories and prestige cosmetics.',
    },
  });

  const floor1 = await prisma.floor.create({
    data: {
      mallId: mall.id,
      floorNumber: 1,
      name: 'Level 1 (Fashion Promenade)',
      description: 'International fashion apparel, footwear, athleisure and boutique beauty.',
    },
  });

  const floor2 = await prisma.floor.create({
    data: {
      mallId: mall.id,
      floorNumber: 2,
      name: 'Level 2 (Tech & Lifestyle)',
      description: 'Consumer electronics, smart home gadgets, gaming arcade, and family entertainment.',
    },
  });

  const floor3 = await prisma.floor.create({
    data: {
      mallId: mall.id,
      floorNumber: 3,
      name: 'Level 3 (Sky Dining Terrace)',
      description: 'Food hall, artisan coffee bars, full-service fine dining restaurants and cinema.',
    },
  });

  // 3. Create Sections
  const secG1 = await prisma.section.create({
    data: { floorId: floorG.id, name: 'North Atrium', code: 'G-NA', description: 'Front atrium wing with high footfall' },
  });
  const secG2 = await prisma.section.create({
    data: { floorId: floorG.id, name: 'South Piazza', code: 'G-SP', description: 'Water fountain corridor' },
  });

  const sec1A = await prisma.section.create({
    data: { floorId: floor1.id, name: 'Designer Avenue', code: 'L1-DA', description: 'High-end apparel stores' },
  });
  const sec1B = await prisma.section.create({
    data: { floorId: floor1.id, name: 'Athleisure Boulevard', code: 'L1-AB', description: 'Sports and casual wear wing' },
  });

  const sec2A = await prisma.section.create({
    data: { floorId: floor2.id, name: 'Tech Arcade', code: 'L2-TA', description: 'Electronics, mobile devices & hardware' },
  });
  const sec2B = await prisma.section.create({
    data: { floorId: floor2.id, name: 'Entertainment Zone', code: 'L2-EZ', description: 'VR arena, gaming and family leisure' },
  });

  const sec3A = await prisma.section.create({
    data: { floorId: floor3.id, name: 'Gourmet Terraces', code: 'L3-GT', description: 'Upscale sit-down restaurants' },
  });
  const sec3B = await prisma.section.create({
    data: { floorId: floor3.id, name: 'Market Food Court', code: 'L3-FC', description: 'Quick-service eateries and bakeries' },
  });

  // 4. Create Tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Apex Luxury Apparel LLC',
      companyName: 'Aura Haute Couture',
      contactPerson: 'Elena Rostova',
      email: 'tenant@fashionhub.com',
      phone: '+1 (555) 301-8822',
      taxId: 'TX-8829104',
      registrationNumber: 'REG-2022-771',
      emergencyContact: 'Elena Rostova (+1 555-301-8899)',
      status: 'ACTIVE',
      notes: 'Premium tenant since 2023. Flagship boutique anchor.',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'OmniTech Retail Corp',
      companyName: 'NextGen Electronics',
      contactPerson: 'David Chen',
      email: 'dchen@omnitechcorp.com',
      phone: '+1 (555) 441-9920',
      taxId: 'TX-9912048',
      registrationNumber: 'REG-2021-443',
      emergencyContact: 'Store Manager Desk (+1 555-441-9925)',
      status: 'ACTIVE',
      notes: 'Authorized retailer for premium consumer hardware.',
    },
  });

  const tenant3 = await prisma.tenant.create({
    data: {
      name: 'Bean & Leaf Roasters Inc',
      companyName: 'Velvet Roast Cafe',
      contactPerson: 'Marcus Vance',
      email: 'marcus@velvetroast.com',
      phone: '+1 (555) 772-1100',
      taxId: 'TX-3382910',
      registrationNumber: 'REG-2023-119',
      emergencyContact: 'Marcus Vance Cell (+1 555-772-1109)',
      status: 'ACTIVE',
      notes: 'High foot-traffic gourmet coffee kiosk & seating area.',
    },
  });

  const tenant4 = await prisma.tenant.create({
    data: {
      name: 'Chronos Horology Group',
      companyName: 'Diamond & Chronos Watchmakers',
      contactPerson: 'Julian Thorne',
      email: 'jthorne@chronoswatch.com',
      phone: '+1 (555) 993-2288',
      taxId: 'TX-5544332',
      registrationNumber: 'REG-2020-008',
      emergencyContact: 'Security Desk (+1 555-993-2299)',
      status: 'ACTIVE',
      notes: 'Luxury Swiss watch jeweler with high insurance requirements.',
    },
  });

  const tenant5 = await prisma.tenant.create({
    data: {
      name: 'Zenith Culinary Holdings',
      companyName: 'Zenith Asian Fusion & Robata',
      contactPerson: 'Chef Kenji Sato',
      email: 'kenji@zenithcuisine.com',
      phone: '+1 (555) 662-7711',
      taxId: 'TX-7788991',
      registrationNumber: 'REG-2024-884',
      emergencyContact: 'General Manager (+1 555-662-7715)',
      status: 'ACTIVE',
      notes: 'Fine dining terrace establishment.',
    },
  });

  const tenant6 = await prisma.tenant.create({
    data: {
      name: 'Nordic Sneaker Lab',
      companyName: 'Sole & Stride Footwear',
      contactPerson: 'Astrid Lind',
      email: 'astrid@solestride.com',
      phone: '+1 (555) 551-3322',
      taxId: 'TX-1122334',
      registrationNumber: 'REG-2024-212',
      emergencyContact: 'Store Supervisor (+1 555-551-3328)',
      status: 'ACTIVE',
      notes: 'Athletic footwear and custom sneaker fittings.',
    },
  });

  // 5. Create Staff and Tenant User Accounts
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('MallAdmin123!', salt);
  const tenantPasswordHash = await bcrypt.hash('Tenant123!', salt);

  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@mall.com',
      name: 'Victoria Sterling',
      passwordHash: passwordHash,
      role: 'MALL_OWNER',
      phone: '+1 (555) 880-0001',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      isApproved: true,
      approvedAt: new Date(),
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@mall.com',
      name: 'Arthur Pendelton',
      passwordHash: passwordHash,
      role: 'MALL_MANAGER',
      phone: '+1 (555) 880-0002',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      isApproved: true,
      approvedAt: new Date(),
      approvedById: ownerUser.id,
    },
  });

  const accountantUser = await prisma.user.create({
    data: {
      email: 'accountant@mall.com',
      name: 'Beatrice Morales, CPA',
      passwordHash: passwordHash,
      role: 'ACCOUNTANT',
      phone: '+1 (555) 880-0003',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      isApproved: true,
      approvedAt: new Date(),
      approvedById: ownerUser.id,
    },
  });

  const maintenanceUser = await prisma.user.create({
    data: {
      email: 'maintenance@mall.com',
      name: 'Carlos Mendez',
      passwordHash: passwordHash,
      role: 'MAINTENANCE',
      phone: '+1 (555) 880-0004',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isApproved: true,
      approvedAt: new Date(),
      approvedById: ownerUser.id,
    },
  });

  const tenantUser = await prisma.user.create({
    data: {
      email: 'tenant@fashionhub.com',
      name: 'Elena Rostova',
      passwordHash: tenantPasswordHash,
      role: 'TENANT',
      tenantId: tenant1.id,
      phone: '+1 (555) 301-8822',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      isApproved: true,
      approvedAt: new Date(),
      approvedById: ownerUser.id,
    },
  });

  // Sample Pending Approval Users (to demonstrate Owner approval workflow)
  await prisma.user.create({
    data: {
      email: 'lucas.vance@techhorizon.com',
      name: 'Lucas Vance',
      passwordHash: tenantPasswordHash,
      role: 'TENANT',
      tenantId: tenant2.id,
      phone: '+1 (555) 412-9901',
      isApproved: false, // Pending Owner Approval
    },
  });

  await prisma.user.create({
    data: {
      email: 'samuel.chen@facilitytech.com',
      name: 'Samuel Chen (HVAC Tech)',
      passwordHash: passwordHash,
      role: 'MAINTENANCE',
      phone: '+1 (555) 902-3344',
      isApproved: false, // Pending Owner Approval
    },
  });

  // 6. Create Shops
  // Ground Floor Shops
  const shopG101 = await prisma.shop.create({
    data: {
      floorId: floorG.id,
      sectionId: secG1.id,
      shopNumber: 'G-101',
      name: 'Diamond & Chronos Watchmakers',
      areaSqFt: 1850.0,
      businessCategory: 'Jewelry & Watches',
      description: 'Corner luxury jewelry boutique with reinforced bulletproof display cases.',
      baseRent: 850000, // $8,500.00
      recurringCharges: 75000, // $750.00
      occupancyStatus: 'OCCUPIED',
      operationalStatus: 'OPEN',
    },
  });

  const shopG102 = await prisma.shop.create({
    data: {
      floorId: floorG.id,
      sectionId: secG1.id,
      shopNumber: 'G-102',
      name: 'Velvet Roast Cafe (Atrium Kiosk)',
      areaSqFt: 620.0,
      businessCategory: 'Cafe & Beverage',
      description: 'Open circular kiosk island with dedicated barista counters and bistro seating.',
      baseRent: 380000, // $3,800.00
      recurringCharges: 40000, // $400.00
      occupancyStatus: 'OCCUPIED',
      operationalStatus: 'OPEN',
    },
  });

  const shopG103 = await prisma.shop.create({
    data: {
      floorId: floorG.id,
      sectionId: secG2.id,
      shopNumber: 'G-103',
      name: 'Prime Retail Unit G-103',
      areaSqFt: 2400.0,
      businessCategory: 'Luxury Fashion',
      description: 'Double-height ceiling showroom space near south fountain entrance.',
      baseRent: 1100000, // $11,000.00
      recurringCharges: 95000, // $950.00
      occupancyStatus: 'VACANT',
      operationalStatus: 'NOT_APPLICABLE',
    },
  });

  const shopG104 = await prisma.shop.create({
    data: {
      floorId: floorG.id,
      sectionId: secG2.id,
      shopNumber: 'G-104',
      name: 'Reserved Unit G-104',
      areaSqFt: 1450.0,
      businessCategory: 'Beauty & Cosmetics',
      description: 'Reserved for upcoming luxury parfumier.',
      baseRent: 650000, // $6,500.00
      recurringCharges: 50000, // $500.00
      occupancyStatus: 'RESERVED',
      operationalStatus: 'NOT_YET_OPENED',
    },
  });

  // Level 1 Shops
  const shopL1201 = await prisma.shop.create({
    data: {
      floorId: floor1.id,
      sectionId: sec1A.id,
      shopNumber: 'L1-201',
      name: 'Aura Haute Couture (Flagship)',
      areaSqFt: 3200.0,
      businessCategory: 'Fashion & Apparel',
      description: 'Two-story interior facade, VIP fitting lounges, premium LED window lighting.',
      baseRent: 1250000, // $12,500.00
      recurringCharges: 110000, // $1,100.00
      occupancyStatus: 'OCCUPIED',
      operationalStatus: 'OPEN',
    },
  });

  const shopL1202 = await prisma.shop.create({
    data: {
      floorId: floor1.id,
      sectionId: sec1A.id,
      shopNumber: 'L1-202',
      name: 'Boutique Apparel Unit L1-202',
      areaSqFt: 1600.0,
      businessCategory: 'Fashion & Apparel',
      description: 'Mid-sized fashion showroom with pre-installed slatwall displays.',
      baseRent: 580000, // $5,800.00
      recurringCharges: 45000, // $450.00
      occupancyStatus: 'VACANT',
      operationalStatus: 'NOT_APPLICABLE',
    },
  });

  const shopL1203 = await prisma.shop.create({
    data: {
      floorId: floor1.id,
      sectionId: sec1B.id,
      shopNumber: 'L1-203',
      name: 'Sole & Stride Footwear',
      areaSqFt: 1950.0,
      businessCategory: 'Footwear & Athletic',
      description: 'Modern shoe gallery with digital display pedestals and stockroom.',
      baseRent: 690000, // $6,900.00
      recurringCharges: 60000, // $600.00
      occupancyStatus: 'OCCUPIED',
      operationalStatus: 'TEMPORARILY_CLOSED',
    },
  });

  const shopL1204 = await prisma.shop.create({
    data: {
      floorId: floor1.id,
      sectionId: sec1B.id,
      shopNumber: 'L1-204',
      name: 'Activewear Studio L1-204',
      areaSqFt: 1300.0,
      businessCategory: 'Sportswear',
      description: 'Turnkey retail space formerly occupied by yoga apparel brand.',
      baseRent: 490000, // $4,900.00
      recurringCharges: 35000, // $350.00
      occupancyStatus: 'VACANT',
      operationalStatus: 'NOT_APPLICABLE',
    },
  });

  // Level 2 Shops
  const shopL2301 = await prisma.shop.create({
    data: {
      floorId: floor2.id,
      sectionId: sec2A.id,
      shopNumber: 'L2-301',
      name: 'NextGen Electronics & Smart Home',
      areaSqFt: 4500.0,
      businessCategory: 'Consumer Electronics',
      description: 'High-power electrical drops, dedicated fiber-optic internet connection.',
      baseRent: 1400000, // $14,000.00
      recurringCharges: 150000, // $1,500.00
      occupancyStatus: 'OCCUPIED',
      operationalStatus: 'OPEN',
    },
  });

  const shopL2302 = await prisma.shop.create({
    data: {
      floorId: floor2.id,
      sectionId: sec2A.id,
      shopNumber: 'L2-302',
      name: 'Gadget Bay Unit L2-302',
      areaSqFt: 980.0,
      businessCategory: 'Mobile Accessories',
      description: 'Compact kiosk-storefront ideal for smartphone repair and accessories.',
      baseRent: 320000, // $3,200.00
      recurringCharges: 25000, // $250.00
      occupancyStatus: 'VACANT',
      operationalStatus: 'NOT_APPLICABLE',
    },
  });

  const shopL2303 = await prisma.shop.create({
    data: {
      floorId: floor2.id,
      sectionId: sec2B.id,
      shopNumber: 'L2-303',
      name: 'VR Vortex Arena (Maintenance)',
      areaSqFt: 3800.0,
      businessCategory: 'Entertainment & Gaming',
      description: 'Interactive gaming center undergoing floor sensory recalibration.',
      baseRent: 950000, // $9,500.00
      recurringCharges: 80000, // $800.00
      occupancyStatus: 'OCCUPIED',
      operationalStatus: 'UNDER_MAINTENANCE',
    },
  });

  // Level 3 Shops
  const shopL3401 = await prisma.shop.create({
    data: {
      floorId: floor3.id,
      sectionId: sec3A.id,
      shopNumber: 'L3-401',
      name: 'Zenith Asian Fusion & Robata Bar',
      areaSqFt: 3600.0,
      businessCategory: 'Fine Dining Restaurant',
      description: 'Commercial grease trap installed, outdoor balcony terrace seating, walk-in cold rooms.',
      baseRent: 1350000, // $13,500.00
      recurringCharges: 180000, // $1,800.00
      occupancyStatus: 'OCCUPIED',
      operationalStatus: 'OPEN',
    },
  });

  const shopL3402 = await prisma.shop.create({
    data: {
      floorId: floor3.id,
      sectionId: sec3A.id,
      shopNumber: 'L3-402',
      name: 'Artisan Trattoria Space L3-402',
      areaSqFt: 2900.0,
      businessCategory: 'Restaurant',
      description: 'Fully plumbed restaurant unit with exhaust hood shafts and gas connections.',
      baseRent: 1050000, // $10,500.00
      recurringCharges: 140000, // $1,400.00
      occupancyStatus: 'VACANT',
      operationalStatus: 'NOT_APPLICABLE',
    },
  });

  const shopL3403 = await prisma.shop.create({
    data: {
      floorId: floor3.id,
      sectionId: sec3B.id,
      shopNumber: 'L3-403',
      name: 'Food Court Stall L3-403 (Suspended)',
      areaSqFt: 550.0,
      businessCategory: 'Fast Casual',
      description: 'Front-counter stall temporarily suspended pending health inspection renewal.',
      baseRent: 280000, // $2,800.00
      recurringCharges: 30000, // $300.00
      occupancyStatus: 'OCCUPIED',
      operationalStatus: 'SUSPENDED',
    },
  });

  // Record operational logs
  await prisma.shopOperationalLog.createMany({
    data: [
      {
        shopId: shopL1203.id,
        previousStatus: 'OPEN',
        newStatus: 'TEMPORARILY_CLOSED',
        reason: 'Interior lighting refurbishment and seasonal merchandise turnover.',
        notes: 'Expected reopen on Monday.',
        changedById: managerUser.id,
      },
      {
        shopId: shopL2303.id,
        previousStatus: 'OPEN',
        newStatus: 'UNDER_MAINTENANCE',
        reason: 'HVAC duct inspection and flooring tile replacement in VR zone.',
        notes: 'Contractor on-site.',
        changedById: managerUser.id,
      },
      {
        shopId: shopL3403.id,
        previousStatus: 'OPEN',
        newStatus: 'SUSPENDED',
        reason: 'Mandatory fire-suppression nozzle re-certification overdue.',
        notes: 'Compliance notice issued.',
        changedById: ownerUser.id,
      },
    ],
  });

  // 7. Create Leases
  // Lease 1: Aura Haute Couture (Shop L1-201) - Active, healthy
  const lease1 = await prisma.lease.create({
    data: {
      leaseNumber: 'LSE-2024-001',
      tenantId: tenant1.id,
      shopId: shopL1201.id,
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2027-12-31T23:59:59Z'),
      rentAmount: 1250000,
      recurringCharges: 110000,
      depositAmount: 3750000,
      depositPaid: true,
      billingFrequency: 'MONTHLY',
      dueDay: 1,
      gracePeriodDays: 5,
      lateFeePercentage: 5.0,
      status: 'ACTIVE',
      terms: 'Standard 3-year commercial retail lease with 5% annual escalation review.',
    },
  });
  await prisma.shop.update({ where: { id: shopL1201.id }, data: { currentLeaseId: lease1.id } });

  // Lease 2: NextGen Electronics (Shop L2-301) - Active
  const lease2 = await prisma.lease.create({
    data: {
      leaseNumber: 'LSE-2024-002',
      tenantId: tenant2.id,
      shopId: shopL2301.id,
      startDate: new Date('2024-03-01T00:00:00Z'),
      endDate: new Date('2027-02-28T23:59:59Z'),
      rentAmount: 1400000,
      recurringCharges: 150000,
      depositAmount: 4200000,
      depositPaid: true,
      billingFrequency: 'MONTHLY',
      dueDay: 1,
      gracePeriodDays: 5,
      lateFeePercentage: 5.0,
      status: 'ACTIVE',
      terms: 'Technology retail lease with anchor promotion allowance.',
    },
  });
  await prisma.shop.update({ where: { id: shopL2301.id }, data: { currentLeaseId: lease2.id } });

  // Lease 3: Velvet Roast Cafe (Shop G-102) - Active
  const lease3 = await prisma.lease.create({
    data: {
      leaseNumber: 'LSE-2025-003',
      tenantId: tenant3.id,
      shopId: shopG102.id,
      startDate: new Date('2025-06-01T00:00:00Z'),
      endDate: new Date('2028-05-31T23:59:59Z'),
      rentAmount: 380000,
      recurringCharges: 40000,
      depositAmount: 1140000,
      depositPaid: true,
      billingFrequency: 'MONTHLY',
      dueDay: 1,
      gracePeriodDays: 5,
      lateFeePercentage: 5.0,
      status: 'ACTIVE',
      terms: 'Kiosk lease with exclusive atrium coffee beverage clause.',
    },
  });
  await prisma.shop.update({ where: { id: shopG102.id }, data: { currentLeaseId: lease3.id } });

  // Lease 4: Chronos & Diamond (Shop G-101) - Expiring Soon (30 days from now)
  const expiringDate = new Date();
  expiringDate.setDate(expiringDate.getDate() + 25);
  const lease4 = await prisma.lease.create({
    data: {
      leaseNumber: 'LSE-2023-004',
      tenantId: tenant4.id,
      shopId: shopG101.id,
      startDate: new Date('2023-11-01T00:00:00Z'),
      endDate: expiringDate,
      rentAmount: 850000,
      recurringCharges: 75000,
      depositAmount: 2550000,
      depositPaid: true,
      billingFrequency: 'MONTHLY',
      dueDay: 1,
      gracePeriodDays: 5,
      lateFeePercentage: 5.0,
      status: 'EXPIRING',
      terms: 'Boutique lease under renewal negotiation for 2 additional years.',
    },
  });
  await prisma.shop.update({ where: { id: shopG101.id }, data: { currentLeaseId: lease4.id } });

  // Lease 5: Zenith Asian Fusion (Shop L3-401) - Active
  const lease5 = await prisma.lease.create({
    data: {
      leaseNumber: 'LSE-2024-005',
      tenantId: tenant5.id,
      shopId: shopL3401.id,
      startDate: new Date('2024-07-01T00:00:00Z'),
      endDate: new Date('2029-06-30T23:59:59Z'),
      rentAmount: 1350000,
      recurringCharges: 180000,
      depositAmount: 4050000,
      depositPaid: true,
      billingFrequency: 'MONTHLY',
      dueDay: 1,
      gracePeriodDays: 5,
      lateFeePercentage: 5.0,
      status: 'ACTIVE',
      terms: '5-year restaurant tenure with commercial extraction venting rights.',
    },
  });
  await prisma.shop.update({ where: { id: shopL3401.id }, data: { currentLeaseId: lease5.id } });

  // Lease 6: Sole & Stride (Shop L1-203) - Active
  const lease6 = await prisma.lease.create({
    data: {
      leaseNumber: 'LSE-2025-006',
      tenantId: tenant6.id,
      shopId: shopL1203.id,
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2027-12-31T23:59:59Z'),
      rentAmount: 690000,
      recurringCharges: 60000,
      depositAmount: 2070000,
      depositPaid: true,
      billingFrequency: 'MONTHLY',
      dueDay: 1,
      gracePeriodDays: 5,
      lateFeePercentage: 5.0,
      status: 'ACTIVE',
      terms: 'Specialty footwear lease.',
    },
  });
  await prisma.shop.update({ where: { id: shopL1203.id }, data: { currentLeaseId: lease6.id } });

  // 8. Create Invoices (Billing Obligations)
  // Current month reference
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const currentDueDate = new Date(now.getFullYear(), now.getMonth(), 5);

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const prevDueDate = new Date(now.getFullYear(), now.getMonth() - 1, 5);

  // Invoice 1: Aura Haute Couture - Fully Paid
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-101',
      leaseId: lease1.id,
      tenantId: tenant1.id,
      periodStart: currentMonthStart,
      periodEnd: currentMonthEnd,
      dueDate: currentDueDate,
      baseRent: 1250000,
      recurringCharges: 110000,
      lateFee: 0,
      totalAmount: 1360000, // $13,600.00
      amountPaid: 1360000,
      amountOutstanding: 0,
      status: 'PAID',
      notes: 'October 2026 rent and monthly maintenance levy.',
    },
  });

  // Invoice 2: NextGen Electronics - Partially Paid
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-102',
      leaseId: lease2.id,
      tenantId: tenant2.id,
      periodStart: currentMonthStart,
      periodEnd: currentMonthEnd,
      dueDate: currentDueDate,
      baseRent: 1400000,
      recurringCharges: 150000,
      lateFee: 0,
      totalAmount: 1550000, // $15,500.00
      amountPaid: 800000, // $8,000.00
      amountOutstanding: 750000, // $7,500.00
      status: 'PARTIALLY_PAID',
      notes: 'October 2026 rent. Partial payment received via wire transfer.',
    },
  });

  // Invoice 3: Velvet Roast Cafe - Overdue (From previous month)
  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-093',
      leaseId: lease3.id,
      tenantId: tenant3.id,
      periodStart: prevMonthStart,
      periodEnd: prevMonthEnd,
      dueDate: prevDueDate,
      baseRent: 380000,
      recurringCharges: 40000,
      lateFee: 21000, // 5% late fee = $210.00
      totalAmount: 441000, // $4,410.00
      amountPaid: 0,
      amountOutstanding: 441000,
      status: 'OVERDUE',
      notes: 'Previous month rent past due. Second reminder notice dispatched.',
    },
  });

  // Invoice 4: Chronos Watchmakers - Fully Paid
  const inv4 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-104',
      leaseId: lease4.id,
      tenantId: tenant4.id,
      periodStart: currentMonthStart,
      periodEnd: currentMonthEnd,
      dueDate: currentDueDate,
      baseRent: 850000,
      recurringCharges: 75000,
      lateFee: 0,
      totalAmount: 925000, // $9,250.00
      amountPaid: 925000,
      amountOutstanding: 0,
      status: 'PAID',
      notes: 'October 2026 rent settled promptly.',
    },
  });

  // Invoice 5: Zenith Asian Fusion - Upcoming
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 5);

  const inv5 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-105',
      leaseId: lease5.id,
      tenantId: tenant5.id,
      periodStart: nextMonthStart,
      periodEnd: nextMonthEnd,
      dueDate: nextDueDate,
      baseRent: 1350000,
      recurringCharges: 180000,
      lateFee: 0,
      totalAmount: 1530000, // $15,300.00
      amountPaid: 0,
      amountOutstanding: 1530000,
      status: 'UPCOMING',
      notes: 'Advance invoice generated for upcoming period.',
    },
  });

  // 9. Payments, Allocations & Receipts
  // Payment 1 for Invoice 1 (Aura Haute Couture)
  const pay1 = await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-001',
      tenantId: tenant1.id,
      leaseId: lease1.id,
      amount: 1360000,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'WIRE-US-99382104',
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 2),
      status: 'POSTED',
      recordedById: accountantUser.id,
      notes: 'Payment received via JPMorgan Chase ACH transfer.',
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      paymentId: pay1.id,
      invoiceId: inv1.id,
      amountAllocated: 1360000,
    },
  });

  await prisma.receipt.create({
    data: {
      receiptNumber: 'RCP-2026-001',
      paymentId: pay1.id,
      generatedAt: new Date(now.getFullYear(), now.getMonth(), 2),
      notes: 'Official digital receipt for Aura Haute Couture.',
    },
  });

  // Payment 2 for Invoice 2 (Partial payment for NextGen Electronics)
  const pay2 = await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-002',
      tenantId: tenant2.id,
      leaseId: lease2.id,
      amount: 800000,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'WIRE-US-44820199',
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 4),
      status: 'POSTED',
      recordedById: accountantUser.id,
      notes: 'First installment of monthly rent.',
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      paymentId: pay2.id,
      invoiceId: inv2.id,
      amountAllocated: 800000,
    },
  });

  await prisma.receipt.create({
    data: {
      receiptNumber: 'RCP-2026-002',
      paymentId: pay2.id,
      generatedAt: new Date(now.getFullYear(), now.getMonth(), 4),
      notes: 'Partial payment receipt for NextGen Electronics.',
    },
  });

  // Payment 3 for Invoice 4 (Chronos Watchmakers)
  const pay3 = await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-003',
      tenantId: tenant4.id,
      leaseId: lease4.id,
      amount: 925000,
      paymentMethod: 'CREDIT_CARD',
      referenceNumber: 'AUTH-CC-881920',
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 3),
      status: 'POSTED',
      recordedById: accountantUser.id,
      notes: 'Corporate Amex payment processed successfully.',
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      paymentId: pay3.id,
      invoiceId: inv4.id,
      amountAllocated: 925000,
    },
  });

  await prisma.receipt.create({
    data: {
      receiptNumber: 'RCP-2026-003',
      paymentId: pay3.id,
      generatedAt: new Date(now.getFullYear(), now.getMonth(), 3),
      notes: 'Official payment receipt for Chronos Watchmakers.',
    },
  });

  // 10. Maintenance Tickets & Comments
  const ticket1 = await prisma.maintenanceTicket.create({
    data: {
      ticketNumber: 'MNT-2026-001',
      shopId: shopL1201.id,
      tenantId: tenant1.id,
      title: 'HVAC Airflow Balancing in VIP Fitting Suite',
      description: 'The VIP fitting lounge temperature is fluctuating above 76°F during peak afternoon foot traffic.',
      category: 'HVAC',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedToId: maintenanceUser.id,
      estimatedCost: 35000, // $350.00
    },
  });

  await prisma.maintenanceComment.createMany({
    data: [
      {
        ticketId: ticket1.id,
        userId: tenantUser.id,
        message: 'Customers have complained during fitting sessions. Requesting prompt inspection.',
        isInternal: false,
      },
      {
        ticketId: ticket1.id,
        userId: maintenanceUser.id,
        message: 'VAV box damper inspected on rooftop duct branch 1B. Replacing actuator valve today.',
        isInternal: false,
      },
      {
        ticketId: ticket1.id,
        userId: maintenanceUser.id,
        message: 'Internal Note: Part picked up from Central Maintenance storage shelf 4.',
        isInternal: true,
      },
    ],
  });

  const ticket2 = await prisma.maintenanceTicket.create({
    data: {
      ticketNumber: 'MNT-2026-002',
      shopId: shopG102.id,
      tenantId: tenant3.id,
      title: 'Espresso Bar Under-Counter Water Pressure Drop',
      description: 'Primary filtration intake line shows 20 PSI drop during dual-group operation.',
      category: 'PLUMBING',
      priority: 'URGENT',
      status: 'RESOLVED',
      assignedToId: maintenanceUser.id,
      resolutionNotes: 'Replaced sediment cartridge filter on inline booster pump. Pressure stabilized at 60 PSI.',
      estimatedCost: 18000,
      completedAt: new Date(),
    },
  });

  const ticket3 = await prisma.maintenanceTicket.create({
    data: {
      ticketNumber: 'MNT-2026-003',
      shopId: shopL2303.id,
      tenantId: null,
      title: 'Emergency Lighting Battery Backup Circuit Fault',
      description: 'Central safety sensor indicates auxiliary emergency power pack 3 needs battery cell replacement.',
      category: 'ELECTRICAL',
      priority: 'MEDIUM',
      status: 'OPEN',
      assignedToId: null,
      estimatedCost: 22000,
    },
  });

  // 11. Announcements & In-App Notifications
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Annual Mall Fire Drill & Evacuation Protocol Exercise',
        content: 'Please be advised that our annual coordinated life-safety exercise will take place on Tuesday at 08:30 AM before regular opening hours. All store keyholders are requested to confirm on-duty personnel.',
        targetScope: 'ALL',
        priority: 'IMPORTANT',
        authorId: managerUser.id,
      },
      {
        title: 'Holiday Extended Loading Dock Access Protocols',
        content: 'Commencing next week, the South Freight Loading Bays 1-4 will operate extended receiving hours from 06:00 to 23:00 to facilitate holiday inventory staging.',
        targetScope: 'ALL',
        priority: 'NORMAL',
        authorId: managerUser.id,
      },
      {
        title: 'Atrium Glass Dome Polishing & Scheduled Cherry-Picker Operations',
        content: 'Overnight maintenance will be cleaning the central skylight from 23:30 to 05:00. No obstruction to store entrances during trade hours.',
        targetScope: 'FLOOR',
        targetFloorId: floorG.id,
        priority: 'NORMAL',
        authorId: ownerUser.id,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: tenantUser.id,
        title: 'Payment Confirmation: $13,600.00',
        message: 'Your payment for Invoice INV-2026-101 has been posted and receipt RCP-2026-001 is now available.',
        type: 'PAYMENT_RECEIVED',
        isRead: true,
      },
      {
        userId: tenantUser.id,
        title: 'Maintenance Ticket Update',
        message: 'Carlos Mendez assigned to your ticket MNT-2026-001 (HVAC Airflow Balancing).',
        type: 'MAINTENANCE_UPDATE',
        isRead: false,
      },
      {
        userId: ownerUser.id,
        title: 'Overdue Rent Alert: Velvet Roast Cafe',
        message: 'Invoice INV-2026-093 ($4,410.00) is past due date by 30 days.',
        type: 'PAYMENT_DUE',
        isRead: false,
      },
      {
        userId: managerUser.id,
        title: 'Expiring Lease Alert',
        message: 'Lease LSE-2023-004 for Diamond & Chronos Watchmakers expires in 25 days.',
        type: 'LEASE_EXPIRING',
        isRead: false,
      },
    ],
  });

  // 12. Documents
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  const expiringDocDate = new Date();
  expiringDocDate.setDate(expiringDocDate.getDate() + 18); // Approaching expiration in 18 days!

  await prisma.document.createMany({
    data: [
      {
        title: 'Master Lease Agreement - Aura Haute Couture',
        documentType: 'LEASE_AGREEMENT',
        filePath: '/storage/leases/LSE-2024-001-Signed.pdf',
        fileUrl: '/storage/leases/LSE-2024-001-Signed.pdf',
        fileSize: 2450000,
        mimeType: 'application/pdf',
        expiryDate: new Date('2027-12-31T23:59:59Z'),
        tenantId: tenant1.id,
        leaseId: lease1.id,
        shopId: shopL1201.id,
        uploadedById: managerUser.id,
      },
      {
        title: 'Commercial General Liability Policy Certificate',
        documentType: 'INSURANCE',
        filePath: '/storage/insurance/Aura-Insurance-2026.pdf',
        fileUrl: '/storage/insurance/Aura-Insurance-2026.pdf',
        fileSize: 1120000,
        mimeType: 'application/pdf',
        expiryDate: expiringDocDate, // Alert trigger!
        tenantId: tenant1.id,
        leaseId: lease1.id,
        shopId: shopL1201.id,
        uploadedById: tenantUser.id,
      },
      {
        title: 'Municipal Retail Health & Safety Operating Permit',
        documentType: 'BUSINESS_PERMIT',
        filePath: '/storage/permits/NextGen-Permit-2026.pdf',
        fileUrl: '/storage/permits/NextGen-Permit-2026.pdf',
        fileSize: 850000,
        mimeType: 'application/pdf',
        expiryDate: futureDate,
        tenantId: tenant2.id,
        leaseId: lease2.id,
        shopId: shopL2301.id,
        uploadedById: managerUser.id,
      },
    ],
  });

  // 13. Audit Log Entries
  await prisma.auditLog.createMany({
    data: [
      {
        userId: ownerUser.id,
        action: 'UPDATE',
        entity: 'MallSetting',
        entityId: mall.id,
        details: JSON.stringify({ updated: 'Operating hours policy confirmed' }),
        ipAddress: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        userId: accountantUser.id,
        action: 'PAYMENT_RECORDED',
        entity: 'Payment',
        entityId: pay1.id,
        details: JSON.stringify({ amount: 1360000, method: 'BANK_TRANSFER', invoice: 'INV-2026-101' }),
        ipAddress: '192.168.1.25',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        userId: managerUser.id,
        action: 'STATUS_CHANGE',
        entity: 'Shop',
        entityId: shopL1203.id,
        details: JSON.stringify({ from: 'OPEN', to: 'TEMPORARILY_CLOSED', reason: 'Refurbishment' }),
        ipAddress: '192.168.1.15',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    ],
  });

  console.log('--- Database Seeding Completed Successfully! ---');
  console.log('Demo Accounts:');
  console.log('  Owner:       owner@mall.com        / MallAdmin123!');
  console.log('  Manager:     manager@mall.com      / MallAdmin123!');
  console.log('  Accountant:  accountant@mall.com   / MallAdmin123!');
  console.log('  Maintenance: maintenance@mall.com  / MallAdmin123!');
  console.log('  Tenant:      tenant@fashionhub.com / Tenant123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
