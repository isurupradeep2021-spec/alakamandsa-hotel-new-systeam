import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import {
  HousekeepingTask,
  HousekeepingStatus,
  HousekeepingTaskType,
  RoomCondition,
  Priority,
} from '../housekeeping/housekeeping-task.entity';
import {
  MaintenanceTicket,
  MaintenanceStatus,
  FacilityType,
} from '../maintenance/maintenance-ticket.entity';

// ── helpers ───────────────────────────────────────────────────────────────────

const PAST = new Date('2024-01-01T00:00:00Z');  // always in the past  → overdue
const FUTURE = new Date('2030-01-01T00:00:00Z'); // always in the future → not overdue

function makeHkTask(overrides: Partial<HousekeepingTask> = {}): HousekeepingTask {
  return {
    id: 1,
    roomNumber: '101',
    roomCondition: RoomCondition.CHECKOUT,
    taskType: HousekeepingTaskType.CLEANING,
    status: HousekeepingStatus.PENDING,
    priority: Priority.MEDIUM,
    staffId: undefined,
    staff: undefined,
    deadline: undefined,
    notes: undefined,
    cleaningNotes: undefined,
    completedAt: undefined,
    alertSent: false,
    createdAt: new Date('2026-04-01T08:00:00Z'),
    updatedAt: new Date('2026-04-01T08:00:00Z'),
    ...overrides,
  } as HousekeepingTask;
}

function makeMtTicket(overrides: Partial<MaintenanceTicket> = {}): MaintenanceTicket {
  return {
    id: 1,
    roomNumber: '101',
    facilityType: FacilityType.PLUMBING,
    issueDescription: 'Leaking tap',
    status: MaintenanceStatus.OPEN,
    priority: Priority.MEDIUM,
    staffId: undefined,
    staff: undefined,
    deadline: undefined,
    resolutionNotes: undefined,
    partsUsed: undefined,
    resolvedAt: undefined,
    alertSent: false,
    createdAt: new Date('2026-04-01T08:00:00Z'),
    updatedAt: new Date('2026-04-01T08:00:00Z'),
    ...overrides,
  } as MaintenanceTicket;
}

// ── mock factories ────────────────────────────────────────────────────────────

const mockRepository = () => ({
  createQueryBuilder: jest.fn(),
});

