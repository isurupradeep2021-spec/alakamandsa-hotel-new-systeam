/**
 * Room Service – System / E2E Tests
 *
 * Boots the full NestJS application against a dedicated test MySQL database
 * and fires real HTTP requests through supertest.
 *
 * Auth strategy: JwtAuthGuard is replaced with a lightweight mock that reads
 * the role from the `x-role` request header so tests never touch the users
 * table. RolesGuard remains real and enforces role-based access control.
 *
 * Prerequisites
 * ─────────────
 *   1. `.env.test` exists at the root of room-service-backend/ (already created).
 *   2. `npm install --save-dev cross-env` has been run (one-time).
 *   3. MySQL is running and the credentials in .env.test are valid.
 *
 * Run with:  npm run test:e2e
 */

import * as dotenv from 'dotenv';
import * as path from 'node:path';

// Load .env.test into process.env BEFORE NestJS module factories run.
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') });

import { Test, TestingModule } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { createConnection } from 'mysql2/promise';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

// ── Mock guard ────────────────────────────────────────────────────────────────

/**
 * Replaces the real JwtAuthGuard in the test module.
 *
 * - No `Authorization` header → throws 401 UnauthorizedException.
 * - With `Authorization` header → sets `req.user` with the role from the
 *   `x-role` header (defaults to 'MANAGER') so RolesGuard can function normally.
 *   The actual token value is never verified.
 */
class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Record<string, any>>();
    if (!req.headers?.authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }
    const role = (req.headers['x-role'] as string | undefined)?.toUpperCase() ?? 'MANAGER';
    req.user = { username: 'e2e_test_user', role };
    return true;
  }
}

// ── test constants ────────────────────────────────────────────────────────────

/** Dedicated room number used only by e2e tests — cleaned up in afterAll. */
const TEST_ROOM = 'E_TEST';

// ── suite ─────────────────────────────────────────────────────────────────────

