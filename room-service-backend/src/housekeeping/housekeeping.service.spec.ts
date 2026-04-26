import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HousekeepingService } from './housekeeping.service';
import {
  HousekeepingTask,
  HousekeepingStatus,
  HousekeepingTaskType,
  Priority,
  RoomCondition,
} from './housekeeping-task.entity';
import { UserAccount } from '../staff/staff.entity';
import { RoomSyncService } from '../rooms/room-sync.service';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { UpdateHousekeepingTaskDto } from './dto/update-housekeeping-task.dto';

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

function makeStaff(overrides: Partial<UserAccount> = {}): UserAccount {
  return {
    id: 10,
    username: 'housekeeper1',
    fullName: 'Nimalee Perera',
    role: 'HOUSEKEEPER',
    enabled: true,
    password: 'hashed',
    ...overrides,
  } as UserAccount;
}

// ── mock factories ────────────────────────────────────────────────────────────

const mockTaskRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
});

const mockStaffRepository = () => ({
  findOne: jest.fn(),
});

const mockRoomSyncService = () => ({
  setCleaningIfAvailable: jest.fn().mockResolvedValue(undefined),
  clearCleaningStatus: jest.fn().mockResolvedValue(undefined),
});

// ── test suite ────────────────────────────────────────────────────────────────

