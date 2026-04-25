import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccount, StaffDetail } from './staff/staff.entity';
import { HousekeepingTask } from './housekeeping/housekeeping-task.entity';
import { MaintenanceTicket } from './maintenance/maintenance-ticket.entity';
import { StaffModule } from './staff/staff.module';
import { HousekeepingModule } from './housekeeping/housekeeping.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '123456789',
      database: process.env.DB_NAME || 'hotel_management',
      entities: [UserAccount, StaffDetail, HousekeepingTask, MaintenanceTicket],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([UserAccount, StaffDetail, HousekeepingTask, MaintenanceTicket]),
    StaffModule,
    HousekeepingModule,
    MaintenanceModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
