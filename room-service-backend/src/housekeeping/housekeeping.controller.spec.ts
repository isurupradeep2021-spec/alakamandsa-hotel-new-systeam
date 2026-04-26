import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { HousekeepingController } from './housekeeping.controller';
import { HousekeepingService } from './housekeeping.service';
import {
  HousekeepingTask,
  HousekeepingStatus,
  HousekeepingTaskType,
  Priority,
  RoomCondition,
} from './housekeeping-task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<HousekeepingTask> = {}): HousekeepingTask {
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
    createdAt: new Date('2026-04-20T10:00:00Z'),
    updatedAt: new Date('2026-04-20T10:00:00Z'),
    ...overrides,
  } as HousekeepingTask;
}

// ── mock guards (bypass auth in unit tests) ───────────────────────────────────

const allowAllGuard = { canActivate: jest.fn().mockReturnValue(true) };

// ── mock service factory ──────────────────────────────────────────────────────

const mockHousekeepingService = () => ({
  create: jest.fn(),
  createFromBooking: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  updateStatus: jest.fn(),
  getStats: jest.fn(),
});

// ── test suite ────────────────────────────────────────────────────────────────

describe('HousekeepingController', () => {
  let controller: HousekeepingController;
  let service: jest.Mocked<ReturnType<typeof mockHousekeepingService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HousekeepingController],
      providers: [
        { provide: HousekeepingService, useFactory: mockHousekeepingService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAllGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowAllGuard)
      .compile();

    controller = module.get(HousekeepingController);
    service = module.get(HousekeepingService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── POST / ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('calls service.create with the provided DTO and returns the result', async () => {
      const dto = {
        roomNumber: '101',
        roomCondition: RoomCondition.CHECKOUT,
        taskType: HousekeepingTaskType.CLEANING,
      };
      const task = makeTask();
      service.create.mockResolvedValue(task);

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(task);
    });
  });

  // ── POST /booking-trigger ──────────────────────────────────────────────────

  describe('triggerFromBooking', () => {
    it('delegates to service.createFromBooking and returns the new task', async () => {
      const dto = { roomNumber: '201', checkInDate: '2026-05-10', bookingCustomer: 'Jane', bookingId: 'BK99' };
      const task = makeTask({ roomNumber: '201', priority: Priority.HIGH });
      service.createFromBooking.mockResolvedValue(task);

      const result = await controller.triggerFromBooking(dto);

      expect(service.createFromBooking).toHaveBeenCalledWith(dto);
      expect(result).toEqual(task);
    });
  });

  // ── GET / ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('passes req.user to service.findAll and returns the task list', async () => {
      const tasks = [makeTask({ id: 1 }), makeTask({ id: 2, roomNumber: '102' })];
      service.findAll.mockResolvedValue(tasks);
      const req = { user: { username: 'admin', role: 'MANAGER' } };

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(req.user);
      expect(result).toEqual(tasks);
    });

    it('returns empty array when service returns empty', async () => {
      service.findAll.mockResolvedValue([]);
      const result = await controller.findAll({ user: { username: 'hk', role: 'HOUSEKEEPER' } });
      expect(result).toEqual([]);
    });
  });

  // ── GET /stats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns aggregated stats from the service', async () => {
      const stats = { total: 5, pending: 2, inProgress: 1, cleaned: 1, inspected: 1 };
      service.getStats.mockResolvedValue(stats);

      const result = await controller.getStats();

      expect(service.getStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });

  // ── GET /:id ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the task when it exists', async () => {
      const task = makeTask({ id: 7 });
      service.findOne.mockResolvedValue(task);

      const result = await controller.findOne(7);

      expect(service.findOne).toHaveBeenCalledWith(7);
      expect(result).toEqual(task);
    });

    it('propagates NotFoundException from the service', async () => {
      service.findOne.mockRejectedValue(new NotFoundException('Housekeeping task #99 not found'));

      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── PUT /:id ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('calls service.update with id and dto, returns updated task', async () => {
      const dto = { status: HousekeepingStatus.CLEANED };
      const updated = makeTask({ status: HousekeepingStatus.CLEANED, completedAt: new Date() });
      service.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto as any);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException when task is missing', async () => {
      service.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ── PATCH /:id/status ──────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('delegates to service.updateStatus with correct args', async () => {
      const task = makeTask({ status: HousekeepingStatus.IN_PROGRESS });
      service.updateStatus.mockResolvedValue(task);
      const req = { user: { username: 'hk1', role: 'HOUSEKEEPER' } };

      const result = await controller.updateStatus(1, 'IN_PROGRESS', req);

      expect(service.updateStatus).toHaveBeenCalledWith(1, 'IN_PROGRESS', req.user);
      expect(result).toEqual(task);
    });

    it('propagates ForbiddenException when task is not assigned to user', async () => {
      service.updateStatus.mockRejectedValue(
        new ForbiddenException('You can only update tasks assigned to you.'),
      );

      await expect(
        controller.updateStatus(1, 'CLEANED', { user: { username: 'hk2', role: 'HOUSEKEEPER' } }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('propagates ForbiddenException for disallowed status values', async () => {
      service.updateStatus.mockRejectedValue(
        new ForbiddenException('Status must be one of: IN_PROGRESS, CLEANED, INSPECTED'),
      );

      await expect(
        controller.updateStatus(1, 'PENDING', { user: { username: 'hk1', role: 'HOUSEKEEPER' } }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── DELETE /:id ────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('calls service.remove and returns void', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(3);

      expect(service.remove).toHaveBeenCalledWith(3);
      expect(result).toBeUndefined();
    });

    it('propagates NotFoundException when task does not exist', async () => {
      service.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
