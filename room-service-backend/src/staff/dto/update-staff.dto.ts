import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { StaffRole } from '../staff.entity';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(StaffRole, { message: 'role must be HOUSEKEEPER or MAINTENANCE_STAFF' })
  role?: StaffRole;

  // Staff detail (payroll) fields
  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basicSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeRate?: number;
}

