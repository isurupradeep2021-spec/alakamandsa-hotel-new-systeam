import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './room.entity';
import { RoomSyncService } from './room-sync.service';
import { RoomsController } from './rooms.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Room]), AuthModule],
  controllers: [RoomsController],
  providers: [RoomSyncService],
  exports: [RoomSyncService],
})
export class RoomsModule {}
