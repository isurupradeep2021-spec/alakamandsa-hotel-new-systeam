import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousekeepingTask } from '../housekeeping/housekeeping-task.entity';
import { MaintenanceTicket } from '../maintenance/maintenance-ticket.entity';
import { StaffContact } from '../staff/staff-contact.entity';
import { UserAccount } from '../staff/staff.entity';
import { MailerService } from './mailer.service';
import { SlaAlertService } from './sla-alert.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([HousekeepingTask, MaintenanceTicket, StaffContact, UserAccount]),
  ],
  providers: [MailerService, SlaAlertService],
  exports: [MailerService],
})
export class SlaModule {}
