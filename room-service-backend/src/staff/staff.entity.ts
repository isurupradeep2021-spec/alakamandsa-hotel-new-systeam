import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Read-only mirror of the Spring Boot `users` table.
 * NestJS never alters this table's schema (synchronize: false).
 */

export enum StaffRole {
  HOUSEKEEPER = 'HOUSEKEEPER',
  MAINTENANCE_STAFF = 'MAINTENANCE_STAFF',
}

@Entity({ name: 'users', synchronize: false })
export class UserAccount {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar' })
  role: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: Date;
}

/**
 * Mirror of the Spring Boot `staff` table.
 * Stores payroll/HR details for staff members linked to a UserAccount via user_id.
 * NestJS never alters this table's schema (synchronize: false).
 */

@Entity({ name: 'staff', synchronize: false })
export class StaffDetail {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  name: string;

  @Column()
  position: string;

  @Column({ name: 'basic_salary', type: 'decimal', precision: 19, scale: 2, default: 0 })
  basicSalary: number;

  @Column({ default: 0 })
  attendance: number;

  @Column({ name: 'overtime_hours', type: 'double', default: 0 })
  overtimeHours: number;

  @Column({ name: 'absent_days', default: 0 })
  absentDays: number;

  @Column({ name: 'overtime_rate', type: 'decimal', precision: 19, scale: 2, default: 0 })
  overtimeRate: number;

  @Column({ name: 'daily_rate', type: 'decimal', precision: 19, scale: 2, default: 0 })
  dailyRate: number;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: string;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId: number;
}

