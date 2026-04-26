import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MaintenanceService } from './maintenance.service';
import {
  MaintenanceTicket,
  MaintenanceStatus,
  FacilityType,
} from './maintenance-ticket.entity';
import { Priority } from '../housekeeping/housekeeping-task.entity';
import { UserAccount } from '../staff/staff.entity';
import { RoomSyncService } from '../rooms/room-sync.service';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from './dto/update-maintenance-ticket.dto';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTicket(overrides: Partial<MaintenanceTicket> = {}): MaintenanceTicket {
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
    createdAt: new Date('2026-04-20T10:00:00Z'),
    updatedAt: new Date('2026-04-20T10:00:00Z'),
    ...overrides,
  } as MaintenanceTicket;
}

function makeStaff(overrides: Partial<UserAccount> = {}): UserAccount {
  return {
    id: 10,
    username: 'maint1',
    fullName: 'Rajan Silva',
    role: 'MAINTENANCE_STAFF',
    enabled: true,
    password: 'hashed',
    ...overrides,
  } as UserAccount;
}

// ── mock factories ────────────────────────────────────────────────────────────

const mockTicketRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
});

const mockStaffRepository = () => ({
  findOne: jest.fn(),
});

const mockRoomSyncService = () => ({
  setMaintenanceIfAvailable: jest.fn().mockResolvedValue(undefined),
  clearMaintenanceStatus: jest.fn().mockResolvedValue(undefined),
});