// ── test suite ────────────────────────────────────────────────────────────────

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let hkRepo: jest.Mocked<ReturnType<typeof mockRepository>>;
  let mtRepo: jest.Mocked<ReturnType<typeof mockRepository>>;
  let mockHkQb: any;
  let mockMtQb: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(HousekeepingTask), useFactory: mockRepository },
        { provide: getRepositoryToken(MaintenanceTicket), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get(AnalyticsService);
    hkRepo = module.get(getRepositoryToken(HousekeepingTask));
    mtRepo = module.get(getRepositoryToken(MaintenanceTicket));

    // Fresh chainable query builder mocks for each test
    mockHkQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    mockMtQb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    hkRepo.createQueryBuilder.mockReturnValue(mockHkQb);
    mtRepo.createQueryBuilder.mockReturnValue(mockMtQb);
  });

  afterEach(() => jest.clearAllMocks());

  // ── helper to set what the repos return ──────────────────────────────────

  function setupRepos(hkTasks: HousekeepingTask[], mtTickets: MaintenanceTicket[]) {
    mockHkQb.getMany.mockResolvedValue(hkTasks);
    mockMtQb.getMany.mockResolvedValue(mtTickets);
  }

  // ── getMonthlyAnalytics — structure & query builder wiring ────────────────

  describe('getMonthlyAnalytics', () => {
    it('returns the correct period block', async () => {
      setupRepos([], []);
      const result = await service.getMonthlyAnalytics(2026, 4);
      expect(result.period).toEqual({ year: 2026, month: 4 });
    });

    it('builds the query with start/end dates for the given month', async () => {
      setupRepos([], []);
      await service.getMonthlyAnalytics(2026, 4);

      const whereCall = mockHkQb.where.mock.calls[0];
      const { start, end } = whereCall[1];
      expect(start).toEqual(new Date(2026, 3, 1));   // April 1
      expect(end).toEqual(new Date(2026, 4, 1));      // May 1 (exclusive)
    });

    it('result contains housekeeping and maintenance keys', async () => {
      setupRepos([], []);
      const result = await service.getMonthlyAnalytics(2026, 4);
      expect(result).toHaveProperty('housekeeping');
      expect(result).toHaveProperty('maintenance');
    });
  });

  // ── Housekeeping analytics — counts ──────────────────────────────────────

  describe('housekeeping analytics — counts', () => {
    it('returns zeros for empty task list', async () => {
      setupRepos([], []);
      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);
      expect(hk.total).toBe(0);
      expect(hk.completed).toBe(0);
      expect(hk.pending).toBe(0);
      expect(hk.inProgress).toBe(0);
      expect(hk.overdue).toBe(0);
      expect(hk.avgResolutionHours).toBeNull();
      expect(hk.onTimeRate).toBeNull();
    });

    it('counts each status correctly', async () => {
      setupRepos([
        makeHkTask({ status: HousekeepingStatus.PENDING }),
        makeHkTask({ status: HousekeepingStatus.PENDING }),
        makeHkTask({ status: HousekeepingStatus.IN_PROGRESS }),
        makeHkTask({ status: HousekeepingStatus.CLEANED }),
        makeHkTask({ status: HousekeepingStatus.INSPECTED }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.total).toBe(5);
      expect(hk.completed).toBe(2); // CLEANED + INSPECTED
      expect(hk.pending).toBe(2);
      expect(hk.inProgress).toBe(1);
    });
  });

  // ── Housekeeping analytics — avgResolutionHours ───────────────────────────

  describe('housekeeping analytics — avgResolutionHours', () => {
    it('calculates average resolution time in hours', async () => {
      const created = new Date('2026-04-01T08:00:00Z');
      const completed2h = new Date('2026-04-01T10:00:00Z'); // 2 hours later
      const completed4h = new Date('2026-04-01T12:00:00Z'); // 4 hours later

      setupRepos([
        makeHkTask({ status: HousekeepingStatus.CLEANED, createdAt: created, completedAt: completed2h }),
        makeHkTask({ status: HousekeepingStatus.INSPECTED, createdAt: created, completedAt: completed4h }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.avgResolutionHours).toBe(3); // (2 + 4) / 2
    });

    it('rounds avgResolutionHours to 1 decimal place', async () => {
      const created = new Date('2026-04-01T08:00:00Z');
      // 1h + 2h = 3h / 2 = 1.5h
      setupRepos([
        makeHkTask({ status: HousekeepingStatus.CLEANED, createdAt: created, completedAt: new Date('2026-04-01T09:00:00Z') }),
        makeHkTask({ status: HousekeepingStatus.CLEANED, createdAt: created, completedAt: new Date('2026-04-01T10:00:00Z') }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.avgResolutionHours).toBe(1.5);
    });

    it('returns null when no completed tasks have completedAt', async () => {
      setupRepos([
        makeHkTask({ status: HousekeepingStatus.CLEANED, completedAt: undefined }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.avgResolutionHours).toBeNull();
    });
  });

  // ── Housekeeping analytics — overdue & onTimeRate ─────────────────────────

  describe('housekeeping analytics — overdue & onTimeRate', () => {
    it('counts overdue tasks (deadline in past, not completed)', async () => {
      setupRepos([
        makeHkTask({ status: HousekeepingStatus.PENDING, deadline: PAST }),
        makeHkTask({ status: HousekeepingStatus.IN_PROGRESS, deadline: PAST }),
        makeHkTask({ status: HousekeepingStatus.CLEANED, deadline: PAST, completedAt: new Date('2024-01-01T12:00:00Z') }), // completed — not overdue
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.overdue).toBe(2);
    });

    it('does not count tasks with future deadlines as overdue', async () => {
      setupRepos([
        makeHkTask({ status: HousekeepingStatus.PENDING, deadline: FUTURE }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.overdue).toBe(0);
    });

    it('returns null onTimeRate when no tasks have deadlines', async () => {
      setupRepos([
        makeHkTask({ status: HousekeepingStatus.CLEANED }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.onTimeRate).toBeNull();
    });

    it('calculates 100% onTimeRate when all deadline tasks are completed on time', async () => {
      setupRepos([
        makeHkTask({
          status: HousekeepingStatus.CLEANED,
          deadline: FUTURE,
          completedAt: new Date('2026-04-01T10:00:00Z'), // completed before future deadline
        }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.onTimeRate).toBe(100);
    });

    it('reduces onTimeRate when overdue tasks are included in denominator', async () => {
      setupRepos([
        makeHkTask({
          status: HousekeepingStatus.CLEANED,
          deadline: FUTURE,
          completedAt: new Date('2026-04-01T10:00:00Z'),
        }),
        makeHkTask({ status: HousekeepingStatus.PENDING, deadline: PAST }), // overdue, not done
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      // 1 on-time out of 2 eligible → 50%
      expect(hk.onTimeRate).toBe(50);
    });
  });

  // ── Housekeeping analytics — groupings ───────────────────────────────────

  describe('housekeeping analytics — groupings', () => {
    it('groups tasks by taskType', async () => {
      setupRepos([
        makeHkTask({ taskType: HousekeepingTaskType.CLEANING }),
        makeHkTask({ taskType: HousekeepingTaskType.CLEANING }),
        makeHkTask({ taskType: HousekeepingTaskType.INSPECTION }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.byTaskType).toEqual({ CLEANING: 2, INSPECTION: 1 });
    });

    it('groups completed tasks by staff fullName for workload', async () => {
      const staff1 = { fullName: 'Nimalee Perera' } as any;
      const staff2 = { fullName: 'Kamal Silva' } as any;
      setupRepos([
        makeHkTask({ status: HousekeepingStatus.CLEANED, staff: staff1 }),
        makeHkTask({ status: HousekeepingStatus.CLEANED, staff: staff1 }),
        makeHkTask({ status: HousekeepingStatus.INSPECTED, staff: staff2 }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.staffWorkload).toEqual({ 'Nimalee Perera': 2, 'Kamal Silva': 1 });
    });

    it('falls back to "Staff #X" when completed task has no staff relation', async () => {
      setupRepos([
        makeHkTask({ status: HousekeepingStatus.CLEANED, staff: undefined, staffId: 7 }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.staffWorkload).toEqual({ 'Staff #7': 1 });
    });

    it('uses "Unassigned" key when staffId is also missing', async () => {
      setupRepos([
        makeHkTask({ status: HousekeepingStatus.CLEANED, staff: undefined, staffId: undefined }),
      ], []);

      const { housekeeping: hk } = await service.getMonthlyAnalytics(2026, 4);

      expect(hk.staffWorkload).toEqual({ 'Staff #Unassigned': 1 });
    });
  });

  // ── Maintenance analytics — counts ───────────────────────────────────────

  describe('maintenance analytics — counts', () => {
    it('returns zeros for empty ticket list', async () => {
      setupRepos([], []);
      const { maintenance: mt } = await service.getMonthlyAnalytics(2026, 4);
      expect(mt.total).toBe(0);
      expect(mt.resolved).toBe(0);
      expect(mt.open).toBe(0);
      expect(mt.inProgress).toBe(0);
      expect(mt.overdue).toBe(0);
      expect(mt.avgResolutionHours).toBeNull();
      expect(mt.onTimeRate).toBeNull();
    });

    it('counts each status correctly', async () => {
      setupRepos([], [
        makeMtTicket({ status: MaintenanceStatus.OPEN }),
        makeMtTicket({ status: MaintenanceStatus.OPEN }),
        makeMtTicket({ status: MaintenanceStatus.IN_PROGRESS }),
        makeMtTicket({ status: MaintenanceStatus.RESOLVED }),
        makeMtTicket({ status: MaintenanceStatus.CLOSED }),
      ]);

      const { maintenance: mt } = await service.getMonthlyAnalytics(2026, 4);

      expect(mt.total).toBe(5);
      expect(mt.resolved).toBe(2); // RESOLVED + CLOSED
      expect(mt.open).toBe(2);
      expect(mt.inProgress).toBe(1);
    });
  });

  // ── Maintenance analytics — avgResolutionHours ────────────────────────────

  describe('maintenance analytics — avgResolutionHours', () => {
    it('calculates average resolution time from createdAt to resolvedAt', async () => {
      const created = new Date('2026-04-01T08:00:00Z');
      setupRepos([], [
        makeMtTicket({ status: MaintenanceStatus.RESOLVED, createdAt: created, resolvedAt: new Date('2026-04-01T14:00:00Z') }), // 6h
        makeMtTicket({ status: MaintenanceStatus.CLOSED,   createdAt: created, resolvedAt: new Date('2026-04-01T10:00:00Z') }), // 2h
      ]);

      const { maintenance: mt } = await service.getMonthlyAnalytics(2026, 4);

      expect(mt.avgResolutionHours).toBe(4); // (6 + 2) / 2
    });

    it('returns null when no resolved tickets have resolvedAt', async () => {
      setupRepos([], [
        makeMtTicket({ status: MaintenanceStatus.RESOLVED, resolvedAt: undefined }),
      ]);

      const { maintenance: mt } = await service.getMonthlyAnalytics(2026, 4);

      expect(mt.avgResolutionHours).toBeNull();
    });
  });

  // ── Maintenance analytics — overdue, onTimeRate, recurringRooms ──────────

  describe('maintenance analytics — overdue & onTimeRate', () => {
    it('counts overdue tickets (past deadline, not resolved/closed)', async () => {
      setupRepos([], [
        makeMtTicket({ status: MaintenanceStatus.OPEN, deadline: PAST }),
        makeMtTicket({ status: MaintenanceStatus.IN_PROGRESS, deadline: PAST }),
        makeMtTicket({ status: MaintenanceStatus.RESOLVED, deadline: PAST, resolvedAt: new Date('2024-01-01T12:00:00Z') }),
      ]);

      const { maintenance: mt } = await service.getMonthlyAnalytics(2026, 4);

      expect(mt.overdue).toBe(2);
    });

    it('calculates 100% onTimeRate when resolved before deadline', async () => {
      setupRepos([], [
        makeMtTicket({
          status: MaintenanceStatus.RESOLVED,
          deadline: FUTURE,
          resolvedAt: new Date('2026-04-01T10:00:00Z'),
        }),
      ]);

      const { maintenance: mt } = await service.getMonthlyAnalytics(2026, 4);

      expect(mt.onTimeRate).toBe(100);
    });

    it('returns null onTimeRate when no tickets have deadlines', async () => {
      setupRepos([], [makeMtTicket({ status: MaintenanceStatus.RESOLVED })]);

      const { maintenance: mt } = await service.getMonthlyAnalytics(2026, 4);

      expect(mt.onTimeRate).toBeNull();
    });
  });

  describe('maintenance analytics — recurringRooms', () => {
    it('only includes rooms with more than one ticket', async () => {
      setupRepos([], [
        makeMtTicket({ id: 1, roomNumber: '101' }),
        makeMtTicket({ id: 2, roomNumber: '101' }),
        makeMtTicket({ id: 3, roomNumber: '101' }),
        makeMtTicket({ id: 4, roomNumber: '202' }), // only 1 — should NOT appear
      ]);

      const { maintenance: mt } = await service.getMonthlyAnalytics(2026, 4);

      expect(mt.recurringRooms).toHaveLength(1);
      expect(mt.recurringRooms[0]).toEqual({ room: '101', count: 3 });
    });

    it('sorts recurring rooms by count descending', async () => {
      setupRepos([], [
        makeMtTicket({ id: 1, roomNumber: '201' }),
        makeMtTicket({ id: 2, roomNumber: '201' }),
        makeMtTicket({ id: 3, roomNumber: '101' }),
        makeMtTicket({ id: 4, roomNumber: '101' }),
        makeMtTicket({ id: 5, roomNumber: '101' }),
      ]);

      const { maintenance: mt } = await service.getMonthlyAnalytics(2026, 4);

      expect(mt.recurringRooms[0].room).toBe('101');
      expect(mt.recurringRooms[0].count).toBe(3);
      expect(mt.recurringRooms[1].room).toBe('201');
    });

    it('returns empty recurringRooms when no room has more than one ticket', async () => {
      setupRepos([], [
        makeMtTicket({ id: 1, roomNumber: '101' }),
        makeMtTicket({ id: 2, roomNumber: '202' }),
      ]);

      const { maintenance: mt } = await service.getMonthlyAnalytics(2026, 4);

      expect(mt.recurringRooms).toEqual([]);
    });
  });

  // ── getTrendAnalytics ─────────────────────────────────────────────────────

  describe('getTrendAnalytics', () => {
    it('returns the correct number of monthly results', async () => {
      setupRepos([], []);
      // repos are called multiple times; configure getMany for all calls
      mockHkQb.getMany.mockResolvedValue([]);
      mockMtQb.getMany.mockResolvedValue([]);

      const result = await service.getTrendAnalytics(3);

      expect(result).toHaveLength(3);
    });

    it('defaults to 6 months when no argument is given', async () => {
      setupRepos([], []);
      mockHkQb.getMany.mockResolvedValue([]);
      mockMtQb.getMany.mockResolvedValue([]);

      const result = await service.getTrendAnalytics();

      expect(result).toHaveLength(6);
    });

    it('last result corresponds to the current month', async () => {
      setupRepos([], []);
      mockHkQb.getMany.mockResolvedValue([]);
      mockMtQb.getMany.mockResolvedValue([]);

      const now = new Date();
      const result = await service.getTrendAnalytics(3);
      const last = result.at(-1);

      expect(last.period.year).toBe(now.getFullYear());
      expect(last.period.month).toBe(now.getMonth() + 1);
    });
  });
});
