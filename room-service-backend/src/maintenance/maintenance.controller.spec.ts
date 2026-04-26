import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import {
  MaintenanceTicket,
  MaintenanceStatus,
  FacilityType,
} from './maintenance-ticket.entity';
import { Priority } from '../housekeeping/housekeeping-task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

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

// ── mock guards ───────────────────────────────────────────────────────────────

const allowAllGuard = { canActivate: jest.fn().mockReturnValue(true) };

// ── mock service factory ──────────────────────────────────────────────────────

const mockMaintenanceService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  updateStatus: jest.fn(),
  getStats: jest.fn(),
  hasActiveMaintenance: jest.fn(),
});

// ── test suite ────────────────────────────────────────────────────────────────

describe('MaintenanceController', () => {
  let controller: MaintenanceController;
  let service: jest.Mocked<ReturnType<typeof mockMaintenanceService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [
        { provide: MaintenanceService, useFactory: mockMaintenanceService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAllGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowAllGuard)
      .compile();

    controller = module.get(MaintenanceController);
    service = module.get(MaintenanceService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── GET /check-room/:roomNumber (public, no auth) ──────────────────────────

  describe('checkRoom', () => {
    it('returns blocked=true when active maintenance exists', async () => {
      service.hasActiveMaintenance.mockResolvedValue({
        blocked: true,
        reason: 'Room 101 has an unresolved maintenance ticket (#1: PLUMBING).',
      });

      const result = await controller.checkRoom('101');

      expect(service.hasActiveMaintenance).toHaveBeenCalledWith('101');
      expect(result.blocked).toBe(true);
    });

    it('returns blocked=false when room is clear', async () => {
      service.hasActiveMaintenance.mockResolvedValue({ blocked: false });

      const result = await controller.checkRoom('102');

      expect(service.hasActiveMaintenance).toHaveBeenCalledWith('102');
      expect(result).toEqual({ blocked: false });
    });
  });

  // ── POST / ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('delegates to service.create and returns the ticket', async () => {
      const dto = {
        roomNumber: '101',
        facilityType: FacilityType.ELECTRICAL,
        issueDescription: 'Blown fuse',
      };
      const ticket = makeTicket({ facilityType: FacilityType.ELECTRICAL });
      service.create.mockResolvedValue(ticket);

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(ticket);
    });
  });

  // ── GET / ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('passes req.user to service.findAll and returns the ticket list', async () => {
      const tickets = [makeTicket({ id: 1 }), makeTicket({ id: 2, roomNumber: '102' })];
      service.findAll.mockResolvedValue(tickets);
      const req = { user: { username: 'admin', role: 'MANAGER' } };

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(req.user);
      expect(result).toEqual(tickets);
    });

    it('returns empty array when no tickets exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll({ user: { username: 'maint1', role: 'MAINTENANCE_STAFF' } });

      expect(result).toEqual([]);
    });
  });

  // ── GET /stats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns aggregated stats from the service', async () => {
      const stats = { total: 6, open: 2, assigned: 1, inProgress: 1, resolved: 1, closed: 1 };
      service.getStats.mockResolvedValue(stats);

      const result = await controller.getStats();

      expect(service.getStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });

  // ── GET /:id ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the ticket when it exists', async () => {
      const ticket = makeTicket({ id: 7 });
      service.findOne.mockResolvedValue(ticket);

      const result = await controller.findOne(7);

      expect(service.findOne).toHaveBeenCalledWith(7);
      expect(result).toEqual(ticket);
    });

    it('propagates NotFoundException from the service', async () => {
      service.findOne.mockRejectedValue(new NotFoundException('Maintenance ticket #99 not found'));

      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── PUT /:id ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('calls service.update with id and dto, returns updated ticket', async () => {
      const dto = { status: MaintenanceStatus.RESOLVED, resolutionNotes: 'Fixed.' };
      const updated = makeTicket({ status: MaintenanceStatus.RESOLVED, resolvedAt: new Date() });
      service.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto as any);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException when ticket is missing', async () => {
      service.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ── PATCH /:id/status ──────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('delegates to service.updateStatus with correct args', async () => {
      const ticket = makeTicket({ status: MaintenanceStatus.IN_PROGRESS });
      service.updateStatus.mockResolvedValue(ticket);
      const req = { user: { username: 'maint1', role: 'MAINTENANCE_STAFF' } };

      const result = await controller.updateStatus(1, 'IN_PROGRESS', req);

      expect(service.updateStatus).toHaveBeenCalledWith(1, 'IN_PROGRESS', req.user);
      expect(result).toEqual(ticket);
    });

    it('propagates ForbiddenException when ticket is not assigned to user', async () => {
      service.updateStatus.mockRejectedValue(
        new ForbiddenException('You can only update tickets assigned to you.'),
      );

      await expect(
        controller.updateStatus(1, 'RESOLVED', { user: { username: 'maint2', role: 'MAINTENANCE_STAFF' } }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('propagates ForbiddenException for disallowed status values', async () => {
      service.updateStatus.mockRejectedValue(
        new ForbiddenException('Status must be one of: IN_PROGRESS, RESOLVED, CLOSED'),
      );

      await expect(
        controller.updateStatus(1, 'OPEN', { user: { username: 'maint1', role: 'MAINTENANCE_STAFF' } }),
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

    it('propagates NotFoundException when ticket does not exist', async () => {
      service.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
