import { IsDateString, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class BookingTriggerDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  roomNumber: string;

  /**
   * ISO date string for the booking check-in date (e.g. "2026-05-10").
   * Deadline will be computed as 13:30 on this day (30 min before standard 2 PM check-in).
   */
  @IsDateString()
  checkInDate: string;

  @IsOptional()
  @IsString()
  bookingCustomer?: string;

  @IsOptional()
  @IsString()
  bookingId?: string;
}
