import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * NestJS-owned table that stores contact email for housekeeping/maintenance staff.
 * Linked to UserAccount via userId (foreign key NOT enforced at ORM level to keep
 * the users table Spring Boot-owned).
 */
@Entity({ name: 'staff_contacts' })
export class StaffContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ length: 254 })
  email: string;
}
