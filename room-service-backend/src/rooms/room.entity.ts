import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
}

/**
 * Read/write mirror of the Spring Boot `rooms` table.
 * synchronize: false — Spring Boot owns the schema.
 * NestJS only updates the `room_status` column.
 */
@Entity({ name: 'rooms', synchronize: false })
export class Room {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'room_number', unique: true })
  roomNumber: string;

  @Column({
    name: 'room_status',
    type: 'varchar',
  })
  roomStatus: RoomStatus;
}
