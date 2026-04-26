import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { UpdateHousekeepingTaskDto } from './dto/update-housekeeping-task.dto';
import { BookingTriggerDto } from './dto/booking-trigger.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('housekeeping')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'MANAGER')
  create(@Body() dto: CreateHousekeepingTaskDto) {
    return this.housekeepingService.create(dto);
  }

  /**
   * Called automatically by the frontend after a room booking is confirmed.
   * Any authenticated user can call this (no role restriction) since customers
   * create their own bookings and must be able to trigger the housekeeping task.
   */
  @Post('booking-trigger')
  @Roles('SUPER_ADMIN', 'MANAGER', 'STAFF_MEMBER', 'CUSTOMER', 'RESTAURANT_MANAGER', 'EVENT_MANAGER', 'HOUSEKEEPER', 'MAINTENANCE_STAFF')
  triggerFromBooking(@Body() dto: BookingTriggerDto) {
    return this.housekeepingService.createFromBooking(dto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPER')
  findAll(@Request() req: any) {
    return this.housekeepingService.findAll(req.user);
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPER', 'MAINTENANCE_STAFF')
  getStats() {
    return this.housekeepingService.getStats();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPER')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.housekeepingService.findOne(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'MANAGER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHousekeepingTaskDto,
  ) {
    return this.housekeepingService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('HOUSEKEEPER')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    return this.housekeepingService.updateStatus(id, status, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPER_ADMIN', 'MANAGER')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.housekeepingService.remove(id);
  }
}
