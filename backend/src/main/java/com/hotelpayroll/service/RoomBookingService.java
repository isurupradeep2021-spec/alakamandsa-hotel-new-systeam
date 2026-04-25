package com.hotelpayroll.service;

import com.hotelpayroll.dto.RoomAvailabilityResponse;
import com.hotelpayroll.dto.RoomBookingRequest;
import com.hotelpayroll.dto.RoomBookingResponse;

import java.time.LocalDate;
import java.util.List;

public interface RoomBookingService {
    RoomBookingResponse create(RoomBookingRequest request);
    RoomBookingResponse update(Long id, RoomBookingRequest request);
    List<RoomBookingResponse> getAll();
    List<RoomBookingResponse> getMyBookings();
    RoomBookingResponse requestCancellation(Long id);
    RoomBookingResponse approveCancellation(Long id);
    void delete(Long id);
    RoomAvailabilityResponse checkAvailability(String roomNumber, LocalDate checkInDate, LocalDate checkOutDate);
}
