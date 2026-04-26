import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { MaintenanceTicket, MaintenanceStatus } from './maintenance-ticket.entity';
import { UserAccount } from '../staff/staff.entity';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from './dto/update-maintenance-ticket.dto';
import { RoomSyncService } from '../rooms/room-sync.service';

interface RequestUser {
  username  : string;
  role: string;
}

const MAINTENANCE_ALLOWED_STATUSES = [
  MaintenanceStatus.IN_PROGRESS,
  MaintenanceStatus.RESOLVED,
  MaintenanceStatus.CLOSED,
];

const RESOLVED_STATUSES = new Set([MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED]);


@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceTicket)
    private readonly ticketRepository: Repository<MaintenanceTicket>,
    @InjectRepository(UserAccount)
    private readonly staffRepository: Repository<UserAccount>,
    private readonly roomSync: RoomSyncService,
  ) {}

  async create(dto: CreateMaintenanceTicketDto): Promise<MaintenanceTicket> {
    const ticket = this.ticketRepository.create(dto);
    const saved = await this.ticketRepository.save(ticket);
    // Set room to MAINTENANCE if it is currently AVAILABLE
    await this.roomSync.setMaintenanceIfAvailable(saved.roomNumber);
    return saved;
  }

  async findAll(requestUser?: RequestUser): Promise<MaintenanceTicket[]> {
    if (requestUser?.role === 'MAINTENANCE_STAFF') {
      const staff = await this.staffRepository.findOne({ where: { username: requestUser.username } });
      if (!staff) return [];
      return this.ticketRepository.find({
        where: { staffId: Number(staff.id) },
        order: { createdAt: 'DESC' },
      });
    }
    return this.ticketRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<MaintenanceTicket> {
    const ticket = await this.ticketRepository.findOneBy({ id });
    if (!ticket) throw new NotFoundException(`Maintenance ticket #${id} not found`);
    return ticket;
  }

  async update(id: number, dto: UpdateMaintenanceTicketDto): Promise<MaintenanceTicket> {
    const ticket = await this.findOne(id);
    const wasResolved = RESOLVED_STATUSES.has(ticket.status);
    Object.assign(ticket, dto);
    if (dto.status && RESOLVED_STATUSES.has(dto.status) && !wasResolved) {
      ticket.resolvedAt = new Date();
      await this.clearRoomMaintenanceIfNoOtherTickets(ticket.roomNumber, id);
    }
    return this.ticketRepository.save(ticket);
  }

  async remove(id: number): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }

  async updateStatus(id: number, status: string, requestUser: RequestUser): Promise<MaintenanceTicket> {
    if (!MAINTENANCE_ALLOWED_STATUSES.includes(status as MaintenanceStatus)) {
      throw new ForbiddenException(`Status must be one of: ${MAINTENANCE_ALLOWED_STATUSES.join(', ')}`);
    }
    const ticket = await this.findOne(id);
    const staff = await this.staffRepository.findOne({ where: { username: requestUser.username } });
    if (!staff || Number(ticket.staffId) !== Number(staff.id)) {
      throw new ForbiddenException('You can only update tickets assigned to you.');
    }
    const wasResolved = RESOLVED_STATUSES.has(ticket.status);
    ticket.status = status as MaintenanceStatus;
    if (RESOLVED_STATUSES.has(ticket.status) && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }
    const saved = await this.ticketRepository.save(ticket);
    if (!wasResolved && RESOLVED_STATUSES.has(ticket.status)) {
      await this.clearRoomMaintenanceIfNoOtherTickets(ticket.roomNumber, id);
    }
    return saved;
  }

  async getStats(): Promise<Record<string, number>> {
    const tickets = await this.ticketRepository.find();
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'OPEN').length,
      assigned: tickets.filter((t) => t.status === 'ASSIGNED').length,
      inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
      closed: tickets.filter((t) => t.status === 'CLOSED').length,
    };
  }

  /**
   * Returns true if the room has at least one active (non-RESOLVED/CLOSED) maintenance ticket.
   * Used by the frontend to block bookings.
   */
  async hasActiveMaintenance(roomNumber: string): Promise<{ blocked: boolean; reason?: string }> {
    const active = await this.ticketRepository.findOne({
      where: {
        roomNumber,
        status: Not(MaintenanceStatus.RESOLVED) as any,
      },
    });
    // Filter out CLOSED as well (TypeORM Not only handles one value, so re-check in memory)
    if (active && active.status !== MaintenanceStatus.CLOSED) {
      return { blocked: true, reason: `Room ${roomNumber} has an unresolved maintenance ticket (#${active.id}: ${active.facilityType}).` };
    }
    return { blocked: false };
  }

  // ── private helpers ──────────────────────────────────────────────────────

  /**
   * Clears MAINTENANCE room status only if no other active tickets exist for that room.
   */
  private async clearRoomMaintenanceIfNoOtherTickets(roomNumber: string, resolvedId: number): Promise<void> {
    const otherActive = await this.ticketRepository.find({ where: { roomNumber } });
    const stillActive = otherActive.some(
      (t) => t.id !== resolvedId && !RESOLVED_STATUSES.has(t.status),
    );
    if (!stillActive) {
      await this.roomSync.clearMaintenanceStatus(roomNumber);
    }
  }
}