describe('Room Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // ── 1. Provision the test database ───────────────────────────────────────

    const raw = await createConnection({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASS,
    });

    const dbName = process.env.DB_NAME ?? 'hotel_management_test';
    await raw.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await raw.query(`USE \`${dbName}\``);

    // These tables are owned by the Spring Boot service; TypeORM (synchronize:true)
    // only creates the NestJS entities, so we provision the rest here.
    await raw.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         BIGINT       AUTO_INCREMENT PRIMARY KEY,
        username   VARCHAR(255) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        full_name  VARCHAR(255) NOT NULL,
        role       VARCHAR(50)  NOT NULL,
        enabled    TINYINT(1)   NOT NULL DEFAULT 1,
        created_at DATETIME     NULL
      )
    `);

    await raw.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id             BIGINT        AUTO_INCREMENT PRIMARY KEY,
        name           VARCHAR(255)  NOT NULL,
        position       VARCHAR(255)  NOT NULL,
        basic_salary   DECIMAL(19,2) DEFAULT 0,
        attendance     INT           DEFAULT 0,
        overtime_hours DOUBLE        DEFAULT 0,
        absent_days    INT           DEFAULT 0,
        overtime_rate  DOUBLE        DEFAULT 0,
        daily_rate     DOUBLE        DEFAULT 0,
        status         VARCHAR(50)   DEFAULT 'ACTIVE',
        user_id        BIGINT        NULL
      )
    `);

    await raw.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id          BIGINT       AUTO_INCREMENT PRIMARY KEY,
        room_number VARCHAR(255) NOT NULL UNIQUE,
        room_status VARCHAR(50)  NOT NULL DEFAULT 'AVAILABLE'
      )
    `);

    await raw.query(`
      CREATE TABLE IF NOT EXISTS payroll (
        id       BIGINT AUTO_INCREMENT PRIMARY KEY,
        staff_id BIGINT NULL
      )
    `);

    // Insert a seed row so SeedService skips auto-seeding the test DB.
    await raw.query(`
      INSERT IGNORE INTO users (username, password, full_name, role, enabled)
      VALUES ('e2e_seed', 'not-used', 'E2E Seed User', 'MANAGER', 1)
    `);

    // Seed the test room used by the maintenance check-room endpoint.
    await raw.query(
      `INSERT IGNORE INTO rooms (room_number, room_status) VALUES (?, 'AVAILABLE')`,
      [TEST_ROOM],
    );

    await raw.end();

    // ── 2. Boot the full NestJS application ──────────────────────────────────

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Swap out the real guard with our lightweight mock.
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    // Mirror main.ts so guards, pipes, and routing behave identically in tests.
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    await app.init();

    // ── 3. Purge stale test rows from a previous run ──────────────────────────

    const ds = app.get<DataSource>(getDataSourceToken());
    await ds.query('DELETE FROM housekeeping_tasks  WHERE roomNumber = ?', [TEST_ROOM]);
    await ds.query('DELETE FROM maintenance_tickets WHERE roomNumber = ?', [TEST_ROOM]);

  }, 60_000); // generous timeout: DB provisioning + full NestJS bootstrap

  afterAll(async () => {
    if (app) {
      const ds = app.get<DataSource>(getDataSourceToken());
      await ds.query('DELETE FROM housekeeping_tasks  WHERE roomNumber = ?', [TEST_ROOM]);
      await ds.query('DELETE FROM maintenance_tickets WHERE roomNumber = ?', [TEST_ROOM]);
      await app.close();
    }
  });

  // ── Test 1: Authentication guard ──────────────────────────────────────────

  it('returns 401 when no Bearer token is provided to a protected endpoint', () => {
    return request(app.getHttpServer())
      .get('/api/housekeeping')
      // deliberately no Authorization header
      .expect(401);
  });

  // ── Test 2: Authenticated list ────────────────────────────────────────────

  it('returns 200 and an array for GET /api/housekeeping with a valid manager token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/housekeeping')
      .set('Authorization', 'Bearer fake-token')
      .set('x-role', 'MANAGER')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  // ── Test 3: Create → retrieve round-trip ─────────────────────────────────

  it('POST /api/housekeeping creates a task and GET /:id retrieves the same record', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/housekeeping')
      .set('Authorization', 'Bearer fake-token')
      .set('x-role', 'MANAGER')
      .send({ roomNumber: TEST_ROOM, roomCondition: 'CHECKOUT', taskType: 'CLEANING' })
      .expect(201);

    const { id } = createRes.body;
    expect(id).toBeDefined();
    expect(createRes.body.status).toBe('PENDING');
    expect(createRes.body.roomNumber).toBe(TEST_ROOM);

    const getRes = await request(app.getHttpServer())
      .get(`/api/housekeeping/${id}`)
      .set('Authorization', 'Bearer fake-token')
      .set('x-role', 'MANAGER')
      .expect(200);

    expect(getRes.body.id).toBe(id);
    expect(getRes.body.taskType).toBe('CLEANING');
  });

  // ── Test 4: Public endpoint (no auth required) ───────────────────────────

  it('GET /api/maintenance/check-room/:room returns { blocked: false } without a token', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/maintenance/check-room/${TEST_ROOM}`)
      .expect(200);

    expect(res.body.blocked).toBe(false);
  });

  // ── Test 5: Role-based access control ────────────────────────────────────

  it('PATCH /api/housekeeping/:id/status returns 403 when a MANAGER calls a HOUSEKEEPER-only endpoint', async () => {
    // First create a task as a MANAGER (allowed by @Roles('SUPER_ADMIN', 'MANAGER')).
    const createRes = await request(app.getHttpServer())
      .post('/api/housekeeping')
      .set('Authorization', 'Bearer fake-token')
      .set('x-role', 'MANAGER')
      .send({ roomNumber: TEST_ROOM, roomCondition: 'CHECKOUT', taskType: 'CLEANING' })
      .expect(201);

    // Then try to update status as MANAGER — endpoint requires HOUSEKEEPER → 403.
    await request(app.getHttpServer())
      .patch(`/api/housekeeping/${createRes.body.id}/status`)
      .set('Authorization', 'Bearer fake-token')
      .set('x-role', 'MANAGER')
      .send({ status: 'IN_PROGRESS' })
      .expect(403);
  });
});

