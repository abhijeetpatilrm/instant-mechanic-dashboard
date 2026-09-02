import { BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListBookingsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by mechanic ID' })
  @IsOptional()
  @IsString()
  mechanicId?: string;

  @ApiPropertyOptional({ description: 'Filter bookings scheduled from this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  scheduledFrom?: string;

  @ApiPropertyOptional({ description: 'Filter bookings scheduled until this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  scheduledTo?: string;
}
