import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccount, StaffDetail } from './staff.entity';
import { StaffContact } from './staff-contact.entity';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserAccount, StaffDetail, StaffContact]), AuthModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService, TypeOrmModule],
})
export class StaffModule {}
