import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HousekeepingTask, HousekeepingStatus } from './housekeeping-task.entity';
import { UserAccount } from '../staff/staff.entity';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { UpdateHousekeepingTaskDto } from './dto/update-housekeeping-task.dto';

interface RequestUser {
  username: string;
  role: string;
}

const HOUSEKEEPER_ALLOWED_STATUSES = [
  HousekeepingStatus.IN_PROGRESS,
  HousekeepingStatus.CLEANED,
  HousekeepingStatus.INSPECTED,
];

@Injectable()
export class HousekeepingService {
  constructor(
    @InjectRepository(HousekeepingTask)
    private readonly taskRepository: Repository<HousekeepingTask>,
    @InjectRepository(UserAccount)
    private readonly staffRepository: Repository<UserAccount>,
  ) {}

  create(dto: CreateHousekeepingTaskDto): Promise<HousekeepingTask> {
    const task = this.taskRepository.create(dto);
    return this.taskRepository.save(task);
  }

  async findAll(requestUser?: RequestUser): Promise<HousekeepingTask[]> {
    if (requestUser?.role === 'HOUSEKEEPER') {
      const staff = await this.staffRepository.findOne({ where: { username: requestUser.username } });
      if (!staff) return [];
      return this.taskRepository.find({
        where: { staffId: Number(staff.id) },
        order: { createdAt: 'DESC' },
      });
    }
    return this.taskRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<HousekeepingTask> {
    const task = await this.taskRepository.findOneBy({ id });
    if (!task) throw new NotFoundException(`Housekeeping task #${id} not found`);
    return task;
  }

  async update(id: number, dto: UpdateHousekeepingTaskDto): Promise<HousekeepingTask> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    return this.taskRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  async updateStatus(id: number, status: string, requestUser: RequestUser): Promise<HousekeepingTask> {
    if (!HOUSEKEEPER_ALLOWED_STATUSES.includes(status as HousekeepingStatus)) {
      throw new ForbiddenException(`Status must be one of: ${HOUSEKEEPER_ALLOWED_STATUSES.join(', ')}`);
    }
    const task = await this.findOne(id);
    const staff = await this.staffRepository.findOne({ where: { username: requestUser.username } });
    if (!staff || Number(task.staffId) !== Number(staff.id)) {
      throw new ForbiddenException('You can only update tasks assigned to you.');
    }
    task.status = status as HousekeepingStatus;
    return this.taskRepository.save(task);
  }

  async getStats(): Promise<Record<string, number>> {
    const tasks = await this.taskRepository.find();
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'PENDING').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      cleaned: tasks.filter((t) => t.status === 'CLEANED').length,
      inspected: tasks.filter((t) => t.status === 'INSPECTED').length,
    };
  }
}
