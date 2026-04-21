package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.RoomBookingRequest;
import com.hotelpayroll.dto.RoomBookingResponse;
import com.hotelpayroll.entity.RoomBooking;
import com.hotelpayroll.entity.RoomBookingStatus;
import com.hotelpayroll.entity.Room;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.repository.RoomBookingRepository;
import com.hotelpayroll.repository.RoomRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.RoomBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomBookingServiceImpl implements RoomBookingService {

    private final RoomBookingRepository roomBookingRepository;
    private final RoomRepository roomRepository;
    private final AuditService auditService;

    @Override
    public RoomBookingResponse create(RoomBookingRequest request) {
        Room room = getRoom(request.getRoomNumber());
        RoomBooking booking = mapToEntity(new RoomBooking(), request, room);
        RoomBooking saved = roomBookingRepository.save(booking);
        auditService.log("CREATE", "RoomBooking", saved.getId().toString(), "system", "Created room booking");
        return toResponse(saved);
    }

    @Override
    public RoomBookingResponse update(Long id, RoomBookingRequest request) {
        RoomBooking booking = roomBookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room booking not found"));
        Room room = getRoom(request.getRoomNumber());
        booking = mapToEntity(booking, request, room);
        RoomBooking saved = roomBookingRepository.save(booking);
        auditService.log("UPDATE", "RoomBooking", saved.getId().toString(), "system", "Updated room booking");
        return toResponse(saved);
    }

    @Override
    public List<RoomBookingResponse> getAll() {
        return roomBookingRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void delete(Long id) {
        RoomBooking booking = roomBookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room booking not found"));
        roomBookingRepository.delete(booking);
        auditService.log("DELETE", "RoomBooking", id.toString(), "system", "Deleted room booking");
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

        BigDecimal amount = room.getNormalPrice().multiply(BigDecimal.valueOf(nights));

        booking.setBookingCustomer(request.getBookingCustomer().trim());
        booking.setCustomerEmail(request.getCustomerEmail().trim());
        booking.setRoomNumber(room.getRoomNumber());
        booking.setBookingStatus(RoomBookingStatus.BOOKED);
        booking.setAmount(amount);
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        return booking;
    }

    private RoomBookingResponse toResponse(RoomBooking booking) {
        return RoomBookingResponse.builder()
                .id(booking.getId())
                .bookingCustomer(booking.getBookingCustomer())
                .customerEmail(booking.getCustomerEmail())
                .roomNumber(booking.getRoomNumber())
                .bookingStatus(booking.getBookingStatus())
                .amount(booking.getAmount())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
