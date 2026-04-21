package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.RoomBookingRequest;
import com.hotelpayroll.dto.RoomBookingResponse;
import com.hotelpayroll.entity.RoomBooking;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.repository.RoomBookingRepository;
import com.hotelpayroll.repository.RoomRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.RoomBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoomBookingServiceImpl implements RoomBookingService {

    private final RoomBookingRepository roomBookingRepository;
    private final RoomRepository roomRepository;
    private final AuditService auditService;

    @Override
    public RoomBookingResponse create(RoomBookingRequest request) {
        String roomNumber = request.getRoomNumber().trim();
        if (!roomRepository.findByRoomNumberIgnoreCase(roomNumber).isPresent()) {
            throw new ResourceNotFoundException("Room not found");
        }

        if (request.getCheckOutDate().isBefore(request.getCheckInDate()) || request.getCheckOutDate().isEqual(request.getCheckInDate())) {
            throw new BadRequestException("Check-out date must be after check-in date");
        }

        RoomBooking booking = RoomBooking.builder()
                .bookingCustomer(request.getBookingCustomer().trim())
                .customerEmail(request.getCustomerEmail().trim())
                .roomNumber(roomNumber)
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .build();

        RoomBooking saved = roomBookingRepository.save(booking);
        auditService.log("CREATE", "RoomBooking", saved.getId().toString(), "system", "Created room booking");
        return toResponse(saved);
    }

    private RoomBookingResponse toResponse(RoomBooking booking) {
        return RoomBookingResponse.builder()
                .id(booking.getId())
                .bookingCustomer(booking.getBookingCustomer())
                .customerEmail(booking.getCustomerEmail())
                .roomNumber(booking.getRoomNumber())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
