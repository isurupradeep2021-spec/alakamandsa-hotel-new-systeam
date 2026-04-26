import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoomSyncService } from './room-sync.service';
import { Room } from './room.entity';

@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomSyncService: RoomSyncService) {}

  /** GET /rooms — returns all rooms for dropdown population */
  @Get()
  findAll(): Promise<Room[]> {
    return this.roomSyncService.findAll();
  }
}
