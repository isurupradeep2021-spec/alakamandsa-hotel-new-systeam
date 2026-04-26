import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserAccount, StaffDetail } from './staff/staff.entity';
import { StaffContact } from './staff/staff-contact.entity';
import {
  HousekeepingTask,
  HousekeepingStatus,
  HousekeepingTaskType,
  Priority,
  RoomCondition,
} from './housekeeping/housekeeping-task.entity';
import {
  MaintenanceTicket,
  FacilityType,
  MaintenanceStatus,
} from './maintenance/maintenance-ticket.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    @InjectRepository(StaffDetail)
    private readonly staffDetailRepo: Repository<StaffDetail>,
    @InjectRepository(HousekeepingTask)
    private readonly housekeepingRepo: Repository<HousekeepingTask>,
    @InjectRepository(MaintenanceTicket)
    private readonly maintenanceRepo: Repository<MaintenanceTicket>,
    @InjectRepository(StaffContact)
    private readonly staffContactRepo: Repository<StaffContact>,
  ) {}

  async onApplicationBootstrap() {
    const existingCount = await this.userRepo.count({
      where: { role: In(['HOUSEKEEPER', 'MAINTENANCE_STAFF']) },
    });
    if (existingCount > 0) {
      this.logger.log('Seed data already present, skipping.');
      return;
    }

    this.logger.log('Seeding room-service staff and tickets…');
    const password = await bcrypt.hash('Password@123', 10);

    // ── Housekeepers ────────────────────────────────────────────────────────
    const housekeeperSeed: Array<{ username: string; fullName: string; position: string; salary: number; rate: number; email: string }> = [
      { username: 'nimalee_p',   fullName: 'Nimalee Perera',      position: 'Senior Housekeeper',     salary: 48000, rate: 2000, email: 'nimalee.perera@alakamandsa.lk'    },
      { username: 'sanduni_w',   fullName: 'Sanduni Wickrama',    position: 'Housekeeper',             salary: 42000, rate: 1750, email: 'sanduni.wickrama@alakamandsa.lk'  },
      { username: 'dilrukshi_f', fullName: 'Dilrukshi Fernando',  position: 'Housekeeper',             salary: 42000, rate: 1750, email: 'dilrukshi.fernando@alakamandsa.lk' },
      { username: 'kumari_d',    fullName: 'Kumari Dissanayake',  position: 'Room Attendant',          salary: 38000, rate: 1600, email: 'kumari.dissanayake@alakamandsa.lk' },
      { username: 'chamari_j',   fullName: 'Chamari Jayasinghe',  position: 'Housekeeping Supervisor', salary: 55000, rate: 2300, email: 'chamari.jayasinghe@alakamandsa.lk' },
    ];

    // ── Maintenance Staff ────────────────────────────────────────────────────
    const maintenanceSeed: Array<{ username: string; fullName: string; position: string; salary: number; rate: number; email: string }> = [
      { username: 'ruwan_s',    fullName: 'Ruwan Silva',           position: 'HVAC Technician',        salary: 60000, rate: 2500, email: 'ruwan.silva@alakamandsa.lk'        },
      { username: 'pradeep_k',  fullName: 'Pradeep Kumara',        position: 'Electrician',            salary: 58000, rate: 2400, email: 'pradeep.kumara@alakamandsa.lk'     },
      { username: 'ishanka_s',  fullName: 'Ishanka Senevirathne',  position: 'Plumber',                salary: 54000, rate: 2250, email: 'ishanka@fcodelabs.com'             },
      { username: 'thilina_b',  fullName: 'Thilina Bandara',       position: 'Maintenance Technician', salary: 50000, rate: 2100, email: 'thilina.bandara@alakamandsa.lk'    },
      { username: 'sampath_g',  fullName: 'Sampath Gunasekara',    position: 'General Maintenance',    salary: 46000, rate: 1900, email: 'sampath.gunasekara@alakamandsa.lk' },
    ];

    const savedHousekeepers: UserAccount[] = [];
    const savedMaintenance: UserAccount[] = [];

    for (const s of housekeeperSeed) {
      const user = await this.userRepo.save(
        this.userRepo.create({ username: s.username, password, fullName: s.fullName, role: 'HOUSEKEEPER', enabled: true }),
      );
      await this.staffDetailRepo.save(
        this.staffDetailRepo.create({
          name: s.fullName, position: s.position,
          basicSalary: s.salary, dailyRate: s.rate, overtimeRate: Math.round(s.rate * 1.5),
          attendance: 22, overtimeHours: 4, absentDays: 0, status: 'ACTIVE', userId: user.id,
        }),
      );
      await this.staffContactRepo.save(this.staffContactRepo.create({ userId: user.id, email: s.email }));
      savedHousekeepers.push(user);
    }

    for (const s of maintenanceSeed) {
      const user = await this.userRepo.save(
        this.userRepo.create({ username: s.username, password, fullName: s.fullName, role: 'MAINTENANCE_STAFF', enabled: true }),
      );
      await this.staffDetailRepo.save(
        this.staffDetailRepo.create({
          name: s.fullName, position: s.position,
          basicSalary: s.salary, dailyRate: s.rate, overtimeRate: Math.round(s.rate * 1.5),
          attendance: 21, overtimeHours: 6, absentDays: 1, status: 'ACTIVE', userId: user.id,
        }),
      );
      await this.staffContactRepo.save(this.staffContactRepo.create({ userId: user.id, email: s.email }));
      savedMaintenance.push(user);
    }

    // ── Housekeeping Tasks ───────────────────────────────────────────────────
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
    const daysLater = (d: number) => new Date(now.getTime() + d * 86_400_000);

    const hkTasks: Partial<HousekeepingTask>[] = [
      {
        roomNumber: '101', roomCondition: RoomCondition.CHECKOUT,
        taskType: HousekeepingTaskType.CLEANING, status: HousekeepingStatus.PENDING,
        priority: Priority.HIGH, staffId: savedHousekeepers[0].id,
        deadline: daysLater(0),
        notes: 'Late checkout, deep clean required. Replace all linens.',
        cleaningNotes: undefined,
      },
      {
        roomNumber: '102', roomCondition: RoomCondition.OCCUPIED,
        taskType: HousekeepingTaskType.TURNDOWN, status: HousekeepingStatus.IN_PROGRESS,
        priority: Priority.MEDIUM, staffId: savedHousekeepers[1].id,
        deadline: daysLater(0),
        notes: 'Guest requested extra towels and toiletries.',
        cleaningNotes: undefined,
      },
      {
        roomNumber: '103', roomCondition: RoomCondition.PRE_CHECK_IN,
        taskType: HousekeepingTaskType.INSPECTION, status: HousekeepingStatus.CLEANED,
        priority: Priority.HIGH, staffId: savedHousekeepers[4].id,
        createdAt: daysAgo(3), completedAt: daysAgo(0),
        deadline: daysLater(1),
        notes: 'VIP guest checking in tomorrow. Full inspection required.',
        cleaningNotes: 'Room cleaned and refreshed. Awaiting supervisor inspection.',
      },
      {
        roomNumber: '104', roomCondition: RoomCondition.CHECKOUT,
        taskType: HousekeepingTaskType.CLEANING, status: HousekeepingStatus.INSPECTED,
        priority: Priority.LOW, staffId: savedHousekeepers[2].id,
        createdAt: daysAgo(4), completedAt: daysAgo(2),
        deadline: daysAgo(1),
        notes: 'Standard checkout clean.',
        cleaningNotes: 'Completed. All items checked against inventory.',
      },
      {
        roomNumber: '201', roomCondition: RoomCondition.OCCUPIED,
        taskType: HousekeepingTaskType.CLEANING, status: HousekeepingStatus.PENDING,
        priority: Priority.MEDIUM, staffId: savedHousekeepers[3].id,
        deadline: daysLater(0),
        notes: 'Daily service requested by guest.',
        cleaningNotes: undefined,
      },
      {
        roomNumber: '202', roomCondition: RoomCondition.CHECKOUT,
        taskType: HousekeepingTaskType.CLEANING, status: HousekeepingStatus.IN_PROGRESS,
        priority: Priority.HIGH, staffId: savedHousekeepers[1].id,
        deadline: daysLater(0),
        notes: 'Extended stay guest checked out. Full linen change and bathroom sanitization.',
        cleaningNotes: undefined,
      },
      {
        roomNumber: '203', roomCondition: RoomCondition.PRE_CHECK_IN,
        taskType: HousekeepingTaskType.TURNDOWN, status: HousekeepingStatus.PENDING,
        priority: Priority.MEDIUM, staffId: savedHousekeepers[0].id,
        deadline: daysLater(1),
        notes: 'Suite for honeymoon couple. Place rose petals and welcome note.',
        cleaningNotes: undefined,
      },
      {
        roomNumber: '301', roomCondition: RoomCondition.OCCUPIED,
        taskType: HousekeepingTaskType.INSPECTION, status: HousekeepingStatus.INSPECTED,
        priority: Priority.LOW, staffId: savedHousekeepers[4].id,
        createdAt: daysAgo(5), completedAt: daysAgo(3),
        deadline: daysAgo(2),
        notes: 'Routine weekly inspection.',
        cleaningNotes: 'All items in order. Mini-bar restocked.',
      },
      {
        roomNumber: '302', roomCondition: RoomCondition.CHECKOUT,
        taskType: HousekeepingTaskType.CLEANING, status: HousekeepingStatus.PENDING,
        priority: Priority.HIGH, staffId: savedHousekeepers[2].id,
        deadline: daysLater(0),
        notes: 'Express checkout before 2 PM. Next guest at 3 PM.',
        cleaningNotes: undefined,
      },
      {
        roomNumber: '303', roomCondition: RoomCondition.OCCUPIED,
        taskType: HousekeepingTaskType.TURNDOWN, status: HousekeepingStatus.CLEANED,
        priority: Priority.LOW, staffId: savedHousekeepers[3].id,
        createdAt: daysAgo(1), completedAt: daysAgo(0),
        deadline: daysLater(0),
        notes: 'Business guest — do not disturb until 3 PM.',
        cleaningNotes: 'Evening turndown completed.',
      },
    ];

    // ── Maintenance Tickets ──────────────────────────────────────────────────
    const mTickets: Partial<MaintenanceTicket>[] = [
      {
        roomNumber: '101', facilityType: FacilityType.AC,
        issueDescription: 'Air conditioning unit making a loud rattling noise and not cooling below 26°C.',
        status: MaintenanceStatus.ASSIGNED, priority: Priority.HIGH,
        staffId: savedMaintenance[0].id, deadline: daysLater(1),
        resolutionNotes: undefined, partsUsed: undefined,
      },
      {
        roomNumber: '102', facilityType: FacilityType.PLUMBING,
        issueDescription: 'Bathroom tap dripping continuously. Guest reports water pooling on floor.',
        status: MaintenanceStatus.IN_PROGRESS, priority: Priority.HIGH,
        staffId: savedMaintenance[2].id, deadline: daysLater(0),
        resolutionNotes: undefined, partsUsed: undefined,
      },
      {
        roomNumber: '103', facilityType: FacilityType.ELECTRICAL,
        issueDescription: 'Bedside lamp socket not working. Possible loose wiring in socket outlet.',
        status: MaintenanceStatus.OPEN, priority: Priority.MEDIUM,
        staffId: undefined, deadline: daysLater(2),
        resolutionNotes: undefined, partsUsed: undefined,
      },
      {
        roomNumber: '104', facilityType: FacilityType.FURNITURE,
        issueDescription: 'Wardrobe door hinge broken. Door cannot close properly and is a safety hazard.',
        status: MaintenanceStatus.RESOLVED, priority: Priority.MEDIUM,
        staffId: savedMaintenance[3].id, createdAt: daysAgo(6), deadline: daysAgo(1), resolvedAt: daysAgo(2),
        resolutionNotes: 'Replaced both hinge pins and tightened door frame. Door closes smoothly.',
        partsUsed: '2x 3-inch hinge pins, wood screws',
      },
      {
        roomNumber: '201', facilityType: FacilityType.AC,
        issueDescription: 'AC thermostat unresponsive. Unit turns on but guest cannot change temperature.',
        status: MaintenanceStatus.ASSIGNED, priority: Priority.MEDIUM,
        staffId: savedMaintenance[0].id, deadline: daysLater(1),
        resolutionNotes: undefined, partsUsed: undefined,
      },
      {
        roomNumber: '202', facilityType: FacilityType.PLUMBING,
        issueDescription: 'Shower head has low water pressure. Likely clogged filter.',
        status: MaintenanceStatus.RESOLVED, priority: Priority.LOW,
        staffId: savedMaintenance[2].id, createdAt: daysAgo(9), deadline: daysAgo(3), resolvedAt: daysAgo(4),
        resolutionNotes: 'Cleaned and descaled shower head filter. Pressure restored to normal.',
        partsUsed: 'Descaling solution, replacement filter washer',
      },
      {
        roomNumber: '203', facilityType: FacilityType.ELECTRICAL,
        issueDescription: 'Main room circuit breaker keeps tripping when multiple appliances are used simultaneously.',
        status: MaintenanceStatus.IN_PROGRESS, priority: Priority.HIGH,
        staffId: savedMaintenance[1].id, deadline: daysLater(0),
        resolutionNotes: undefined, partsUsed: undefined,
      },
      {
        roomNumber: '301', facilityType: FacilityType.OTHER,
        issueDescription: 'Balcony sliding door lock faulty. Door cannot be secured from inside.',
        status: MaintenanceStatus.OPEN, priority: Priority.HIGH,
        staffId: undefined, deadline: daysLater(0),
        resolutionNotes: undefined, partsUsed: undefined,
      },
      {
        roomNumber: '302', facilityType: FacilityType.FURNITURE,
        issueDescription: 'Desk chair wheel bracket cracked. Chair is unstable and unsafe to sit on.',
        status: MaintenanceStatus.CLOSED, priority: Priority.LOW,
        staffId: savedMaintenance[4].id, createdAt: daysAgo(12), deadline: daysAgo(5), resolvedAt: daysAgo(6),
        resolutionNotes: 'Chair replaced with spare unit from storage. Damaged chair sent for repair.',
        partsUsed: 'Replacement office chair (spare stock)',
      },
      {
        roomNumber: '303', facilityType: FacilityType.PLUMBING,
        issueDescription: 'Toilet flush mechanism not engaging properly. Requires two attempts to flush.',
        status: MaintenanceStatus.ASSIGNED, priority: Priority.MEDIUM,
        staffId: savedMaintenance[2].id, deadline: daysLater(1),
        resolutionNotes: undefined, partsUsed: undefined,
      },
    ];

    await this.housekeepingRepo.save(hkTasks.map((t) => this.housekeepingRepo.create(t)));
    await this.maintenanceRepo.save(mTickets.map((t) => this.maintenanceRepo.create(t)));

    this.logger.log('Seeding complete: 5 housekeepers, 5 maintenance staff, 10 housekeeping tasks, 10 maintenance tickets.');
  }
}
