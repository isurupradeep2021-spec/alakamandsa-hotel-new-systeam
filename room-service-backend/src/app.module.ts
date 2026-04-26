import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UserAccount, StaffDetail } from './staff/staff.entity';
import { StaffContact } from './staff/staff-contact.entity';
import { HousekeepingTask } from './housekeeping/housekeeping-task.entity';
import { MaintenanceTicket } from './maintenance/maintenance-ticket.entity';
import { StaffModule } from './staff/staff.module';
import { HousekeepingModule } from './housekeeping/housekeeping.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SlaModule } from './sla/sla.module';
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
      port: Number.parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '123456789',
      database: process.env.DB_NAME || 'hotel_management',
      entities: [UserAccount, StaffDetail, StaffContact, HousekeepingTask, MaintenanceTicket],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([UserAccount, StaffDetail, StaffContact, HousekeepingTask, MaintenanceTicket]),
    ScheduleModule.forRoot(),
    StaffModule,
    HousekeepingModule,
    MaintenanceModule,
    AnalyticsModule,
    SlaModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
