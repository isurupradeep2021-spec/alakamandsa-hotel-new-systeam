import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './room.entity';
import { RoomSyncService } from './room-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room])],
  providers: [RoomSyncService],
  exports: [RoomSyncService],
})
export class RoomsModule {}
