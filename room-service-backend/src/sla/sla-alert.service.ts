import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import {
  HousekeepingTask,
  HousekeepingStatus,
} from '../housekeeping/housekeeping-task.entity';
import {
  MaintenanceTicket,
  MaintenanceStatus,
} from '../maintenance/maintenance-ticket.entity';
import { StaffContact } from '../staff/staff-contact.entity';
import { UserAccount } from '../staff/staff.entity';
import { MailerService } from './mailer.service';

@Injectable()
export class SlaAlertService {
  private readonly logger = new Logger(SlaAlertService.name);

  constructor(
    @InjectRepository(HousekeepingTask)
    private readonly hkRepo: Repository<HousekeepingTask>,
    @InjectRepository(MaintenanceTicket)
    private readonly mtRepo: Repository<MaintenanceTicket>,
    @InjectRepository(StaffContact)
    private readonly contactRepo: Repository<StaffContact>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    private readonly mailer: MailerService,
  ) {}

  /**
   * Runs every 30 minutes.
   * Finds overdue tasks/tickets with an assigned staff and unsent alert, sends email.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkOverdue(): Promise<void> {
    this.logger.log('Checking overdue SLA items…');
    const now = new Date();
    await Promise.all([
      this.alertHousekeeping(now),
      this.alertMaintenance(now),
    ]);
  }

  // ── Housekeeping ────────────────────────────────────────────────────────

  private async alertHousekeeping(now: Date): Promise<void> {
    const overdue = await this.hkRepo.find({
      where: {
        deadline: LessThan(now),
        alertSent: false,
        staffId: Not(IsNull()),
        // Not in a terminal status
      },
    });

    const terminal = new Set([HousekeepingStatus.CLEANED, HousekeepingStatus.INSPECTED]);
    const actionable = overdue.filter((t) => !terminal.has(t.status));

    for (const task of actionable) {
      const email = await this.resolveEmail(task.staffId);
      if (!email) {
        this.logger.warn(`No email for staff #${task.staffId}, skipping HK task #${task.id}`);
        task.alertSent = true; // mark so we don't retry endlessly
        await this.hkRepo.save(task);
        continue;
      }

      const staffName = await this.resolveStaffName(task.staffId);
      await this.mailer.sendSlaAlert({
        to: email,
        staffName,
        type: 'housekeeping',
        taskId: task.id,
        roomNumber: task.roomNumber,
        deadline: task.deadline,
        description: `${task.taskType} — ${task.roomCondition} room`,
      });
      task.alertSent = true;
      await this.hkRepo.save(task);
    }

    if (actionable.length > 0) {
      this.logger.log(`Sent SLA alerts for ${actionable.length} overdue housekeeping task(s)`);
    }
  }

  // ── Maintenance ─────────────────────────────────────────────────────────

  private async alertMaintenance(now: Date): Promise<void> {
    const overdue = await this.mtRepo.find({
      where: {
        deadline: LessThan(now),
        alertSent: false,
        staffId: Not(IsNull()),
      },
    });

    const terminal = new Set([MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED]);
    const actionable = overdue.filter((t) => !terminal.has(t.status));

    for (const ticket of actionable) {
      const email = await this.resolveEmail(ticket.staffId);
      if (!email) {
        this.logger.warn(`No email for staff #${ticket.staffId}, skipping MT ticket #${ticket.id}`);
        ticket.alertSent = true;
        await this.mtRepo.save(ticket);
        continue;
      }

      const staffName = await this.resolveStaffName(ticket.staffId);
      await this.mailer.sendSlaAlert({
        to: email,
        staffName,
        type: 'maintenance',
        taskId: ticket.id,
        roomNumber: ticket.roomNumber,
        deadline: ticket.deadline,
        description: `${ticket.facilityType} — ${ticket.issueDescription.slice(0, 120)}`,
      });
      ticket.alertSent = true;
      await this.mtRepo.save(ticket);
    }

    if (actionable.length > 0) {
      this.logger.log(`Sent SLA alerts for ${actionable.length} overdue maintenance ticket(s)`);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private async resolveEmail(userId: number): Promise<string | null> {
    const contact = await this.contactRepo.findOne({ where: { userId } });
    return contact?.email ?? null;
  }

  private async resolveStaffName(userId: number): Promise<string> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['fullName'],
    });
    return user?.fullName ?? `Staff #${userId}`;
  }
}
