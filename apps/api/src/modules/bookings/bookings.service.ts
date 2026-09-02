import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ListBookingsDto } from './dto/list-bookings.dto';

/** Booking with all relations eagerly loaded — used for detail views */
const bookingWithRelations = {
  customer: true,
  vehicle: true,
  mechanic: true,
  service: { include: { category: true } },
} satisfies Prisma.BookingInclude;

type BookingDetail = Prisma.BookingGetPayload<{ include: typeof bookingWithRelations }>;

/** Valid status transitions to enforce booking lifecycle rules */
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.ASSIGNED, BookingStatus.CANCELLED],
  [BookingStatus.ASSIGNED]: [BookingStatus.MECHANIC_ON_THE_WAY, BookingStatus.CANCELLED],
  [BookingStatus.MECHANIC_ON_THE_WAY]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListBookingsDto): Promise<PaginatedResult<BookingDetail>> {
    const { status, customerId, mechanicId, scheduledFrom, scheduledTo, page, limit, skip, q, sortBy, sortOrder } = query;

    const where: Prisma.BookingWhereInput = {
      ...(status !== undefined && { status }),
      ...(customerId !== undefined && { customerId }),
      ...(mechanicId !== undefined && { mechanicId }),
      ...(scheduledFrom !== undefined || scheduledTo !== undefined
        ? {
            scheduledAt: {
              ...(scheduledFrom !== undefined && { gte: new Date(scheduledFrom) }),
              ...(scheduledTo !== undefined && { lte: new Date(scheduledTo) }),
            },
          }
        : {}),
    };

    // Full-text-ish search across customer name, vehicle license plate and service name
    if (q && q.trim().length > 0) {
      const term = q.trim();
      Object.assign(where, {
        OR: [
          { customer: { OR: [{ firstName: { contains: term, mode: 'insensitive' } }, { lastName: { contains: term, mode: 'insensitive' } }] } },
          { vehicle: { licensePlate: { contains: term, mode: 'insensitive' } } },
          { service: { name: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }

    // Determine ordering
    const orderBy: Prisma.BookingOrderByWithRelationInput = {};
    if (sortBy === 'createdAt') orderBy.createdAt = sortOrder as 'asc' | 'desc';
    else if (sortBy === 'totalAmount') orderBy.totalAmount = sortOrder as 'asc' | 'desc';
    else orderBy.scheduledAt = sortOrder as 'asc' | 'desc';

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: bookingWithRelations,
        orderBy,
        take: limit,
        skip,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<BookingDetail> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingWithRelations,
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    return booking;
  }

  async create(dto: CreateBookingDto): Promise<BookingDetail> {
    return this.prisma.booking.create({
      data: {
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        serviceId: dto.serviceId,
        scheduledAt: new Date(dto.scheduledAt),
        // Convert undefined → null for Prisma (exactOptionalPropertyTypes)
        notes: dto.notes ?? null,
        status: BookingStatus.PENDING,
      },
      include: bookingWithRelations,
    });
  }

  async update(id: string, dto: UpdateBookingDto): Promise<BookingDetail> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    // Enforce lifecycle transitions
    if (dto.status !== undefined) {
      const allowed = VALID_TRANSITIONS[booking.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition booking from ${booking.status} to ${dto.status}`,
        );
      }
    }

    // Derive timestamp updates based on new status
    const timestamps: Partial<{ startedAt: Date; completedAt: Date; cancelledAt: Date }> = {};
    if (dto.status === BookingStatus.IN_PROGRESS) timestamps.startedAt = new Date();
    if (dto.status === BookingStatus.COMPLETED) timestamps.completedAt = new Date();
    if (dto.status === BookingStatus.CANCELLED) timestamps.cancelledAt = new Date();

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.mechanicId !== undefined && { mechanicId: dto.mechanicId }),
        ...(dto.internalNotes !== undefined && { internalNotes: dto.internalNotes }),
        ...timestamps,
      },
      include: bookingWithRelations,
    });
  }
}
