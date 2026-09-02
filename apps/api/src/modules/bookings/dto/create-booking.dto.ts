import { IsString, IsDateString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'Customer ID (cuid)' })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ description: 'Vehicle ID (cuid)' })
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @ApiProperty({ description: 'Service ID (cuid)' })
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ description: 'Scheduled date/time (ISO 8601)' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ description: 'Customer notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
