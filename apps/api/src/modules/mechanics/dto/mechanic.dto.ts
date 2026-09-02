import { MechanicSpecialization } from '@prisma/client';
import {
  IsString, IsEmail, IsEnum, IsArray, IsOptional, IsBoolean, IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMechanicDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  phone!: string;

  @ApiProperty({ enum: MechanicSpecialization, isArray: true })
  @IsArray()
  @IsEnum(MechanicSpecialization, { each: true })
  specializations!: MechanicSpecialization[];
}

export class UpdateMechanicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ enum: MechanicSpecialization, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(MechanicSpecialization, { each: true })
  specializations?: MechanicSpecialization[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class ListMechanicsDto {
  @ApiPropertyOptional({ description: 'Filter by availability' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ enum: MechanicSpecialization })
  @IsOptional()
  @IsEnum(MechanicSpecialization)
  specialization?: MechanicSpecialization;
}
