package com.hotelpayroll.controller;

import com.hotelpayroll.dto.RoomAvailabilityResponse;
import com.hotelpayroll.dto.RoomBookingRequest;
import com.hotelpayroll.dto.RoomBookingResponse;
import com.hotelpayroll.service.RoomBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/room-bookings")
@RequiredArgsConstructor
public class RoomBookingController {

    private final RoomBookingService roomBookingService;

    @PreAuthorize("hasAnyRole('MANAGER','CUSTOMER')")
    @PostMapping
    public RoomBookingResponse create(@Valid @RequestBody RoomBookingRequest request) {
        return roomBookingService.create(request);
    }

    @PreAuthorize("hasAnyRole('MANAGER')")
    @PutMapping("/{id}")
    public RoomBookingResponse update(@PathVariable Long id, @Valid @RequestBody RoomBookingRequest request) {
        return roomBookingService.update(id, request);
    }

    @PreAuthorize("hasAnyRole('MANAGER')")
    @GetMapping
    public List<RoomBookingResponse> getAll() {
        return roomBookingService.getAll();
    }

    @PreAuthorize("hasAnyRole('CUSTOMER')")
    @GetMapping("/my")
    public List<RoomBookingResponse> getMyBookings() {
        return roomBookingService.getMyBookings();
    }

    @PreAuthorize("hasAnyRole('MANAGER','CUSTOMER')")
    @GetMapping("/check-availability")
    public RoomAvailabilityResponse checkAvailability(
            @RequestParam String roomNumber,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate
    ) {
        return roomBookingService.checkAvailability(roomNumber, checkInDate, checkOutDate);
    }

    @PreAuthorize("hasAnyRole('MANAGER')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        roomBookingService.delete(id);
    }
}
