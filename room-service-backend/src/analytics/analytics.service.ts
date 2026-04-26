import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HousekeepingTask,
  HousekeepingStatus,
} from '../housekeeping/housekeeping-task.entity';
import {
  MaintenanceTicket,
  MaintenanceStatus,
} from '../maintenance/maintenance-ticket.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(HousekeepingTask)
    private readonly hkRepo: Repository<HousekeepingTask>,
    @InjectRepository(MaintenanceTicket)
    private readonly mtRepo: Repository<MaintenanceTicket>,
  ) {}

  async getMonthlyAnalytics(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const [hkTasks, mtTickets] = await Promise.all([
      this.hkRepo
        .createQueryBuilder('t')
        .where('t.createdAt >= :start AND t.createdAt < :end', { start, end })
        .getMany(),
      this.mtRepo
        .createQueryBuilder('t')
        .where('t.createdAt >= :start AND t.createdAt < :end', { start, end })
        .getMany(),
    ]);

    return {
      period: { year, month },
      housekeeping: this.buildHousekeepingAnalytics(hkTasks),
      maintenance: this.buildMaintenanceAnalytics(mtTickets),
    };
  }

  async getTrendAnalytics(months = 6) {
    const results: Awaited<ReturnType<typeof this.getMonthlyAnalytics>>[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const data = await this.getMonthlyAnalytics(d.getFullYear(), d.getMonth() + 1);
      results.push(data);
    }
    return results;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildHousekeepingAnalytics(tasks: HousekeepingTask[]) {
    const total = tasks.length;
    const completed = tasks.filter((t) =>
      [HousekeepingStatus.CLEANED, HousekeepingStatus.INSPECTED].includes(t.status),
    );
    const pending = tasks.filter((t) => t.status === HousekeepingStatus.PENDING).length;
    const inProgress = tasks.filter((t) => t.status === HousekeepingStatus.IN_PROGRESS).length;

    // Avg resolution time in hours (createdAt → completedAt)
    const resolutionTimes = completed
      .filter((t) => t.completedAt && t.createdAt)
      .map((t) => (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) / 3_600_000);
    const avgResolutionHours =
      resolutionTimes.length > 0
        ? Math.round((resolutionTimes.reduce((s, v) => s + v, 0) / resolutionTimes.length) * 10) / 10
        : null;

    // On-time rate: completed before deadline
    const withDeadline = completed.filter((t) => t.deadline && t.completedAt);
    const onTime = withDeadline.filter(
      (t) => new Date(t.completedAt) <= new Date(t.deadline),
    ).length;
    const onTimeRate =
      withDeadline.length > 0 ? Math.round((onTime / withDeadline.length) * 100) : null;

    // Overdue: deadline passed but not completed
    const now = new Date();
    const overdue = tasks.filter(
      (t) =>
        t.deadline &&
        new Date(t.deadline) < now &&
        ![HousekeepingStatus.CLEANED, HousekeepingStatus.INSPECTED].includes(t.status),
    ).length;

    // Breakdown by task type
    const byTaskType = this.countByField(tasks, 'taskType');

    // Breakdown by room condition
    const byRoomCondition = this.countByField(tasks, 'roomCondition');

    // Breakdown by priority
    const byPriority = this.countByField(tasks, 'priority');

    // Staff workload (completed tasks per staff name)
    const staffWorkload = completed.reduce<Record<string, number>>((acc, t) => {
      const name = (t.staff as any)?.fullName ?? `Staff #${t.staffId ?? 'Unassigned'}`;
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total,
      completed: completed.length,
      pending,
      inProgress,
      overdue,
      avgResolutionHours,
      onTimeRate,
      byTaskType,
      byRoomCondition,
      byPriority,
      staffWorkload,
    };
  }

  private buildMaintenanceAnalytics(tickets: MaintenanceTicket[]) {
    const total = tickets.length;
    const resolved = tickets.filter((t) =>
      [MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED].includes(t.status),
    );
    const open = tickets.filter((t) => t.status === MaintenanceStatus.OPEN).length;
    const inProgress = tickets.filter((t) => t.status === MaintenanceStatus.IN_PROGRESS).length;

    // Avg resolution time in hours
    const resolutionTimes = resolved
      .filter((t) => t.resolvedAt && t.createdAt)
      .map((t) => (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 3_600_000);
    const avgResolutionHours =
      resolutionTimes.length > 0
        ? Math.round((resolutionTimes.reduce((s, v) => s + v, 0) / resolutionTimes.length) * 10) / 10
        : null;

    // SLA breach: deadline passed but not resolved/closed
    const now = new Date();
    const slaBreaches = tickets.filter(
      (t) =>
        t.deadline &&
        new Date(t.deadline) < now &&
        ![MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED].includes(t.status),
    ).length;

    // Recurring faults: group by facilityType
    const byFacilityType = this.countByField(tickets, 'facilityType');

    // Recurring faults: group by roomNumber (top rooms)
    const byRoom = this.countByField(tickets, 'roomNumber');
    const recurringRooms = Object.entries(byRoom)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([room, count]) => ({ room, count }));

    // Breakdown by priority
    const byPriority = this.countByField(tickets, 'priority');

    // Staff workload (resolved tickets per staff name)
    const staffWorkload = resolved.reduce<Record<string, number>>((acc, t) => {
      const name = (t.staff as any)?.fullName ?? `Staff #${t.staffId ?? 'Unassigned'}`;
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total,
      resolved: resolved.length,
      open,
      inProgress,
      slaBreaches,
      avgResolutionHours,
      byFacilityType,
      byPriority,
      recurringRooms,
      staffWorkload,
    };
  }

  private countByField<T>(items: T[], field: keyof T): Record<string, number> {
    return items.reduce<Record<string, number>>((acc, item) => {
      const val = item[field];
      const key = (val !== null && val !== undefined) ? (val as unknown as string | number).toString() : 'UNASSIGNED';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }
}
