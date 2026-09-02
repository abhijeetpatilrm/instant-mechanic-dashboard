import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { MechanicsModule } from './modules/mechanics/mechanics.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ServicesModule } from './modules/services/services.module';

@Module({
  imports: [
    // Config — loaded globally so all modules can inject ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    PrismaModule,

    // Feature modules
    HealthModule,
    DashboardModule,
    BookingsModule,
    MechanicsModule,
    CustomersModule,
    ServicesModule,
  ],
})
export class AppModule {}
