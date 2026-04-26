import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RoomSyncService } from './room-sync.service';
import { Room, RoomStatus } from './room.entity';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 1,
    roomNumber: '101',
    roomStatus: RoomStatus.AVAILABLE,
    ...overrides,
  } as Room;
}

// ── mock factory ──────────────────────────────────────────────────────────────

const mockRoomRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
});

// ── test suite ────────────────────────────────────────────────────────────────

describe('RoomSyncService', () => {
  let service: RoomSyncService;
  let roomRepo: jest.Mocked<ReturnType<typeof mockRoomRepository>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomSyncService,
        { provide: getRepositoryToken(Room), useFactory: mockRoomRepository },
      ],
    }).compile();

    service = module.get(RoomSyncService);
    roomRepo = module.get(getRepositoryToken(Room));
  });

  afterEach(() => jest.clearAllMocks());

  // ── hasActiveMaintenance ───────────────────────────────────────────────────

  describe('hasActiveMaintenance', () => {
    it('returns true when room status is MAINTENANCE', async () => {
      roomRepo.findOne.mockResolvedValue(makeRoom({ roomStatus: RoomStatus.MAINTENANCE }));

      const result = await service.hasActiveMaintenance('101');

      expect(result).toBe(true);
    });

    it('returns false when room status is AVAILABLE', async () => {
      roomRepo.findOne.mockResolvedValue(makeRoom({ roomStatus: RoomStatus.AVAILABLE }));

      const result = await service.hasActiveMaintenance('101');

      expect(result).toBe(false);
    });

    it('returns false when room is not found', async () => {
      roomRepo.findOne.mockResolvedValue(null);

      const result = await service.hasActiveMaintenance('999');

      expect(result).toBe(false);
    });
  });

  // ── setMaintenanceIfAvailable ──────────────────────────────────────────────

  describe('setMaintenanceIfAvailable', () => {
    it('sets status to MAINTENANCE when room is AVAILABLE', async () => {
      const room = makeRoom({ roomStatus: RoomStatus.AVAILABLE });
      roomRepo.findOne.mockResolvedValue(room);
      roomRepo.save.mockResolvedValue({ ...room, roomStatus: RoomStatus.MAINTENANCE });

      await service.setMaintenanceIfAvailable('101');

      expect(room.roomStatus).toBe(RoomStatus.MAINTENANCE);
      expect(roomRepo.save).toHaveBeenCalledWith(room);
    });

    it('does nothing when room is not AVAILABLE (e.g. OCCUPIED)', async () => {
      const room = makeRoom({ roomStatus: RoomStatus.OCCUPIED });
      roomRepo.findOne.mockResolvedValue(room);

      await service.setMaintenanceIfAvailable('101');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });

    it('does nothing when room is not found', async () => {
      roomRepo.findOne.mockResolvedValue(null);

      await service.setMaintenanceIfAvailable('999');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── setCleaningIfAvailable ────────────────────────────────────────────────

  describe('setCleaningIfAvailable', () => {
    it('sets status to CLEANING when room is AVAILABLE', async () => {
      const room = makeRoom({ roomStatus: RoomStatus.AVAILABLE });
      roomRepo.findOne.mockResolvedValue(room);
      roomRepo.save.mockResolvedValue({ ...room, roomStatus: RoomStatus.CLEANING });

      await service.setCleaningIfAvailable('101');

      expect(room.roomStatus).toBe(RoomStatus.CLEANING);
      expect(roomRepo.save).toHaveBeenCalledWith(room);
    });

    it('does nothing when room is already CLEANING', async () => {
      const room = makeRoom({ roomStatus: RoomStatus.CLEANING });
      roomRepo.findOne.mockResolvedValue(room);

      await service.setCleaningIfAvailable('101');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });

    it('does nothing when room is MAINTENANCE', async () => {
      const room = makeRoom({ roomStatus: RoomStatus.MAINTENANCE });
      roomRepo.findOne.mockResolvedValue(room);

      await service.setCleaningIfAvailable('101');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });

    it('does nothing when room is not found', async () => {
      roomRepo.findOne.mockResolvedValue(null);

      await service.setCleaningIfAvailable('999');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── clearMaintenanceStatus ────────────────────────────────────────────────

  describe('clearMaintenanceStatus', () => {
    it('restores status to AVAILABLE when room is currently MAINTENANCE', async () => {
      const room = makeRoom({ roomStatus: RoomStatus.MAINTENANCE });
      roomRepo.findOne.mockResolvedValue(room);
      roomRepo.save.mockResolvedValue({ ...room, roomStatus: RoomStatus.AVAILABLE });

      await service.clearMaintenanceStatus('101');

      expect(room.roomStatus).toBe(RoomStatus.AVAILABLE);
      expect(roomRepo.save).toHaveBeenCalledWith(room);
    });

    it('does nothing when room is not in MAINTENANCE status', async () => {
      const room = makeRoom({ roomStatus: RoomStatus.OCCUPIED });
      roomRepo.findOne.mockResolvedValue(room);

      await service.clearMaintenanceStatus('101');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });

    it('does nothing when room is not found', async () => {
      roomRepo.findOne.mockResolvedValue(null);

      await service.clearMaintenanceStatus('999');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── clearCleaningStatus ────────────────────────────────────────────────────

  describe('clearCleaningStatus', () => {
    it('restores status to AVAILABLE when room is currently CLEANING', async () => {
      const room = makeRoom({ roomStatus: RoomStatus.CLEANING });
      roomRepo.findOne.mockResolvedValue(room);
      roomRepo.save.mockResolvedValue({ ...room, roomStatus: RoomStatus.AVAILABLE });

      await service.clearCleaningStatus('101');

      expect(room.roomStatus).toBe(RoomStatus.AVAILABLE);
      expect(roomRepo.save).toHaveBeenCalledWith(room);
    });

    it('does nothing when room is not in CLEANING status', async () => {
      const room = makeRoom({ roomStatus: RoomStatus.RESERVED });
      roomRepo.findOne.mockResolvedValue(room);

      await service.clearCleaningStatus('101');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });

    it('does nothing when room is not found', async () => {
      roomRepo.findOne.mockResolvedValue(null);

      await service.clearCleaningStatus('999');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns rooms ordered by roomNumber ASC', async () => {
      const rooms = [
        makeRoom({ id: 1, roomNumber: '101' }),
        makeRoom({ id: 2, roomNumber: '102' }),
        makeRoom({ id: 3, roomNumber: '201' }),
      ];
      roomRepo.find.mockResolvedValue(rooms);

      const result = await service.findAll();

      expect(roomRepo.find).toHaveBeenCalledWith({ order: { roomNumber: 'ASC' } });
      expect(result).toEqual(rooms);
    });

    it('returns empty array when no rooms exist', async () => {
      roomRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ── idempotency — status already at target ────────────────────────────────

  describe('status transition idempotency', () => {
    it('setCleaningIfAvailable is idempotent: no save if already CLEANING', async () => {
      roomRepo.findOne.mockResolvedValue(makeRoom({ roomStatus: RoomStatus.CLEANING }));

      await service.setCleaningIfAvailable('101');
      await service.setCleaningIfAvailable('101');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });

    it('clearCleaningStatus is idempotent: no save if already AVAILABLE', async () => {
      roomRepo.findOne.mockResolvedValue(makeRoom({ roomStatus: RoomStatus.AVAILABLE }));

      await service.clearCleaningStatus('101');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });

    it('clearMaintenanceStatus is idempotent: no save if already AVAILABLE', async () => {
      roomRepo.findOne.mockResolvedValue(makeRoom({ roomStatus: RoomStatus.AVAILABLE }));

      await service.clearMaintenanceStatus('101');

      expect(roomRepo.save).not.toHaveBeenCalled();
    });
  });
});
