import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserAccount, StaffDetail, StaffRole } from './staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import * as bcrypt from 'bcryptjs';

const STAFF_ROLES = [StaffRole.HOUSEKEEPER, StaffRole.MAINTENANCE_STAFF];

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    @InjectRepository(StaffDetail)
    private readonly staffRepo: Repository<StaffDetail>,
  ) {}

  async create(dto: CreateStaffDto): Promise<any> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      username: dto.username,
      password: hashedPassword,
      fullName: dto.fullName,
      role: dto.role,
    });
    const savedUser = await this.userRepo.save(user);

    const detail = this.staffRepo.create({
      name: dto.fullName,
      position: dto.position ?? dto.role.toLowerCase().replace('_', ' '),
      basicSalary: dto.basicSalary ?? 0,
      attendance: 0,
      overtimeHours: 0,
      absentDays: 0,
      overtimeRate: dto.overtimeRate ?? 0,
      dailyRate: dto.dailyRate ?? 0,
      status: 'ACTIVE',
      userId: savedUser.id,
    });
    const savedDetail = await this.staffRepo.save(detail);

    const { password: _pw, ...userWithoutPassword } = savedUser as any;
    return { ...userWithoutPassword, staffDetail: savedDetail };
  }

  async findAll(): Promise<any[]> {
    const users = await this.userRepo.find({
      where: { role: In(STAFF_ROLES) as any },
      select: ['id', 'username', 'fullName', 'role', 'enabled', 'createdAt'],
      order: { fullName: 'ASC' },
    });

    if (users.length === 0) return [];

    const userIds = users.map((u) => u.id);
    const staffDetails = await this.staffRepo.find({
      where: { userId: In(userIds) },
    });

    const detailMap = new Map(staffDetails.map((s) => [Number(s.userId), s]));
    return users.map((u) => ({ ...u, staffDetail: detailMap.get(Number(u.id)) ?? null }));
  }

  async findOne(id: number): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { id, role: In(STAFF_ROLES) as any },
      select: ['id', 'username', 'fullName', 'role', 'enabled', 'createdAt'],
    });
    if (!user) throw new NotFoundException(`Staff #${id} not found`);

    const detail = await this.staffRepo.findOne({ where: { userId: id } });
    return { ...user, staffDetail: detail ?? null };
  }

  async update(id: number, dto: UpdateStaffDto): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { id, role: In(STAFF_ROLES) as any },
    });
    if (!user) throw new NotFoundException(`Staff #${id} not found`);

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.role !== undefined) user.role = dto.role;
    const savedUser = await this.userRepo.save(user);

    let detail = await this.staffRepo.findOne({ where: { userId: id } });
    if (detail) {
      if (dto.fullName !== undefined) detail.name = dto.fullName;
      if (dto.position !== undefined) detail.position = dto.position;
      if (dto.basicSalary !== undefined) detail.basicSalary = dto.basicSalary;
      if (dto.overtimeRate !== undefined) detail.overtimeRate = dto.overtimeRate;
      if (dto.dailyRate !== undefined) detail.dailyRate = dto.dailyRate;
      detail = await this.staffRepo.save(detail);
    }

    const { password: _pw, ...userWithoutPassword } = savedUser as any;
    return { ...userWithoutPassword, staffDetail: detail ?? null };
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id, role: In(STAFF_ROLES) as any },
    });
    if (!user) throw new NotFoundException(`Staff #${id} not found`);

    await this.staffRepo.delete({ userId: id });
    await this.userRepo.remove(user);
  }
}


