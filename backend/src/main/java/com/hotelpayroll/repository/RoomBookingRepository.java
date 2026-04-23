package com.hotelpayroll.repository;

import com.hotelpayroll.entity.RoomBooking;
import com.hotelpayroll.entity.RoomBookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RoomBookingRepository extends JpaRepository<RoomBooking, Long> {
	List<RoomBooking> findByCreatedByUsernameOrderByIdDesc(String createdByUsername);

	@Query(value = """
			select coalesce(max(coalesce(booking_sequence, id)), 0)
			from room_bookings
			""", nativeQuery = true)
	Number findMaxBookingSequence();

	@Query("""
			select rb
			from RoomBooking rb
			where lower(coalesce(rb.createdByUsername, '')) = lower(:username)
			   or lower(coalesce(rb.customerEmail, '')) = lower(:username)
			   or lower(coalesce(rb.bookingCustomer, '')) = lower(:username)
			order by rb.id desc
			""")
	List<RoomBooking> findMyBookingsByUsernameOrEmail(@Param("username") String username);

		@Query("""
			    select coalesce(sum(coalesce(rb.bookedRooms, 1)), 0)
						from RoomBooking rb
						where lower(rb.roomNumber) = lower(:roomNumber)
							and rb.bookingStatus in :activeStatuses
			      and rb.checkInDate < :requestedCheckOut
			      and rb.checkOutDate > :requestedCheckIn
							and (:excludeId is null or rb.id <> :excludeId)
						""")
		Integer sumBookedRoomsByRoomNumber(
						@Param("roomNumber") String roomNumber,
						@Param("activeStatuses") List<RoomBookingStatus> activeStatuses,
			    @Param("requestedCheckIn") LocalDate requestedCheckIn,
			    @Param("requestedCheckOut") LocalDate requestedCheckOut,
						@Param("excludeId") Long excludeId
		);

		@Query("""
			    select (count(rb) > 0)
						from RoomBooking rb
						where lower(rb.roomNumber) = lower(:roomNumber)
							and rb.bookingStatus in :activeStatuses
			      and rb.checkInDate < :requestedCheckOut
			      and rb.checkOutDate > :requestedCheckIn
							and (:excludeId is null or rb.id <> :excludeId)
						""")
		boolean existsOverlappingBooking(
						@Param("roomNumber") String roomNumber,
						@Param("activeStatuses") List<RoomBookingStatus> activeStatuses,
			    @Param("requestedCheckIn") LocalDate requestedCheckIn,
			    @Param("requestedCheckOut") LocalDate requestedCheckOut,
						@Param("excludeId") Long excludeId
		);
}