// ── test suite ────────────────────────────────────────────────────────────────

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let ticketRepo: jest.Mocked<ReturnType<typeof mockTicketRepository>>;
  let staffRepo: jest.Mocked<ReturnType<typeof mockStaffRepository>>;
  let roomSync: jest.Mocked<ReturnType<typeof mockRoomSyncService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        { provide: getRepositoryToken(MaintenanceTicket), useFactory: mockTicketRepository },
        { provide: getRepositoryToken(UserAccount), useFactory: mockStaffRepository },
        { provide: RoomSyncService, useFactory: mockRoomSyncService },
      ],
    }).compile();

    service = module.get(MaintenanceService);
    ticketRepo = module.get(getRepositoryToken(MaintenanceTicket));
    staffRepo = module.get(getRepositoryToken(UserAccount));
    roomSync = module.get(RoomSyncService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates and saves the ticket, then triggers room sync', async () => {
      const dto: CreateMaintenanceTicketDto = {
        roomNumber: '101',
        facilityType: FacilityType.PLUMBING,
        issueDescription: 'Leaking tap',
      };
      const ticket = makeTicket();
      ticketRepo.create.mockReturnValue(ticket);
      ticketRepo.save.mockResolvedValue(ticket);

      const result = await service.create(dto);

      expect(ticketRepo.create).toHaveBeenCalledWith(dto);
      expect(ticketRepo.save).toHaveBeenCalledWith(ticket);
      expect(roomSync.setMaintenanceIfAvailable).toHaveBeenCalledWith('101');
      expect(result).toEqual(ticket);
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all tickets when called by a MANAGER', async () => {
      const tickets = [makeTicket({ id: 1 }), makeTicket({ id: 2, roomNumber: '102' })];
      ticketRepo.find.mockResolvedValue(tickets);

      const result = await service.findAll({ username: 'admin', role: 'MANAGER' });

      expect(ticketRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
      expect(result).toHaveLength(2);
    });

    it('returns all tickets when no user is provided', async () => {
      const tickets = [makeTicket()];
      ticketRepo.find.mockResolvedValue(tickets);

      const result = await service.findAll();

      expect(ticketRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
      expect(result).toEqual(tickets);
    });

    it('filters by staffId when called by MAINTENANCE_STAFF', async () => {
      const staff = makeStaff({ id: 10 });
      staffRepo.findOne.mockResolvedValue(staff);
      const tickets = [makeTicket({ staffId: 10 })];
      ticketRepo.find.mockResolvedValue(tickets);

      const result = await service.findAll({ username: 'maint1', role: 'MAINTENANCE_STAFF' });

      expect(staffRepo.findOne).toHaveBeenCalledWith({ where: { username: 'maint1' } });
      expect(ticketRepo.find).toHaveBeenCalledWith({
        where: { staffId: 10 },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(tickets);
    });

    it('returns empty array when MAINTENANCE_STAFF record not found', async () => {
      staffRepo.findOne.mockResolvedValue(null);

      const result = await service.findAll({ username: 'unknown', role: 'MAINTENANCE_STAFF' });

      expect(result).toEqual([]);
      expect(ticketRepo.find).not.toHaveBeenCalled();
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the ticket when found', async () => {
      const ticket = makeTicket({ id: 5 });
      ticketRepo.findOneBy.mockResolvedValue(ticket);

      const result = await service.findOne(5);

      expect(ticketRepo.findOneBy).toHaveBeenCalledWith({ id: 5 });
      expect(result).toEqual(ticket);
    });

    it('throws NotFoundException when ticket does not exist', async () => {
      ticketRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Maintenance ticket #999 not found');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates fields without calling clearMaintenance for non-resolved status', async () => {
      const ticket = makeTicket({ status: MaintenanceStatus.OPEN });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      ticketRepo.save.mockResolvedValue(ticket);

      await service.update(1, { priority: Priority.HIGH } as UpdateMaintenanceTicketDto);

      expect(roomSync.clearMaintenanceStatus).not.toHaveBeenCalled();
      expect(ticket.resolvedAt).toBeUndefined();
    });

    it('sets resolvedAt and clears room maintenance when transitioning to RESOLVED', async () => {
      const ticket = makeTicket({ status: MaintenanceStatus.IN_PROGRESS, resolvedAt: undefined });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      // No other active tickets for the room
      ticketRepo.find.mockResolvedValue([ticket]);
      ticketRepo.save.mockResolvedValue(ticket);

      const before = Date.now();
      await service.update(1, { status: MaintenanceStatus.RESOLVED } as UpdateMaintenanceTicketDto);
      const after = Date.now();

      expect(ticket.resolvedAt).toBeDefined();
      expect(ticket.resolvedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(ticket.resolvedAt.getTime()).toBeLessThanOrEqual(after);
      expect(roomSync.clearMaintenanceStatus).toHaveBeenCalledWith('101');
    });

    it('sets resolvedAt and clears room when transitioning to CLOSED', async () => {
      const ticket = makeTicket({ status: MaintenanceStatus.IN_PROGRESS, resolvedAt: undefined });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      ticketRepo.find.mockResolvedValue([ticket]);
      ticketRepo.save.mockResolvedValue(ticket);

      await service.update(1, { status: MaintenanceStatus.CLOSED } as UpdateMaintenanceTicketDto);

      expect(ticket.resolvedAt).toBeDefined();
      expect(roomSync.clearMaintenanceStatus).toHaveBeenCalledWith('101');
    });

    it('does NOT clear room if another active ticket exists for the same room', async () => {
      const ticket = makeTicket({ id: 1, status: MaintenanceStatus.OPEN, resolvedAt: undefined });
      const otherTicket = makeTicket({ id: 2, status: MaintenanceStatus.OPEN });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      ticketRepo.find.mockResolvedValue([ticket, otherTicket]);
      ticketRepo.save.mockResolvedValue(ticket);

      await service.update(1, { status: MaintenanceStatus.RESOLVED } as UpdateMaintenanceTicketDto);

      expect(roomSync.clearMaintenanceStatus).not.toHaveBeenCalled();
    });

    it('does not overwrite resolvedAt when already resolved', async () => {
      const existingResolvedAt = new Date('2026-04-21T10:00:00Z');
      const ticket = makeTicket({ status: MaintenanceStatus.RESOLVED, resolvedAt: existingResolvedAt });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      ticketRepo.save.mockResolvedValue(ticket);

      await service.update(1, { status: MaintenanceStatus.CLOSED } as UpdateMaintenanceTicketDto);

      // wasResolved was true, so resolvedAt must NOT be reset and clearMaintenance NOT called
      expect(ticket.resolvedAt).toBe(existingResolvedAt);
      expect(roomSync.clearMaintenanceStatus).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for non-existent ticket', async () => {
      ticketRepo.findOneBy.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('finds then removes the ticket', async () => {
      const ticket = makeTicket({ id: 3 });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      ticketRepo.remove.mockResolvedValue(ticket);

      await service.remove(3);

      expect(ticketRepo.remove).toHaveBeenCalledWith(ticket);
    });

    it('throws NotFoundException when ticket does not exist', async () => {
      ticketRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateStatus ───────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    const reqUser = { username: 'maint1', role: 'MAINTENANCE_STAFF' };

    it('rejects disallowed status values (e.g. OPEN)', async () => {
      await expect(
        service.updateStatus(1, 'OPEN', reqUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects disallowed status values (e.g. ASSIGNED)', async () => {
      await expect(
        service.updateStatus(1, 'ASSIGNED', reqUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when ticket is not assigned to the requesting user', async () => {
      const ticket = makeTicket({ staffId: 20 });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      staffRepo.findOne.mockResolvedValue(makeStaff({ id: 10 }));

      await expect(
        service.updateStatus(1, MaintenanceStatus.IN_PROGRESS, reqUser),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateStatus(1, MaintenanceStatus.IN_PROGRESS, reqUser),
      ).rejects.toThrow('You can only update tickets assigned to you.');
    });

    it('throws ForbiddenException when staff record not found', async () => {
      ticketRepo.findOneBy.mockResolvedValue(makeTicket({ staffId: 10 }));
      staffRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus(1, MaintenanceStatus.IN_PROGRESS, reqUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates status to IN_PROGRESS without setting resolvedAt or clearing room', async () => {
      const ticket = makeTicket({ staffId: 10, resolvedAt: undefined });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      staffRepo.findOne.mockResolvedValue(makeStaff({ id: 10 }));
      ticketRepo.save.mockResolvedValue(ticket);

      await service.updateStatus(1, MaintenanceStatus.IN_PROGRESS, reqUser);

      expect(ticket.status).toBe(MaintenanceStatus.IN_PROGRESS);
      expect(ticket.resolvedAt).toBeUndefined();
      expect(roomSync.clearMaintenanceStatus).not.toHaveBeenCalled();
    });

    it('sets resolvedAt and clears room on transition to RESOLVED', async () => {
      const ticket = makeTicket({ staffId: 10, resolvedAt: undefined });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      staffRepo.findOne.mockResolvedValue(makeStaff({ id: 10 }));
      ticketRepo.save.mockResolvedValue(ticket);
      // No other active tickets
      ticketRepo.find.mockResolvedValue([ticket]);

      const before = Date.now();
      await service.updateStatus(1, MaintenanceStatus.RESOLVED, reqUser);
      const after = Date.now();

      expect(ticket.status).toBe(MaintenanceStatus.RESOLVED);
      expect(ticket.resolvedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(ticket.resolvedAt.getTime()).toBeLessThanOrEqual(after);
      expect(roomSync.clearMaintenanceStatus).toHaveBeenCalledWith('101');
    });

    it('does not overwrite resolvedAt if already set', async () => {
      const existingResolvedAt = new Date('2026-04-22T09:00:00Z');
      const ticket = makeTicket({
        staffId: 10,
        status: MaintenanceStatus.IN_PROGRESS,
        resolvedAt: existingResolvedAt,
      });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      staffRepo.findOne.mockResolvedValue(makeStaff({ id: 10 }));
      ticketRepo.save.mockResolvedValue(ticket);
      ticketRepo.find.mockResolvedValue([ticket]);

      await service.updateStatus(1, MaintenanceStatus.RESOLVED, reqUser);

      expect(ticket.resolvedAt).toBe(existingResolvedAt);
    });

    it('does NOT clear room if another active ticket still exists', async () => {
      const ticket = makeTicket({ id: 1, staffId: 10, resolvedAt: undefined });
      const otherTicket = makeTicket({ id: 2, status: MaintenanceStatus.OPEN });
      ticketRepo.findOneBy.mockResolvedValue(ticket);
      staffRepo.findOne.mockResolvedValue(makeStaff({ id: 10 }));
      ticketRepo.save.mockResolvedValue(ticket);
      ticketRepo.find.mockResolvedValue([ticket, otherTicket]);

      await service.updateStatus(1, MaintenanceStatus.RESOLVED, reqUser);

      expect(roomSync.clearMaintenanceStatus).not.toHaveBeenCalled();
    });
  });

  // ── getStats ───────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns correct counts across all statuses', async () => {
      const tickets = [
        makeTicket({ status: MaintenanceStatus.OPEN }),
        makeTicket({ status: MaintenanceStatus.OPEN }),
        makeTicket({ status: MaintenanceStatus.ASSIGNED }),
        makeTicket({ status: MaintenanceStatus.IN_PROGRESS }),
        makeTicket({ status: MaintenanceStatus.RESOLVED }),
        makeTicket({ status: MaintenanceStatus.CLOSED }),
      ];
      ticketRepo.find.mockResolvedValue(tickets);

      const result = await service.getStats();

      expect(result).toEqual({
        total: 6,
        open: 2,
        assigned: 1,
        inProgress: 1,
        resolved: 1,
        closed: 1,
      });
    });

    it('returns zeros when no tickets exist', async () => {
      ticketRepo.find.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result).toEqual({ total: 0, open: 0, assigned: 0, inProgress: 0, resolved: 0, closed: 0 });
    });
  });

  // ── hasActiveMaintenance ───────────────────────────────────────────────────

  describe('hasActiveMaintenance', () => {
    it('returns blocked=true when an active (non-resolved, non-closed) ticket exists', async () => {
      ticketRepo.findOne.mockResolvedValue(
        makeTicket({ id: 7, status: MaintenanceStatus.IN_PROGRESS, facilityType: FacilityType.AC }),
      );

      const result = await service.hasActiveMaintenance('101');

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('101');
      expect(result.reason).toContain('#7');
    });

    it('returns blocked=false when no active ticket exists', async () => {
      ticketRepo.findOne.mockResolvedValue(null);

      const result = await service.hasActiveMaintenance('101');

      expect(result).toEqual({ blocked: false });
    });

    it('returns blocked=false when only a CLOSED ticket is found', async () => {
      // TypeORM Not() only excludes RESOLVED, so CLOSED can still be returned by the query.
      // The service filters it out in memory.
      ticketRepo.findOne.mockResolvedValue(
        makeTicket({ status: MaintenanceStatus.CLOSED }),
      );

      const result = await service.hasActiveMaintenance('101');

      expect(result).toEqual({ blocked: false });
    });
  });
});
