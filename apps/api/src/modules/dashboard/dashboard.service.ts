import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  DashboardMetricsDto,
  TopMechanicDto,
  DailyRevenueDatum,
  DailyBookingDatum,
  DashboardSummaryDto,
} from './dto/dashboard-metrics.dto';

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(): Promise<DashboardMetricsDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86_400_000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    // Include today and previous 29 days to make a 30-day window
    const thirtyDaysAgo = new Date(todayStart.getTime() - 29 * 86_400_000);

    // ── Run all aggregate queries in parallel ──────────────────────────────
    const [
      totalBookings,
      todayBookings,
      bookingsByStatusRaw,
      totalRevResult,
      todayRevResult,
      monthRevResult,
      activeMechanics,
      availableMechanics,
      totalCustomers,
      newCustomersThisMonth,
      completedCount,
      cancelledCount,
      recentBookings,
      mechanicsWithMonthCompleted,
      last30DayBookings,
    ] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { scheduledAt: { gte: todayStart, lt: todayEnd } } }),
      this.prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.booking.aggregate({ where: { status: BookingStatus.COMPLETED }, _sum: { totalAmount: true } }),
      this.prisma.booking.aggregate({ where: { status: BookingStatus.COMPLETED, completedAt: { gte: todayStart, lt: todayEnd } }, _sum: { totalAmount: true } }),
      this.prisma.booking.aggregate({ where: { status: BookingStatus.COMPLETED, completedAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
      this.prisma.mechanic.count({ where: { isActive: true } }),
      this.prisma.mechanic.count({ where: { isActive: true, isAvailable: true } }),
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
      // Last 10 bookings
      this.prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          vehicle: { select: { id: true, make: true, model: true, licensePlate: true } },
          mechanic: { select: { id: true, firstName: true, lastName: true } },
          service: { select: { id: true, name: true, basePrice: true } },
        },
      }),
      // Mechanics completed bookings this month (grouped) — use groupBy to avoid fetching booking arrays for every mechanic
      this.prisma.booking.groupBy({
        by: ['mechanicId'],
        where: { status: BookingStatus.COMPLETED, completedAt: { gte: monthStart }, mechanicId: { not: null } },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      // All bookings in last 30 days for chart data
      this.prisma.booking.findMany({
        where: { scheduledAt: { gte: thirtyDaysAgo } },
        select: { scheduledAt: true, status: true, totalAmount: true },
        orderBy: { scheduledAt: 'asc' },
      }),
    ]);

    // ── Build byStatus map ─────────────────────────────────────────────────
    const byStatus = Object.values(BookingStatus).reduce(
      (acc, s) => { acc[s] = 0; return acc; },
      {} as Record<BookingStatus, number>,
    );
    for (const row of bookingsByStatusRaw) byStatus[row.status] = row._count._all;

    // ── Revenue ────────────────────────────────────────────────────────────
    const totalRevenue = Number(totalRevResult._sum.totalAmount ?? 0);
    const todayRevenue = Number(todayRevResult._sum.totalAmount ?? 0);
    const thisMonthRevenue = Number(monthRevResult._sum.totalAmount ?? 0);
    const avgBookingValue = completedCount > 0 ? Number((totalRevenue / completedCount).toFixed(2)) : 0;
    const completionRate = (completedCount + cancelledCount) > 0
      ? Number(((completedCount / (completedCount + cancelledCount)) * 100).toFixed(1))
      : 0;

    // ── Build daily revenue & booking arrays (last 30 days) ───────────────
    const dailyMap = new Map<string, { revenue: number; total: number; completed: number; cancelled: number }>();
    for (let d = 0; d < 30; d++) {
      const date = addDays(thirtyDaysAgo, d);
      const key = toDateKey(date);
      dailyMap.set(key, { revenue: 0, total: 0, completed: 0, cancelled: 0 });
    }
    for (const b of last30DayBookings) {
      const key = toDateKey(b.scheduledAt);
      const entry = dailyMap.get(key);
      if (!entry) continue;
      entry.total += 1;
      if (b.status === BookingStatus.COMPLETED) {
        entry.revenue += Number(b.totalAmount ?? 0);
        entry.completed += 1;
      }
      if (b.status === BookingStatus.CANCELLED) entry.cancelled += 1;
    }
    const revenueByDay: DailyRevenueDatum[] = [];
    const bookingsByDay: DailyBookingDatum[] = [];
    for (const [date, v] of dailyMap) {
      revenueByDay.push({ date, revenue: Number(v.revenue.toFixed(2)), bookings: v.total });
      bookingsByDay.push({ date, total: v.total, completed: v.completed, cancelled: v.cancelled });
    }

    // ── Top mechanics ─────────────────────────────────────────────────────
    // Use the grouped booking results to compute top mechanics without pulling booking arrays.
    const mechanicsGroup = mechanicsWithMonthCompleted as Array<{ mechanicId: string | null; _count: { _all: number }; _sum: { totalAmount: number | null } }>;
    const ranked = mechanicsGroup
      .filter((g) => g.mechanicId)
      .map((g) => ({ mechanicId: g.mechanicId as string, completedThisMonth: g._count._all, revenueThisMonth: Number(g._sum.totalAmount ?? 0) }))
      .sort((a, b) => b.completedThisMonth - a.completedThisMonth);

    const topMechanicIds = ranked.slice(0, 5).map((r) => r.mechanicId);
    const mechanicsMap = new Map<string, any>();
    if (topMechanicIds.length > 0) {
      const mechRows = await this.prisma.mechanic.findMany({ where: { id: { in: topMechanicIds } } });
      for (const m of mechRows) mechanicsMap.set(m.id, m);
    }

    const topMechanics: TopMechanicDto[] = ranked.slice(0, 5).map((r) => {
      const m = mechanicsMap.get(r.mechanicId);
      return {
        id: r.mechanicId,
        name: m ? `${m.firstName} ${m.lastName}` : 'Unknown',
        totalJobs: m?.totalJobs ?? 0,
        rating: m?.rating ?? null,
        completedThisMonth: r.completedThisMonth,
        revenueThisMonth: Number(r.revenueThisMonth.toFixed(2)),
        isAvailable: m?.isAvailable ?? false,
        specializations: m?.specializations ?? [],
      };
    });

    return {
      summary: {
        totalBookings,
        todayBookings,
        completedBookings: completedCount,
        pendingBookings: byStatus[BookingStatus.PENDING],
        cancelledBookings: cancelledCount,
        inProgressBookings: byStatus[BookingStatus.IN_PROGRESS],
        assignedBookings: byStatus[BookingStatus.ASSIGNED],
        mechanicOnTheWayBookings: byStatus[BookingStatus.MECHANIC_ON_THE_WAY],
        totalRevenue,
        todayRevenue,
        thisMonthRevenue,
        activeMechanics,
        availableMechanics,
        totalCustomers,
        newCustomersThisMonth,
        avgBookingValue,
        completionRate,
      },
      bookingsByStatus: byStatus,
      revenueByDay,
      bookingsByDay,
      topMechanics,
      recentBookings,
    };
  }
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
