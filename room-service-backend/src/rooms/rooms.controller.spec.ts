import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller';
import { RoomSyncService } from './room-sync.service';
import { Room, RoomStatus } from './room.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 1,
    roomNumber: '101',
    roomStatus: RoomStatus.AVAILABLE,
    ...overrides,
  } as Room;
}

// ── mock guard ────────────────────────────────────────────────────────────────

const allowAllGuard = { canActivate: jest.fn().mockReturnValue(true) };

// ── mock service factory ──────────────────────────────────────────────────────

const mockRoomSyncService = () => ({
  findAll: jest.fn(),
});

// ── test suite ────────────────────────────────────────────────────────────────

describe('RoomsController', () => {
  let controller: RoomsController;
  let service: jest.Mocked<ReturnType<typeof mockRoomSyncService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        { provide: RoomSyncService, useFactory: mockRoomSyncService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAllGuard)
      .compile();

    controller = module.get(RoomsController);
    service = module.get(RoomSyncService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── GET / ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('delegates to roomSyncService.findAll and returns the room list', async () => {
      const rooms = [
        makeRoom({ id: 1, roomNumber: '101', roomStatus: RoomStatus.AVAILABLE }),
        makeRoom({ id: 2, roomNumber: '102', roomStatus: RoomStatus.CLEANING }),
        makeRoom({ id: 3, roomNumber: '201', roomStatus: RoomStatus.MAINTENANCE }),
      ];
      service.findAll.mockResolvedValue(rooms);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rooms);
    });

    it('returns an empty array when no rooms exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });

    it('returns the exact promise from roomSyncService.findAll', () => {
      const rooms = [makeRoom()];
      const promise = Promise.resolve(rooms);
      service.findAll.mockReturnValue(promise);

      const result = controller.findAll();

      expect(result).toBe(promise);
    });
  });
});
