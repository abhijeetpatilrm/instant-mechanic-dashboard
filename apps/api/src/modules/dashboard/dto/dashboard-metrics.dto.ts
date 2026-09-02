import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class DashboardSummaryDto {
  @ApiProperty() totalBookings!: number;
  @ApiProperty() todayBookings!: number;
  @ApiProperty() completedBookings!: number;
  @ApiProperty() pendingBookings!: number;
  @ApiProperty() cancelledBookings!: number;
  @ApiProperty() inProgressBookings!: number;
  @ApiProperty() assignedBookings!: number;
  @ApiProperty() mechanicOnTheWayBookings!: number;
  @ApiProperty({ description: 'Total revenue from all completed bookings (INR)' }) totalRevenue!: number;
  @ApiProperty({ description: 'Revenue from completed bookings today (INR)' }) todayRevenue!: number;
  @ApiProperty({ description: 'Revenue from completed bookings this month (INR)' }) thisMonthRevenue!: number;
  @ApiProperty() activeMechanics!: number;
  @ApiProperty() availableMechanics!: number;
  @ApiProperty() totalCustomers!: number;
  @ApiProperty() newCustomersThisMonth!: number;
  @ApiProperty({ description: 'Average booking value for completed bookings (INR)' }) avgBookingValue!: number;
  @ApiProperty({ description: 'Completion rate % (completed / (completed + cancelled))' }) completionRate!: number;
}

export class DailyRevenueDatum {
  @ApiProperty({ description: 'ISO date string YYYY-MM-DD' }) date!: string;
  @ApiProperty() revenue!: number;
  @ApiProperty() bookings!: number;
}

export class DailyBookingDatum {
  @ApiProperty() date!: string;
  @ApiProperty() total!: number;
  @ApiProperty() completed!: number;
  @ApiProperty() cancelled!: number;
}

export class TopMechanicDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() totalJobs!: number;
  @ApiProperty() rating!: number | null;
  @ApiProperty() completedThisMonth!: number;
  @ApiProperty() revenueThisMonth!: number;
  @ApiProperty() isAvailable!: boolean;
  @ApiProperty() specializations!: string[];
}

export class DashboardMetricsDto {
  @ApiProperty({ type: DashboardSummaryDto }) summary!: DashboardSummaryDto;
  @ApiProperty({ type: 'object', description: 'Count per BookingStatus' }) bookingsByStatus!: Record<BookingStatus, number>;
  @ApiProperty({ type: [DailyRevenueDatum] }) revenueByDay!: DailyRevenueDatum[];
  @ApiProperty({ type: [DailyBookingDatum] }) bookingsByDay!: DailyBookingDatum[];
  @ApiProperty({ type: [TopMechanicDto] }) topMechanics!: TopMechanicDto[];
  @ApiProperty({ isArray: true, description: 'Last 10 bookings with relations' }) recentBookings!: unknown[];
}
