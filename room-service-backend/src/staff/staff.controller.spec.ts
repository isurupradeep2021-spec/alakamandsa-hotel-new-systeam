import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffRole } from './staff.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeStaffResult(overrides: Partial<any> = {}): any {
  return {
    id: 1,
    username: 'hk1',
    fullName: 'Nimalee Perera',
    role: StaffRole.HOUSEKEEPER,
    enabled: true,
    email: 'nimalee@example.com',
    staffDetail: { id: 10, basicSalary: 50000 },
    ...overrides,
  };
}

// ── mock guards ───────────────────────────────────────────────────────────────

const allowAllGuard = { canActivate: jest.fn().mockReturnValue(true) };

// ── mock service factory ──────────────────────────────────────────────────────

const mockStaffService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

// ── test suite ────────────────────────────────────────────────────────────────

describe('StaffController', () => {
  let controller: StaffController;
  let service: jest.Mocked<ReturnType<typeof mockStaffService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffController],
      providers: [
        { provide: StaffService, useFactory: mockStaffService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAllGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowAllGuard)
      .compile();

    controller = module.get(StaffController);
    service = module.get(StaffService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── POST / ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('delegates to service.create and returns the result', async () => {
      const dto = {
        username: 'hk1',
        password: 'secret',
        fullName: 'Nimalee Perera',
        role: StaffRole.HOUSEKEEPER,
        email: 'nimalee@example.com',
      };
      const expected = makeStaffResult();
      service.create.mockResolvedValue(expected);

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  // ── GET / ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns the full staff list from the service', async () => {
      const staff = [makeStaffResult({ id: 1 }), makeStaffResult({ id: 2, username: 'mt1' })];
      service.findAll.mockResolvedValue(staff);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(staff);
    });

    it('returns empty array when no staff exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  // ── GET /:id ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the staff member when found', async () => {
      const member = makeStaffResult({ id: 5 });
      service.findOne.mockResolvedValue(member);

      const result = await controller.findOne(5);

      expect(service.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(member);
    });

    it('propagates NotFoundException from the service', async () => {
      service.findOne.mockRejectedValue(new NotFoundException('Staff #99 not found'));

      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── PUT /:id ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('calls service.update with id and dto, returns updated member', async () => {
      const dto = { fullName: 'Updated Name', basicSalary: 75000 };
      const updated = makeStaffResult({ fullName: 'Updated Name' });
      service.update.mockResolvedValue(updated);

      const result = await controller.update(1, dto as any);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updated);
    });

    it('propagates NotFoundException when staff member is not found', async () => {
      service.update.mockRejectedValue(new NotFoundException('Staff #999 not found'));

      await expect(controller.update(999, {} as any)).rejects.toThrow(NotFoundException);
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

    it('propagates NotFoundException when staff member does not exist', async () => {
      service.remove.mockRejectedValue(new NotFoundException('Staff #999 not found'));

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