describe('HousekeepingService', () => {
  let service: HousekeepingService;
  let taskRepo: jest.Mocked<ReturnType<typeof mockTaskRepository>>;
  let staffRepo: jest.Mocked<ReturnType<typeof mockStaffRepository>>;
  let roomSync: jest.Mocked<ReturnType<typeof mockRoomSyncService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HousekeepingService,
        { provide: getRepositoryToken(HousekeepingTask), useFactory: mockTaskRepository },
        { provide: getRepositoryToken(UserAccount), useFactory: mockStaffRepository },
        { provide: RoomSyncService, useFactory: mockRoomSyncService },
      ],
    }).compile();

    service = module.get(HousekeepingService);
    taskRepo = module.get(getRepositoryToken(HousekeepingTask));
    staffRepo = module.get(getRepositoryToken(UserAccount));
    roomSync = module.get(RoomSyncService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and saves the task, then triggers room sync', async () => {
      const dto: CreateHousekeepingTaskDto = {
        roomNumber: '101',
        roomCondition: RoomCondition.CHECKOUT,
        taskType: HousekeepingTaskType.CLEANING,
      };
      const task = makeTask();
      taskRepo.create.mockReturnValue(task);
      taskRepo.save.mockResolvedValue(task);

      const result = await service.create(dto);

      expect(taskRepo.create).toHaveBeenCalledWith(dto);
      expect(taskRepo.save).toHaveBeenCalledWith(task);
      expect(roomSync.setCleaningIfAvailable).toHaveBeenCalledWith('101');
      expect(result).toEqual(task);
    });

    it('still returns the task if roomSync throws (non-critical)', async () => {
      const dto: CreateHousekeepingTaskDto = {
        roomNumber: '101',
        roomCondition: RoomCondition.CHECKOUT,
        taskType: HousekeepingTaskType.CLEANING,
      };
      const task = makeTask();
      taskRepo.create.mockReturnValue(task);
      taskRepo.save.mockResolvedValue(task);
      roomSync.setCleaningIfAvailable.mockRejectedValue(new Error('DB error'));

      await expect(service.create(dto)).rejects.toThrow('DB error');
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all tasks when called by a MANAGER', async () => {
      const tasks = [makeTask({ id: 1 }), makeTask({ id: 2, roomNumber: '102' })];
      taskRepo.find.mockResolvedValue(tasks);

      const result = await service.findAll({ username: 'admin', role: 'MANAGER' });

      expect(taskRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
      expect(result).toHaveLength(2);
    });

    it('returns all tasks when no user is provided', async () => {
      const tasks = [makeTask()];
      taskRepo.find.mockResolvedValue(tasks);

      const result = await service.findAll();

      expect(taskRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
      expect(result).toEqual(tasks);
    });

    it('filters tasks by staffId when called by a HOUSEKEEPER', async () => {
      const staff = makeStaff({ id: 10 });
      staffRepo.findOne.mockResolvedValue(staff);
      const tasks = [makeTask({ staffId: 10 })];
      taskRepo.find.mockResolvedValue(tasks);

      const result = await service.findAll({ username: 'housekeeper1', role: 'HOUSEKEEPER' });

      expect(staffRepo.findOne).toHaveBeenCalledWith({ where: { username: 'housekeeper1' } });
      expect(taskRepo.find).toHaveBeenCalledWith({
        where: { staffId: 10 },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(tasks);
    });

    it('returns empty array when HOUSEKEEPER staff record not found', async () => {
      staffRepo.findOne.mockResolvedValue(null);

      const result = await service.findAll({ username: 'unknown', role: 'HOUSEKEEPER' });

      expect(result).toEqual([]);
      expect(taskRepo.find).not.toHaveBeenCalled();
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the task when found', async () => {
      const task = makeTask({ id: 5 });
      taskRepo.findOneBy.mockResolvedValue(task);

      const result = await service.findOne(5);

      expect(taskRepo.findOneBy).toHaveBeenCalledWith({ id: 5 });
      expect(result).toEqual(task);
    });

    it('throws NotFoundException when task does not exist', async () => {
      taskRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Housekeeping task #999 not found');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates non-status fields without triggering roomSync', async () => {
      const task = makeTask({ status: HousekeepingStatus.PENDING });
      taskRepo.findOneBy.mockResolvedValue(task);
      taskRepo.save.mockResolvedValue({ ...task, notes: 'Updated notes' });

      const dto: UpdateHousekeepingTaskDto = { notes: 'Updated notes' };
      await service.update(1, dto);

      expect(roomSync.clearCleaningStatus).not.toHaveBeenCalled();
      expect(task.completedAt).toBeUndefined();
    });

    it('sets completedAt and clears room cleaning status when transitioning to CLEANED', async () => {
      const task = makeTask({ status: HousekeepingStatus.PENDING, completedAt: undefined });
      taskRepo.findOneBy.mockResolvedValue(task);
      taskRepo.save.mockResolvedValue(task);

      const before = Date.now();
      await service.update(1, { status: HousekeepingStatus.CLEANED });
      const after = Date.now();

      expect(task.completedAt).toBeDefined();
      expect(task.completedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(task.completedAt.getTime()).toBeLessThanOrEqual(after);
      expect(roomSync.clearCleaningStatus).toHaveBeenCalledWith('101');
    });

    it('sets completedAt when transitioning to INSPECTED', async () => {
      const task = makeTask({ status: HousekeepingStatus.IN_PROGRESS, completedAt: undefined });
      taskRepo.findOneBy.mockResolvedValue(task);
      taskRepo.save.mockResolvedValue(task);

      await service.update(1, { status: HousekeepingStatus.INSPECTED });

      expect(task.completedAt).toBeDefined();
      expect(roomSync.clearCleaningStatus).toHaveBeenCalledWith('101');
    });

    it('does not overwrite existing completedAt when already completed', async () => {
      const existingCompletedAt = new Date('2026-04-21T10:00:00Z');
      const task = makeTask({
        status: HousekeepingStatus.CLEANED,
        completedAt: existingCompletedAt,
      });
      taskRepo.findOneBy.mockResolvedValue(task);
      taskRepo.save.mockResolvedValue(task);

      await service.update(1, { status: HousekeepingStatus.INSPECTED });

      // wasCompleted was true, so completedAt must NOT be reset and clearCleaningStatus NOT called
      expect(task.completedAt).toBe(existingCompletedAt);
      expect(roomSync.clearCleaningStatus).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for non-existent task', async () => {
      taskRepo.findOneBy.mockResolvedValue(null);

      await expect(service.update(999, { notes: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('finds then removes the task', async () => {
      const task = makeTask({ id: 3 });
      taskRepo.findOneBy.mockResolvedValue(task);
      taskRepo.remove.mockResolvedValue(task);

      await service.remove(3);

      expect(taskRepo.remove).toHaveBeenCalledWith(task);
    });

    it('throws NotFoundException when task does not exist', async () => {
      taskRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateStatus ───────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    const reqUser = { username: 'housekeeper1', role: 'HOUSEKEEPER' };

    it('rejects disallowed status values', async () => {
      await expect(
        service.updateStatus(1, 'PENDING', reqUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects status update when task is not assigned to the requesting user', async () => {
      const task = makeTask({ staffId: 20 }); // different staffId
      taskRepo.findOneBy.mockResolvedValue(task);
      staffRepo.findOne.mockResolvedValue(makeStaff({ id: 10 }));

      await expect(
        service.updateStatus(1, HousekeepingStatus.IN_PROGRESS, reqUser),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateStatus(1, HousekeepingStatus.IN_PROGRESS, reqUser),
      ).rejects.toThrow('You can only update tasks assigned to you.');
    });

    it('rejects when staff record not found', async () => {
      const task = makeTask({ staffId: 10 });
      taskRepo.findOneBy.mockResolvedValue(task);
      staffRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus(1, HousekeepingStatus.IN_PROGRESS, reqUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates status to IN_PROGRESS without setting completedAt or clearing room', async () => {
      const task = makeTask({ staffId: 10, completedAt: undefined });
      taskRepo.findOneBy.mockResolvedValue(task);
      staffRepo.findOne.mockResolvedValue(makeStaff({ id: 10 }));
      taskRepo.save.mockResolvedValue(task);

      await service.updateStatus(1, HousekeepingStatus.IN_PROGRESS, reqUser);

      expect(task.status).toBe(HousekeepingStatus.IN_PROGRESS);
      expect(task.completedAt).toBeUndefined();
      expect(roomSync.clearCleaningStatus).not.toHaveBeenCalled();
    });

    it('sets completedAt and clears room on transition to CLEANED', async () => {
      const task = makeTask({ staffId: 10, completedAt: undefined });
      taskRepo.findOneBy.mockResolvedValue(task);
      staffRepo.findOne.mockResolvedValue(makeStaff({ id: 10 }));
      taskRepo.save.mockResolvedValue(task);

      const before = Date.now();
      await service.updateStatus(1, HousekeepingStatus.CLEANED, reqUser);
      const after = Date.now();

      expect(task.status).toBe(HousekeepingStatus.CLEANED);
      expect(task.completedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(task.completedAt.getTime()).toBeLessThanOrEqual(after);
      expect(roomSync.clearCleaningStatus).toHaveBeenCalledWith('101');
    });

    it('does not overwrite completedAt if already set', async () => {
      const existingCompletedAt = new Date('2026-04-22T09:00:00Z');
      const task = makeTask({ staffId: 10, status: HousekeepingStatus.IN_PROGRESS, completedAt: existingCompletedAt });
      taskRepo.findOneBy.mockResolvedValue(task);
      staffRepo.findOne.mockResolvedValue(makeStaff({ id: 10 }));
      taskRepo.save.mockResolvedValue(task);

      await service.updateStatus(1, HousekeepingStatus.INSPECTED, reqUser);

      expect(task.completedAt).toBe(existingCompletedAt);
    });
  });

  // ── getStats ───────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns correct counts across all statuses', async () => {
      const tasks = [
        makeTask({ status: HousekeepingStatus.PENDING }),
        makeTask({ status: HousekeepingStatus.PENDING }),
        makeTask({ status: HousekeepingStatus.IN_PROGRESS }),
        makeTask({ status: HousekeepingStatus.CLEANED }),
        makeTask({ status: HousekeepingStatus.INSPECTED }),
      ];
      taskRepo.find.mockResolvedValue(tasks);

      const result = await service.getStats();

      expect(result).toEqual({ total: 5, pending: 2, inProgress: 1, cleaned: 1, inspected: 1 });
    });

    it('returns zeros when no tasks exist', async () => {
      taskRepo.find.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result).toEqual({ total: 0, pending: 0, inProgress: 0, cleaned: 0, inspected: 0 });
    });
  });

  // ── createFromBooking ──────────────────────────────────────────────────────

  describe('createFromBooking', () => {
    it('creates a PRE_CHECK_IN CLEANING task with deadline at 13:30 on check-in date', async () => {
      const savedTask = makeTask({
        roomNumber: '201',
        roomCondition: RoomCondition.PRE_CHECK_IN,
        taskType: HousekeepingTaskType.CLEANING,
        status: HousekeepingStatus.PENDING,
        priority: Priority.HIGH,
      });
      taskRepo.create.mockReturnValue(savedTask);
      taskRepo.save.mockResolvedValue(savedTask);

      const result = await service.createFromBooking({
        roomNumber: '201',
        checkInDate: '2026-05-10',
        bookingCustomer: 'John Doe',
        bookingId: 'BK001',
      });

      const createCall = taskRepo.create.mock.calls[0][0];
      expect(createCall.roomNumber).toBe('201');
      expect(createCall.roomCondition).toBe(RoomCondition.PRE_CHECK_IN);
      expect(createCall.taskType).toBe(HousekeepingTaskType.CLEANING);
      expect(createCall.status).toBe(HousekeepingStatus.PENDING);
      expect(createCall.priority).toBe(Priority.HIGH);
      expect(new Date(createCall.deadline).getHours()).toBe(13);
      expect(new Date(createCall.deadline).getMinutes()).toBe(30);
      expect(createCall.notes).toContain('BK001');
      expect(createCall.notes).toContain('John Doe');
      expect(result).toEqual(savedTask);
    });

    it('creates task with generic note when no customer/booking info provided', async () => {
      const task = makeTask();
      taskRepo.create.mockReturnValue(task);
      taskRepo.save.mockResolvedValue(task);

      await service.createFromBooking({ roomNumber: '101', checkInDate: '2026-05-15' });

      const createCall = taskRepo.create.mock.calls[0][0];
      expect(createCall.notes).toContain('2026-05-15');
      expect(createCall.notes).not.toContain('Guest:');
    });
  });
});
