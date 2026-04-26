import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { StaffService } from './staff.service';
import { UserAccount, StaffDetail, StaffRole } from './staff.entity';
import { StaffContact } from './staff-contact.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<UserAccount> = {}): UserAccount {
  return {
    id: 1,
    username: 'hk1',
    password: 'hashed',
    fullName: 'Nimalee Perera',
    role: StaffRole.HOUSEKEEPER,
    enabled: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as UserAccount;
}

function makeDetail(overrides: Partial<StaffDetail> = {}): StaffDetail {
  return {
    id: 10,
    name: 'Nimalee Perera',
    position: 'housekeeper',
    basicSalary: 50000,
    attendance: 0,
    overtimeHours: 0,
    absentDays: 0,
    overtimeRate: 0,
    dailyRate: 0,
    status: 'ACTIVE',
    userId: 1,
    ...overrides,
  } as unknown as StaffDetail;
}

function makeContact(overrides: Partial<StaffContact> = {}): StaffContact {
  return {
    id: 100,
    userId: 1,
    email: 'nimalee@example.com',
    ...overrides,
  } as StaffContact;
}

// ── mock factories ────────────────────────────────────────────────────────────

const mockDataSource = () => ({
  query: jest.fn().mockResolvedValue(undefined),
});

const makeRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

// ── test suite ────────────────────────────────────────────────────────────────

