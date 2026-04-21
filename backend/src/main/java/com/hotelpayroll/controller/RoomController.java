package com.hotelpayroll.controller;

import com.hotelpayroll.dto.RoomRequest;
import com.hotelpayroll.dto.RoomResponse;
import com.hotelpayroll.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @PutMapping("/{id}")
    public RoomResponse update(@PathVariable Long id, @Valid @RequestBody RoomRequest request) {
        return roomService.update(id, request);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @GetMapping
    public List<RoomResponse> getAll() {
        return roomService.getAll();
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        roomService.delete(id);
    }
}
