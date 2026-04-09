import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database…')

  // ─── Create admin user ─────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pjlaccounts.co.uk' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@pjlaccounts.co.uk',
      password: adminPw,
      role: 'ADMIN',
    },
  })

  const staffPw = await bcrypt.hash('staff123', 12)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@pjlaccounts.co.uk' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'staff@pjlaccounts.co.uk',
      password: staffPw,
      role: 'STAFF',
    },
  })

  console.log('✓ Users created')

  // ─── Sample clients ────────────────────────────────────────────────────────
  const c1 = await prisma.client.upsert({
    where: { ref: 'PJL0001' },
    update: {},
    create: {
      ref: 'PJL0001',
      name: 'John Smith',
      clientType: 'INDIVIDUAL',
      email: 'john.smith@example.co.uk',
      phone: '07700 900001',
      address: '12 Oak Street, Bristol',
      postcode: 'BS1 1AA',
      utr: '1234567890',
      nino: 'AB 12 34 56 C',
    },
  })

  const c2 = await prisma.client.upsert({
    where: { ref: 'PJL0002' },
    update: {},
    create: {
      ref: 'PJL0002',
      name: 'Sarah Johnson',
      companyName: 'SJ Consulting Ltd',
      clientType: 'LIMITED_COMPANY',
      email: 'sarah@sjconsulting.co.uk',
      phone: '07700 900002',
      address: '45 High Street, Bath',
      postcode: 'BA1 1BD',
      utr: '9876543210',
      companyNo: '12345678',
      vatNo: 'GB123456789',
    },
  })

  const c3 = await prisma.client.upsert({
    where: { ref: 'PJL0003' },
    update: {},
    create: {
      ref: 'PJL0003',
      name: 'Mike Turner',
      clientType: 'SOLE_TRADER',
      email: 'mike@miketurnerplumbing.co.uk',
      phone: '07700 900003',
      address: '8 Bridge Road, Cardiff',
      postcode: 'CF1 1AA',
      utr: '5555555550',
      nino: 'CD 98 76 54 A',
    },
  })

  console.log('✓ Clients created')

  // ─── Onboarding records ────────────────────────────────────────────────────
  await prisma.clientOnboarding.upsert({
    where: { clientId: c1.id },
    update: {},
    create: {
      clientId: c1.id,
      stage: 'COMPLETED',
      amlStatus: 'COMPLETED',
      amlCompletedDate: new Date('2024-01-15'),
      idVerified: true,
      addressVerified: true,
      engagementLetterSent: new Date('2024-01-10'),
      engagementLetterSigned: new Date('2024-01-13'),
      termsAccepted: true,
      hmrcOnlineSetup: true,
      agentAuthRequested: true,
      conflictCheckDone: true,
      ddSetup: true,
      completedAt: new Date('2024-01-20'),
    },
  })

  await prisma.clientOnboarding.upsert({
    where: { clientId: c2.id },
    update: {},
    create: {
      clientId: c2.id,
      stage: 'HMRC_SETUP',
      amlStatus: 'COMPLETED',
      amlCompletedDate: new Date('2024-02-05'),
      idVerified: true,
      addressVerified: true,
      engagementLetterSent: new Date('2024-02-01'),
      engagementLetterSigned: new Date('2024-02-04'),
      termsAccepted: true,
      hmrcOnlineSetup: false,
      agentAuthRequested: false,
      conflictCheckDone: true,
    },
  })

  await prisma.clientOnboarding.upsert({
    where: { clientId: c3.id },
    update: {},
    create: {
      clientId: c3.id,
      stage: 'AML',
      amlStatus: 'IN_PROGRESS',
      idVerified: true,
      addressVerified: false,
      conflictCheckDone: true,
    },
  })

  console.log('✓ Onboarding records created')

  // ─── HMRC Authorisations ───────────────────────────────────────────────────
  await prisma.hMRCAuthorisation.upsert({
    where: { clientId_type: { clientId: c1.id, type: 'SELF_ASSESSMENT' } },
    update: {},
    create: {
      clientId: c1.id,
      type: 'SELF_ASSESSMENT',
      status: 'AUTHORISED',
      form64_8Sent: new Date('2024-01-15'),
      authorisedDate: new Date('2024-02-01'),
      agentRef: 'SA-PJL-001',
    },
  })

  await prisma.hMRCAuthorisation.upsert({
    where: { clientId_type: { clientId: c2.id, type: 'CORPORATION_TAX' } },
    update: {},
    create: {
      clientId: c2.id,
      type: 'CORPORATION_TAX',
      status: 'PENDING_HMRC',
      form64_8Sent: new Date('2024-02-10'),
    },
  })

  await prisma.hMRCAuthorisation.upsert({
    where: { clientId_type: { clientId: c2.id, type: 'VAT' } },
    update: {},
    create: {
      clientId: c2.id,
      type: 'VAT',
      status: 'AUTHORISED',
      form64_8Sent: new Date('2024-02-10'),
      authorisedDate: new Date('2024-02-20'),
    },
  })

  await prisma.hMRCAuthorisation.upsert({
    where: { clientId_type: { clientId: c3.id, type: 'SELF_ASSESSMENT' } },
    update: {},
    create: {
      clientId: c3.id,
      type: 'SELF_ASSESSMENT',
      status: 'NOT_STARTED',
    },
  })

  console.log('✓ HMRC authorisations created')

  // ─── Tax Returns ───────────────────────────────────────────────────────────
  await prisma.taxReturn.create({
    data: {
      clientId: c1.id,
      type: 'SA100',
      taxYear: '2023/24',
      dueDate: new Date('2025-01-31'),
      status: 'INFO_REQUESTED',
      infoRequestedDate: new Date('2024-10-01'),
      assignedToId: staff.id,
    },
  }).catch(() => {}) // Skip if already exists

  await prisma.taxReturn.create({
    data: {
      clientId: c1.id,
      type: 'SA100',
      taxYear: '2022/23',
      dueDate: new Date('2024-01-31'),
      status: 'FILED',
      infoRequestedDate: new Date('2023-10-01'),
      infoReceivedDate: new Date('2023-10-15'),
      preparedDate: new Date('2023-11-01'),
      reviewedDate: new Date('2023-11-10'),
      sentToClientDate: new Date('2023-11-12'),
      clientApprovedDate: new Date('2023-11-15'),
      filedDate: new Date('2023-12-01'),
      hmrcReference: 'SA23-001',
      assignedToId: staff.id,
    },
  }).catch(() => {})

  await prisma.taxReturn.create({
    data: {
      clientId: c2.id,
      type: 'CT600',
      taxYear: '2023/24',
      dueDate: new Date('2025-03-31'),
      status: 'NOT_STARTED',
      assignedToId: admin.id,
    },
  }).catch(() => {})

  await prisma.taxReturn.create({
    data: {
      clientId: c3.id,
      type: 'SA100',
      taxYear: '2023/24',
      dueDate: new Date('2025-01-31'),
      status: 'NOT_STARTED',
    },
  }).catch(() => {})

  console.log('✓ Tax returns created')

  // ─── Prospects ─────────────────────────────────────────────────────────────
  for (const p of [
    {
      name: 'Emma Williams',
      companyName: 'Williams Florist',
      email: 'emma@williamsflorist.co.uk',
      phone: '07700 900010',
      source: 'REFERRAL',
      serviceTypes: JSON.stringify(['Self Assessment', 'Bookkeeping', 'VAT']),
      status: 'PROPOSAL_SENT',
      estimatedFees: 1200,
      nextAction: 'Follow up on proposal',
      nextActionDate: new Date('2024-04-15'),
      assignedToId: admin.id,
    },
    {
      name: 'Robert Chen',
      companyName: 'Chen Engineering Ltd',
      email: 'robert@cheneng.co.uk',
      source: 'WEBSITE',
      serviceTypes: JSON.stringify(['Corporation Tax', 'Accounts Preparation', 'Payroll / PAYE']),
      status: 'MEETING_ARRANGED',
      estimatedFees: 3500,
      nextAction: 'Initial meeting',
      nextActionDate: new Date('2024-04-10'),
      assignedToId: staff.id,
    },
    {
      name: 'Lisa Patel',
      source: 'NETWORKING',
      serviceTypes: JSON.stringify(['Self Assessment']),
      status: 'NEW',
      estimatedFees: 450,
      assignedToId: admin.id,
    },
  ]) {
    await prisma.prospect.create({ data: p }).catch(() => {})
  }

  console.log('✓ Prospects created')

  // ─── Tasks ─────────────────────────────────────────────────────────────────
  for (const t of [
    {
      title: 'Request 2023/24 records from John Smith',
      clientId: c1.id,
      status: 'TODO',
      priority: 'HIGH',
      dueDate: new Date('2024-10-31'),
      assignedToId: staff.id,
      createdById: admin.id,
    },
    {
      title: 'Complete AML check for Mike Turner',
      clientId: c3.id,
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate: new Date('2024-04-05'),
      assignedToId: admin.id,
      createdById: admin.id,
    },
    {
      title: 'Set up HMRC Online Services for SJ Consulting',
      clientId: c2.id,
      status: 'TODO',
      priority: 'MEDIUM',
      assignedToId: staff.id,
      createdById: admin.id,
    },
    {
      title: 'Review engagement letter template',
      status: 'TODO',
      priority: 'LOW',
      assignedToId: admin.id,
      createdById: admin.id,
    },
  ]) {
    await prisma.task.create({ data: t }).catch(() => {})
  }

  console.log('✓ Tasks created')
  console.log('\n✅ Seed complete!')
  console.log('\nDefault login credentials:')
  console.log('  Admin: admin@pjlaccounts.co.uk / admin123')
  console.log('  Staff: staff@pjlaccounts.co.uk / staff123')
  console.log('\n⚠️  Change these passwords immediately after first login!\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
