import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMechanicDto, UpdateMechanicDto, ListMechanicsDto } from './dto/mechanic.dto';

@Injectable()
export class MechanicsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListMechanicsDto) {
    const where: Prisma.MechanicWhereInput = {
      isActive: true,
      ...(query.isAvailable !== undefined && { isAvailable: query.isAvailable }),
      ...(query.specialization !== undefined && {
        specializations: { has: query.specialization },
      }),
    };

    return this.prisma.mechanic.findMany({
      where,
      orderBy: [{ isAvailable: 'desc' }, { rating: 'desc' }],
    });
  }

  async findOne(id: string) {
    const mechanic = await this.prisma.mechanic.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: { in: ['ASSIGNED', 'MECHANIC_ON_THE_WAY', 'IN_PROGRESS'] } },
          include: { customer: true, service: true },
          orderBy: { scheduledAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!mechanic) throw new NotFoundException(`Mechanic ${id} not found`);
    return mechanic;
  }

  async create(dto: CreateMechanicDto) {
    return this.prisma.mechanic.create({ data: dto });
  }

  async update(id: string, dto: UpdateMechanicDto) {
    await this.findOne(id); // Throws 404 if not found
    return this.prisma.mechanic.update({ where: { id }, data: dto });
  }
}
