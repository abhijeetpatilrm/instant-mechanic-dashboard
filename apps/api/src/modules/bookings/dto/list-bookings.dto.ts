import { BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsDateString, IsIn } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Free-text search across customer name, vehicle license plate and service name' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['scheduledAt', 'createdAt', 'totalAmount'], default: 'scheduledAt' })
  @IsOptional()
  @IsString()
  @IsIn(['scheduledAt', 'createdAt', 'totalAmount'])
  sortBy?: 'scheduledAt' | 'createdAt' | 'totalAmount' = 'scheduledAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
