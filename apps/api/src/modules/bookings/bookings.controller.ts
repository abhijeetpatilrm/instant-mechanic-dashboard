import {
  Controller, Get, Post, Patch, Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ListBookingsDto } from './dto/list-bookings.dto';

@ApiTags('bookings')
@Controller({ path: 'bookings', version: '1' })
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** List bookings with optional status/date/customer/mechanic filters */
  @Get()
  @ApiOperation({ summary: 'List bookings' })
  findAll(@Query() query: ListBookingsDto) {
    return this.bookingsService.findAll(query);
  }

  /** Get a single booking by ID with full relations */
  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking cuid' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  /** Create a new booking in PENDING status */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking' })
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  /** Update booking status, assign mechanic, or add dispatcher notes */
  @Patch(':id')
  @ApiOperation({ summary: 'Update booking' })
  @ApiParam({ name: 'id', description: 'Booking cuid' })
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookingsService.update(id, dto);
  }
}
