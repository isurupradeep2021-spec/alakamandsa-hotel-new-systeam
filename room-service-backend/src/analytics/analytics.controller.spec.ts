import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

// ── mock guards ───────────────────────────────────────────────────────────────

const allowAllGuard = { canActivate: jest.fn().mockReturnValue(true) };

// ── mock service factory ──────────────────────────────────────────────────────

const mockAnalyticsService = () => ({
  getMonthlyAnalytics: jest.fn(),
  getTrendAnalytics: jest.fn(),
});

// ── stub analytics payload ────────────────────────────────────────────────────

const stubMonthlyResult = (year: number, month: number) => ({
  period: { year, month },
  housekeeping: { total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0, avgResolutionHours: null, onTimeRate: null, byTaskType: {}, byRoomCondition: {}, byPriority: {}, staffWorkload: {} },
  maintenance: { total: 0, resolved: 0, open: 0, inProgress: 0, overdue: 0, avgResolutionHours: null, onTimeRate: null, byFacilityType: {}, byPriority: {}, recurringRooms: [], staffWorkload: {} },
});

// ── test suite ────────────────────────────────────────────────────────────────

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: jest.Mocked<ReturnType<typeof mockAnalyticsService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        { provide: AnalyticsService, useFactory: mockAnalyticsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAllGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowAllGuard)
      .compile();

    controller = module.get(AnalyticsController);
    service = module.get(AnalyticsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── GET /monthly ───────────────────────────────────────────────────────────

  describe('getMonthly', () => {
    it('parses year and month query params and calls service', async () => {
      const expected = stubMonthlyResult(2026, 4);
      service.getMonthlyAnalytics.mockResolvedValue(expected);

      const result = await controller.getMonthly('2026', '4');

      expect(service.getMonthlyAnalytics).toHaveBeenCalledWith(2026, 4);
      expect(result).toEqual(expected);
    });

    it('defaults to current year and month when params are absent', async () => {
      const now = new Date();
      const expected = stubMonthlyResult(now.getFullYear(), now.getMonth() + 1);
      service.getMonthlyAnalytics.mockResolvedValue(expected);

      await controller.getMonthly(undefined, undefined);

      expect(service.getMonthlyAnalytics).toHaveBeenCalledWith(
        now.getFullYear(),
        now.getMonth() + 1,
      );
    });

    it('defaults to current year when only month is provided', async () => {
      const now = new Date();
      service.getMonthlyAnalytics.mockResolvedValue(stubMonthlyResult(now.getFullYear(), 3));

      await controller.getMonthly(undefined, '3');

      expect(service.getMonthlyAnalytics).toHaveBeenCalledWith(now.getFullYear(), 3);
    });

    it('defaults to current month when only year is provided', async () => {
      const now = new Date();
      service.getMonthlyAnalytics.mockResolvedValue(stubMonthlyResult(2025, now.getMonth() + 1));

      await controller.getMonthly('2025', undefined);

      expect(service.getMonthlyAnalytics).toHaveBeenCalledWith(2025, now.getMonth() + 1);
    });

    it('returns the exact value from the service', async () => {
      const payload = stubMonthlyResult(2025, 12);
      service.getMonthlyAnalytics.mockResolvedValue(payload);

      const result = await controller.getMonthly('2025', '12');

      expect(result).toBe(payload);
    });
  });

  // ── GET /trends ────────────────────────────────────────────────────────────

  describe('getTrends', () => {
    it('parses months query param and calls service', async () => {
      const trends = [stubMonthlyResult(2026, 1), stubMonthlyResult(2026, 2), stubMonthlyResult(2026, 3)];
      service.getTrendAnalytics.mockResolvedValue(trends);

      const result = await controller.getTrends('3');

      expect(service.getTrendAnalytics).toHaveBeenCalledWith(3);
      expect(result).toEqual(trends);
    });

    it('defaults to 6 months when months param is absent', async () => {
      service.getTrendAnalytics.mockResolvedValue([]);

      await controller.getTrends(undefined);

      expect(service.getTrendAnalytics).toHaveBeenCalledWith(6);
    });

    it('returns the array from the service', async () => {
      const trends = [stubMonthlyResult(2026, 4)];
      service.getTrendAnalytics.mockResolvedValue(trends);

      const result = await controller.getTrends('1');

      expect(result).toBe(trends);
    });
  });
});