describe('StaffService', () => {
  let service: StaffService;
  let userRepo: jest.Mocked<ReturnType<typeof makeRepo>>;
  let staffRepo: jest.Mocked<ReturnType<typeof makeRepo>>;
  let contactRepo: jest.Mocked<ReturnType<typeof makeRepo>>;
  let dataSource: jest.Mocked<ReturnType<typeof mockDataSource>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: getRepositoryToken(UserAccount), useFactory: makeRepo },
        { provide: getRepositoryToken(StaffDetail), useFactory: makeRepo },
        { provide: getRepositoryToken(StaffContact), useFactory: makeRepo },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get(StaffService);
    userRepo = module.get(getRepositoryToken(UserAccount));
    staffRepo = module.get(getRepositoryToken(StaffDetail));
    contactRepo = module.get(getRepositoryToken(StaffContact));
    dataSource = module.get(DataSource);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateStaffDto = {
      username: 'hk1',
      password: 'secret',
      fullName: 'Nimalee Perera',
      role: StaffRole.HOUSEKEEPER,
      email: 'nimalee@example.com',
    };

    it('hashes the password before saving', async () => {
      const user = makeUser();
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);
      const detail = makeDetail();
      staffRepo.create.mockReturnValue(detail);
      staffRepo.save.mockResolvedValue(detail);
      contactRepo.findOne.mockResolvedValue(null);
      contactRepo.create.mockReturnValue(makeContact());
      contactRepo.save.mockResolvedValue(makeContact());

      await service.create(dto);

      const savedUserArg = userRepo.create.mock.calls[0][0] as any;
      expect(savedUserArg.password).not.toBe('secret');
      expect(await bcrypt.compare('secret', savedUserArg.password)).toBe(true);
    });

    it('creates user, staff detail, and contact in order', async () => {
      const user = makeUser();
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);
      const detail = makeDetail();
      staffRepo.create.mockReturnValue(detail);
      staffRepo.save.mockResolvedValue(detail);
      contactRepo.findOne.mockResolvedValue(null);
      contactRepo.create.mockReturnValue(makeContact());
      contactRepo.save.mockResolvedValue(makeContact());

      await service.create(dto);

      expect(userRepo.save).toHaveBeenCalled();
      expect(staffRepo.save).toHaveBeenCalled();
      expect(contactRepo.save).toHaveBeenCalled();
    });

    it('returns the user without the password field', async () => {
      const user = makeUser();
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);
      const detail = makeDetail();
      staffRepo.create.mockReturnValue(detail);
      staffRepo.save.mockResolvedValue(detail);
      contactRepo.findOne.mockResolvedValue(null);
      contactRepo.create.mockReturnValue(makeContact());
      contactRepo.save.mockResolvedValue(makeContact());

      const result = await service.create(dto);

      expect(result).not.toHaveProperty('password');
      expect(result.staffDetail).toEqual(detail);
    });

    it('uses role as fallback position when position is not provided', async () => {
      const user = makeUser();
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);
      const detail = makeDetail();
      staffRepo.create.mockReturnValue(detail);
      staffRepo.save.mockResolvedValue(detail);
      contactRepo.findOne.mockResolvedValue(null);
      contactRepo.create.mockReturnValue(makeContact());
      contactRepo.save.mockResolvedValue(makeContact());

      await service.create({ ...dto, position: undefined });

      const detailCreateArg = staffRepo.create.mock.calls[0][0] as any;
      expect(detailCreateArg.position).toBe('housekeeper');
    });

    it('does not create a contact record when email is omitted', async () => {
      const user = makeUser();
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);
      const detail = makeDetail();
      staffRepo.create.mockReturnValue(detail);
      staffRepo.save.mockResolvedValue(detail);

      await service.create({ ...dto, email: undefined });

      expect(contactRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns merged user+detail+email objects', async () => {
      const users = [makeUser({ id: 1 }), makeUser({ id: 2, username: 'mt1' })];
      const details = [makeDetail({ userId: 1 }), makeDetail({ id: 20, userId: 2 })];
      const contacts = [makeContact({ userId: 1, email: 'u1@test.com' })];

      userRepo.find.mockResolvedValue(users);
      staffRepo.find.mockResolvedValue(details);
      contactRepo.find.mockResolvedValue(contacts);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('u1@test.com');
      expect(result[0].staffDetail).toEqual(details[0]);
      expect(result[1].email).toBeNull(); // no contact for user 2
      expect(result[1].staffDetail).toEqual(details[1]);
    });

    it('returns empty array when no staff users exist', async () => {
      userRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(staffRepo.find).not.toHaveBeenCalled();
      expect(contactRepo.find).not.toHaveBeenCalled();
    });

    it('sets staffDetail to null when no detail record exists for a user', async () => {
      userRepo.find.mockResolvedValue([makeUser({ id: 5 })]);
      staffRepo.find.mockResolvedValue([]); // no detail
      contactRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result[0].staffDetail).toBeNull();
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns merged user+detail+email', async () => {
      const user = makeUser({ id: 3 });
      const detail = makeDetail({ userId: 3 });
      const contact = makeContact({ userId: 3, email: 'u3@test.com' });

      userRepo.findOne.mockResolvedValue(user);
      staffRepo.findOne.mockResolvedValue(detail);
      contactRepo.findOne.mockResolvedValue(contact);

      const result = await service.findOne(3);

      expect(result.email).toBe('u3@test.com');
      expect(result.staffDetail).toEqual(detail);
    });

    it('sets staffDetail and email to null when not found', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ id: 4 }));
      staffRepo.findOne.mockResolvedValue(null);
      contactRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne(4);

      expect(result.staffDetail).toBeNull();
      expect(result.email).toBeNull();
    });

    it('throws NotFoundException when user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Staff #999 not found');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when staff user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });

    it('updates fullName on both user and staff detail', async () => {
      const user = makeUser({ id: 1 });
      const detail = makeDetail({ userId: 1 });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, fullName: 'Updated Name' });
      staffRepo.findOne.mockResolvedValue(detail);
      staffRepo.save.mockResolvedValue({ ...detail, name: 'Updated Name' });
      contactRepo.findOne.mockResolvedValue(null);

      const dto: UpdateStaffDto = { fullName: 'Updated Name' };
      const result = await service.update(1, dto);

      expect(user.fullName).toBe('Updated Name');
      expect(detail.name).toBe('Updated Name');
      expect(result).not.toHaveProperty('password');
    });

    it('updates salary fields on staff detail', async () => {
      const user = makeUser({ id: 1 });
      const detail = makeDetail({ userId: 1, basicSalary: 50000 });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);
      staffRepo.findOne.mockResolvedValue(detail);
      staffRepo.save.mockResolvedValue(detail);
      contactRepo.findOne.mockResolvedValue(null);

      await service.update(1, { basicSalary: 75000 });

      expect(detail.basicSalary).toBe(75000);
    });

    it('upserts email when provided', async () => {
      const user = makeUser({ id: 1 });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);
      staffRepo.findOne.mockResolvedValue(null);
      // No existing contact
      contactRepo.findOne
        .mockResolvedValueOnce(null)  // upsertEmail check
        .mockResolvedValueOnce(null); // final contact fetch
      const newContact = makeContact({ email: 'new@test.com' });
      contactRepo.create.mockReturnValue(newContact);
      contactRepo.save.mockResolvedValue(newContact);

      await service.update(1, { email: 'new@test.com' });

      expect(contactRepo.save).toHaveBeenCalled();
    });

    it('updates existing contact email during upsert', async () => {
      const user = makeUser({ id: 1 });
      const existingContact = makeContact({ email: 'old@test.com' });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);
      staffRepo.findOne.mockResolvedValue(null);
      contactRepo.findOne.mockResolvedValue(existingContact);
      contactRepo.save.mockResolvedValue({ ...existingContact, email: 'new@test.com' });

      await service.update(1, { email: 'new@test.com' });

      expect(existingContact.email).toBe('new@test.com');
      expect(contactRepo.save).toHaveBeenCalled();
    });

    it('skips email upsert when email is not in dto', async () => {
      const user = makeUser({ id: 1 });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);
      staffRepo.findOne.mockResolvedValue(null);
      contactRepo.findOne.mockResolvedValue(null);

      await service.update(1, { fullName: 'New Name' });

      expect(contactRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('throws NotFoundException when staff user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('deletes payroll rows, staff detail, then user account', async () => {
      const user = makeUser({ id: 2 });
      const detail = makeDetail({ id: 10, userId: 2 });
      userRepo.findOne.mockResolvedValue(user);
      staffRepo.findOne.mockResolvedValue(detail);
      staffRepo.remove.mockResolvedValue(detail);
      userRepo.remove.mockResolvedValue(user);

      await service.remove(2);

      expect(dataSource.query).toHaveBeenCalledWith(
        'DELETE FROM payroll WHERE staff_id = ?',
        [10],
      );
      expect(staffRepo.remove).toHaveBeenCalledWith(detail);
      expect(userRepo.remove).toHaveBeenCalledWith(user);
    });

    it('skips payroll delete and staff detail remove when no detail exists', async () => {
      const user = makeUser({ id: 3 });
      userRepo.findOne.mockResolvedValue(user);
      staffRepo.findOne.mockResolvedValue(null);
      userRepo.remove.mockResolvedValue(user);

      await service.remove(3);

      expect(dataSource.query).not.toHaveBeenCalled();
      expect(staffRepo.remove).not.toHaveBeenCalled();
      expect(userRepo.remove).toHaveBeenCalledWith(user);
    });
  });
});
