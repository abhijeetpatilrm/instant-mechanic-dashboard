import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface DashboardMetrics {
  bookings: {
    total: number;
    today: number;
    byStatus: Record<BookingStatus, number>;
    pendingUnassigned: number;
  };
  mechanics: {
    total: number;
    available: number;
    busy: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
  };
  revenue: {
    today: number;
    thisMonth: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBookings,
      todayBookings,
      bookingsByStatus,
      pendingUnassigned,
      totalMechanics,
      availableMechanics,
      totalCustomers,
      newCustomersThisMonth,
      revenueToday,
      revenueMonth,
    ] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.booking.count({
        where: { status: BookingStatus.PENDING, mechanicId: null },
      }),
      this.prisma.mechanic.count({ where: { isActive: true } }),
      this.prisma.mechanic.count({ where: { isActive: true, isAvailable: true } }),
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.booking.aggregate({
        where: {
          status: BookingStatus.COMPLETED,
          completedAt: { gte: todayStart },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.booking.aggregate({
        where: {
          status: BookingStatus.COMPLETED,
          completedAt: { gte: monthStart },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    // Build byStatus map from groupBy result
    const byStatus = Object.values(BookingStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<BookingStatus, number>,
    );
    for (const row of bookingsByStatus) {
      byStatus[row.status] = row._count._all;
    }

    return {
      bookings: {
        total: totalBookings,
        today: todayBookings,
        byStatus,
        pendingUnassigned,
      },
      mechanics: {
        total: totalMechanics,
        available: availableMechanics,
        busy: totalMechanics - availableMechanics,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomersThisMonth,
      },
      revenue: {
        today: Number(revenueToday._sum.totalAmount ?? 0),
        thisMonth: Number(revenueMonth._sum.totalAmount ?? 0),
      },
    };
  }
}
