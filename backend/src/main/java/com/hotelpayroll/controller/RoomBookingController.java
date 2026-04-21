package com.hotelpayroll.controller;

import com.hotelpayroll.dto.RoomBookingRequest;
import com.hotelpayroll.dto.RoomBookingResponse;
import com.hotelpayroll.service.RoomBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/room-bookings")
@RequiredArgsConstructor
public class RoomBookingController {

    private final RoomBookingService roomBookingService;

    @PreAuthorize("hasAnyRole('MANAGER')")
    @PostMapping
    public RoomBookingResponse create(@Valid @RequestBody RoomBookingRequest request) {
        return roomBookingService.create(request);
    }
}
