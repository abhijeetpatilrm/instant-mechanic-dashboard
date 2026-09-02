import { Controller, Get, Post, Patch, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { MechanicsService } from './mechanics.service';
import { CreateMechanicDto, UpdateMechanicDto, ListMechanicsDto } from './dto/mechanic.dto';

@ApiTags('mechanics')
@Controller({ path: 'mechanics', version: '1' })
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Get()
  @ApiOperation({ summary: 'List mechanics' })
  findAll(@Query() query: ListMechanicsDto) {
    return this.mechanicsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mechanic by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.mechanicsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create mechanic profile' })
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update mechanic (availability, specializations)' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateMechanicDto) {
    return this.mechanicsService.update(id, dto);
  }
}
