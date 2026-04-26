import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from './room.entity';

@Injectable()
export class RoomSyncService {
  private readonly logger = new Logger(RoomSyncService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
  ) {}

  /**
   * Returns true if the room has at least one active (non-RESOLVED/CLOSED) maintenance ticket.
   * Called externally by MaintenanceService.
   */
  async hasActiveMaintenance(roomNumber: string): Promise<boolean> {
    // This is a pure DB check — used for the booking-block endpoint.
    // The real query is done by MaintenanceService; here we just expose
    // the room status as a quick secondary check.
    const room = await this.roomRepo.findOne({ where: { roomNumber } });
    return room?.roomStatus === RoomStatus.MAINTENANCE;
  }

  /**
   * Called when a maintenance ticket is created.
   * Sets room status → MAINTENANCE only if currently AVAILABLE.
   */
  async setMaintenanceIfAvailable(roomNumber: string): Promise<void> {
    await this.setStatusIfCurrent(roomNumber, RoomStatus.AVAILABLE, RoomStatus.MAINTENANCE);
  }

  /**
   * Called when a housekeeping task is created.
   * Sets room status → CLEANING only if currently AVAILABLE.
   */
  async setCleaningIfAvailable(roomNumber: string): Promise<void> {
    await this.setStatusIfCurrent(roomNumber, RoomStatus.AVAILABLE, RoomStatus.CLEANING);
  }

  /**
   * Called when a maintenance ticket reaches RESOLVED or CLOSED.
   * Restores room status → AVAILABLE only if currently MAINTENANCE.
   */
  async clearMaintenanceStatus(roomNumber: string): Promise<void> {
    await this.setStatusIfCurrent(roomNumber, RoomStatus.MAINTENANCE, RoomStatus.AVAILABLE);
  }

  /**
   * Called when a housekeeping task reaches CLEANED or INSPECTED.
   * Restores room status → AVAILABLE only if currently CLEANING.
   */
  async clearCleaningStatus(roomNumber: string): Promise<void> {
    await this.setStatusIfCurrent(roomNumber, RoomStatus.CLEANING, RoomStatus.AVAILABLE);
  }

  /** Returns all rooms ordered by room number — used for form dropdowns. */
  findAll(): Promise<Room[]> {
    return this.roomRepo.find({ order: { roomNumber: 'ASC' } });
  }

  // ── private ──────────────────────────────────────────────────────────────

  private async setStatusIfCurrent(
    roomNumber: string,
    expectedCurrent: RoomStatus,
    newStatus: RoomStatus,
  ): Promise<void> {
    const room = await this.roomRepo.findOne({ where: { roomNumber } });
    if (!room) {
      this.logger.warn(`Room ${roomNumber} not found in rooms table — skipping status sync`);
      return;
    }
    if (room.roomStatus !== expectedCurrent) return;
    room.roomStatus = newStatus;
    await this.roomRepo.save(room);
    this.logger.log(`Room ${roomNumber}: ${expectedCurrent} → ${newStatus}`);
  }
}
