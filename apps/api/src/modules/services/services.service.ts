import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.serviceCategory.findMany({
      include: {
        services: {
          where: { isActive: true },
          orderBy: { basePrice: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
