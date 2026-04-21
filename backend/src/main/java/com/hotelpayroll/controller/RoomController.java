package com.hotelpayroll.controller;

import com.hotelpayroll.dto.RoomRequest;
import com.hotelpayroll.dto.RoomResponse;
import com.hotelpayroll.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @PostMapping
    public RoomResponse create(@Valid @RequestBody RoomRequest request) {
        return roomService.create(request);
    }
}
