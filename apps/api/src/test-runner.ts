/*
 * Minimal test runner using ts-node (already present in devDependencies).
 * Focused unit tests that mock PrismaService for critical services.
 */
import { strict as assert } from 'assert';
import { DashboardService } from './modules/dashboard/dashboard.service';

async function testDashboardServiceMapping() {
  // Mocked prisma with minimal methods
  const prisma: any = {
    booking: {
      count: async () => 100,
      groupBy: async () => [{ status: 'PENDING', _count: { _all: 5 } }],
      aggregate: async (args: any) => ({ _sum: { totalAmount: 2000 } }),
      findMany: async (args: any) => [],
    },
    mechanic: { count: async () => 20, findMany: async () => [] },
    customer: { count: async () => 50 },
  };

  const svc = new DashboardService(prisma as any);
  const dto = await svc.getMetrics();
  assert.ok(dto.summary.totalBookings === 100, 'totalBookings mapped');
  assert.ok(typeof dto.revenueByDay !== 'undefined', 'revenueByDay present');
  console.log('✔ DashboardService mapping test passed');
}

async function testBookingsTransitionValidation() {
  const prisma: any = {
    booking: {
      findUnique: async ({ where }: any) => ({ id: where.id, status: 'PENDING' }),
      update: async ({ where, data }: any) => ({ id: where.id, ...data, customer: null, vehicle: null, mechanic: null, service: null }),
    },
  };
  const { BookingsService } = await import('./modules/bookings/bookings.service');
  const svc = new BookingsService(prisma as any);

  // Valid transition PENDING -> ASSIGNED
  const updated = await svc.update('test123', { status: 'ASSIGNED' as any });
  assert.ok(updated.status === 'ASSIGNED', 'status updated to ASSIGNED');

  // Invalid transition PENDING -> COMPLETED should throw
  let threw = false;
  try {
    await svc.update('test123', { status: 'COMPLETED' as any });
  } catch (e: any) {
    threw = true;
  }
  assert.ok(threw, 'Invalid transition throws');
  console.log('✔ BookingsService transition tests passed');
}

async function run() {
  try {
    await testDashboardServiceMapping();
    await testBookingsTransitionValidation();
    // additional mechanics update test
    await (async () => {
      const { MechanicsService } = await import('./modules/mechanics/mechanics.service');
      const prisma: any = {
        mechanic: { findUnique: async () => ({ id: 'm1' }), update: async ({ where, data }: any) => ({ id: where.id, ...data }) },
      };
      const svc = new MechanicsService(prisma as any);
      const updated = await svc.update('m1', { isAvailable: false });
      if (!updated || updated.id !== 'm1') throw new Error('Mechanic update failed');
      console.log('✔ Mechanics update test passed');
    })();
    console.log('\nAll tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Test failure', err);
    process.exit(2);
  }
}

run();
