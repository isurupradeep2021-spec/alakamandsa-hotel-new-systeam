package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.RoomAvailabilityResponse;
import com.hotelpayroll.dto.RoomBookingRequest;
import com.hotelpayroll.dto.RoomBookingResponse;
import com.hotelpayroll.entity.RoomBooking;
import com.hotelpayroll.entity.RoomBookingStatus;
import com.hotelpayroll.entity.Room;
import com.hotelpayroll.entity.RoomStatus;
import com.hotelpayroll.entity.RoomType;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.repository.RoomBookingRepository;
import com.hotelpayroll.repository.RoomRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.RoomBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomBookingServiceImpl implements RoomBookingService {

    private final RoomBookingRepository roomBookingRepository;
    private final RoomRepository roomRepository;
    private final AuditService auditService;

    private static final List<RoomBookingStatus> ACTIVE_BOOKING_STATUSES = List.of(
            RoomBookingStatus.BOOKED,
            RoomBookingStatus.CHECKED_IN,
            RoomBookingStatus.CANCELLATION_REQUESTED
    );

    @Override
    public RoomBookingResponse create(RoomBookingRequest request) {
        Room room = getRoom(request.getRoomNumber());
        validateAvailability(room, request.getBookedRooms(), null, request.getCheckInDate(), request.getCheckOutDate());
        RoomBooking booking = mapToEntity(new RoomBooking(), request, room);
        booking.setBookingSequence(resolveNextBookingSequence());
        booking.setCreatedByUsername(getCurrentUsername());
        RoomBooking saved = roomBookingRepository.save(booking);
        auditService.log("CREATE", "RoomBooking", saved.getId().toString(), getCurrentUsername(), "Created room booking");
        return toResponse(saved);
    }

    @Override
    public RoomBookingResponse update(Long id, RoomBookingRequest request) {
        RoomBooking booking = roomBookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room booking not found"));
        Room room = getRoom(request.getRoomNumber());
        validateAvailability(room, request.getBookedRooms(), id, request.getCheckInDate(), request.getCheckOutDate());
        booking = mapToEntity(booking, request, room);
        RoomBooking saved = roomBookingRepository.save(booking);
        auditService.log("UPDATE", "RoomBooking", saved.getId().toString(), getCurrentUsername(), "Updated room booking");
        return toResponse(saved);
    }

    @Override
    public List<RoomBookingResponse> getAll() {
        return roomBookingRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(this::safeToResponse)
                .toList();
    }

    @Override
    public List<RoomBookingResponse> getMyBookings() {
        String currentUsername = getCurrentUsername();
        return roomBookingRepository.findMyBookingsByUsernameOrEmail(currentUsername)
                .stream()
            .map(this::safeToResponse)
                .toList();
    }

    @Override
    public RoomBookingResponse requestCancellation(Long id) {
        RoomBooking booking = roomBookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room booking not found"));

        if (!getCurrentUsername().equalsIgnoreCase(booking.getCreatedByUsername())) {
            throw new BadRequestException("You can only request cancellation for your own bookings");
        }

        if (booking.getBookingStatus() == RoomBookingStatus.CANCELLED || booking.getBookingStatus() == RoomBookingStatus.CHECKED_OUT) {
            throw new BadRequestException("This booking cannot be cancelled");
        }

        if (booking.getBookingStatus() == RoomBookingStatus.CANCELLATION_REQUESTED) {
            throw new BadRequestException("Cancellation request already submitted for this booking");
        }

        booking.setBookingStatus(RoomBookingStatus.CANCELLATION_REQUESTED);
        RoomBooking saved = roomBookingRepository.save(booking);
        auditService.log("REQUEST_CANCELLATION", "RoomBooking", id.toString(), getCurrentUsername(), "Requested booking cancellation");
        return toResponse(saved);
    }

    @Override
    public RoomBookingResponse approveCancellation(Long id) {
        RoomBooking booking = roomBookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room booking not found"));

        if (booking.getBookingStatus() != RoomBookingStatus.CANCELLATION_REQUESTED) {
            throw new BadRequestException("Cancellation request is not pending for this booking");
        }

        booking.setBookingStatus(RoomBookingStatus.CANCELLED);
        RoomBooking saved = roomBookingRepository.save(booking);
        auditService.log("APPROVE_CANCELLATION", "RoomBooking", id.toString(), getCurrentUsername(), "Approved booking cancellation");
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        RoomBooking booking = roomBookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room booking not found"));
        roomBookingRepository.delete(booking);
        auditService.log("DELETE", "RoomBooking", id.toString(), getCurrentUsername(), "Deleted room booking");
    }

    @Override
    public RoomAvailabilityResponse checkAvailability(String roomNumber, LocalDate checkInDate, LocalDate checkOutDate) {
        // Validate input dates
        if (checkOutDate.isBefore(checkInDate) || checkOutDate.isEqual(checkInDate)) {
            throw new BadRequestException("Check-out date must be after check-in date");
        }

        // Get room
        Room room = getRoom(roomNumber);

        // Calculate remaining rooms for the requested date range
        int totalRooms = room.getTotalRooms() == null ? 1 : room.getTotalRooms();
        Integer bookedRooms = roomBookingRepository.sumBookedRoomsByRoomNumber(
                room.getRoomNumber(),
                ACTIVE_BOOKING_STATUSES,
                checkInDate,
                checkOutDate,
                null
        );
        int remainingRooms = Math.max(0, totalRooms - (bookedRooms == null ? 0 : bookedRooms));

        // Determine availability status
        RoomStatus roomStatus = room.getRoomStatus() == null ? RoomStatus.AVAILABLE : room.getRoomStatus();
        boolean isAvailable = roomStatus == RoomStatus.AVAILABLE && remainingRooms > 0;
        String message = isAvailable
                ? String.format("Room %s is available with %d room(s) remaining", roomNumber, remainingRooms)
            : String.format("Room %s is not available for the selected dates", roomNumber);

        return RoomAvailabilityResponse.builder()
                .roomNumber(room.getRoomNumber())
                .checkInDate(checkInDate)
                .checkOutDate(checkOutDate)
                .available(isAvailable)
                .remainingRooms(remainingRooms)
                .totalRooms(totalRooms)
                .message(message)
                .build();
    }

    private Room getRoom(String roomNumber) {
        String normalizedRoomNumber = roomNumber.trim();
        return roomRepository.findByRoomNumberIgnoreCase(normalizedRoomNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    private RoomBooking mapToEntity(RoomBooking booking, RoomBookingRequest request, Room room) {
        if (request.getCheckOutDate().isBefore(request.getCheckInDate()) || request.getCheckOutDate().isEqual(request.getCheckInDate())) {
            throw new BadRequestException("Check-out date must be after check-in date");
        }

        long nights = ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        if (nights < 1) {
            throw new BadRequestException("Booking duration must be at least 1 day");
        }

        int bookedRooms = request.getBookedRooms() == null ? 1 : request.getBookedRooms();
        BigDecimal amount = calculateAmountForStay(room, request.getCheckInDate(), request.getCheckOutDate(), bookedRooms);

        booking.setBookingCustomer(request.getBookingCustomer().trim());
        booking.setCustomerEmail(request.getCustomerEmail().trim());
        booking.setRoomNumber(room.getRoomNumber());
        booking.setRoom(room);
        booking.setBookedRooms(bookedRooms);
        booking.setGuestCount(request.getGuestCount());
        booking.setBookingStatus(RoomBookingStatus.BOOKED);
        booking.setAmount(amount);
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        return booking;
    }

    private Integer resolveNextBookingSequence() {
        Number maxSequence = roomBookingRepository.findMaxBookingSequence();
        long currentMax = maxSequence == null ? 0L : maxSequence.longValue();
        return (int) currentMax + 1;
    }

    private BigDecimal calculateAmountForStay(Room room, LocalDate checkInDate, LocalDate checkOutDate, int bookedRooms) {
        BigDecimal total = BigDecimal.ZERO;
        LocalDate currentDate = checkInDate;

        while (currentDate.isBefore(checkOutDate)) {
            total = total.add(resolveRatePerNight(room, currentDate));
            currentDate = currentDate.plusDays(1);
        }

        return total.multiply(BigDecimal.valueOf(bookedRooms));
    }

    private BigDecimal resolveRatePerNight(Room room, LocalDate stayDate) {
        if (isSeasonalDate(stayDate) && room.getSeasonalPrice() != null) {
            return room.getSeasonalPrice();
        }

        if (isWeekendDate(stayDate)) {
            return room.getWeekendPrice() != null ? room.getWeekendPrice() : room.getNormalPrice();
        }

        return room.getNormalPrice();
    }

    private boolean isWeekendDate(LocalDate stayDate) {
        return stayDate.getDayOfWeek().getValue() >= 5;
    }

    private boolean isSeasonalDate(LocalDate stayDate) {
        Month month = stayDate.getMonth();
        return month == Month.DECEMBER || month == Month.JANUARY || month == Month.JUNE || month == Month.JULY;
    }

    private void validateAvailability(Room room, Integer requestedRooms, Long excludeBookingId, LocalDate checkInDate, LocalDate checkOutDate) {
        RoomStatus roomStatus = room.getRoomStatus() == null ? RoomStatus.AVAILABLE : room.getRoomStatus();
        if (roomStatus != RoomStatus.AVAILABLE) {
            throw new BadRequestException("Room " + room.getRoomNumber() + " is currently " + roomStatus + " and cannot be booked");
        }

        int totalRooms = room.getTotalRooms() == null ? 1 : room.getTotalRooms();
        int roomsRequested = requestedRooms == null ? 1 : requestedRooms;
        Integer activeBooked = roomBookingRepository.sumBookedRoomsByRoomNumber(
                room.getRoomNumber(),
                ACTIVE_BOOKING_STATUSES,
                checkInDate,
                checkOutDate,
                excludeBookingId
        );
        int remainingRooms = Math.max(0, totalRooms - (activeBooked == null ? 0 : activeBooked));

        boolean hasOverlap = roomBookingRepository.existsOverlappingBooking(
                room.getRoomNumber(),
                ACTIVE_BOOKING_STATUSES,
                checkInDate,
                checkOutDate,
                excludeBookingId
        );

        if (hasOverlap && remainingRooms < roomsRequested) {
            throw new BadRequestException("This room is already booked");
        }

        if (roomsRequested > remainingRooms) {
            throw new BadRequestException("Only " + remainingRooms + " room(s) remaining for room number " + room.getRoomNumber());
        }
    }

    private RoomBookingResponse toResponse(RoomBooking booking) {
        Room room = null;
        if (booking.getRoomNumber() != null) {
            room = roomRepository.findByRoomNumberIgnoreCase(booking.getRoomNumber()).orElse(null);
        }

        return RoomBookingResponse.builder()
                .id(booking.getId())
                .bookingSequence(booking.getBookingSequence())
                .bookingCustomer(booking.getBookingCustomer())
                .customerEmail(booking.getCustomerEmail())
                .roomNumber(booking.getRoomNumber())
                .bookedRooms(booking.getBookedRooms() == null ? 1 : booking.getBookedRooms())
                .guestCount(booking.getGuestCount() == null ? 1 : booking.getGuestCount())
                .roomType(room == null ? RoomType.STANDARD : room.getRoomType())
                .guests(room == null ? null : room.getCapacity())
                .bookingStatus(booking.getBookingStatus())
                .amount(booking.getAmount())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .createdAt(booking.getCreatedAt())
                .build();
    }

    private RoomBookingResponse safeToResponse(RoomBooking booking) {
        try {
            return toResponse(booking);
        } catch (Exception ex) {
            return RoomBookingResponse.builder()
                    .id(booking.getId())
                    .bookingSequence(booking.getBookingSequence())
                    .bookingCustomer(booking.getBookingCustomer())
                    .customerEmail(booking.getCustomerEmail())
                    .roomNumber(booking.getRoomNumber())
                    .bookedRooms(booking.getBookedRooms() == null ? 1 : booking.getBookedRooms())
                    .guestCount(booking.getGuestCount() == null ? 1 : booking.getGuestCount())
                    .roomType(RoomType.STANDARD)
                    .guests(null)
                    .bookingStatus(booking.getBookingStatus())
                    .amount(booking.getAmount())
                    .checkInDate(booking.getCheckInDate())
                    .checkOutDate(booking.getCheckOutDate())
                    .createdAt(booking.getCreatedAt())
                    .build();
        }
    }

    private String getCurrentUsername() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
