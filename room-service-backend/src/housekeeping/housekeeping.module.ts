import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousekeepingTask } from './housekeeping-task.entity';
import { UserAccount } from '../staff/staff.entity';
import { HousekeepingService } from './housekeeping.service';
import { HousekeepingController } from './housekeeping.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([HousekeepingTask, UserAccount]), AuthModule],
  controllers: [HousekeepingController],
  providers: [HousekeepingService],
})
export class HousekeepingModule {}
