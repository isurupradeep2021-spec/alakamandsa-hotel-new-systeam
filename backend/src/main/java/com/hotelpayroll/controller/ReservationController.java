package com.hotelpayroll.controller;

import com.hotelpayroll.dto.ReservationRequest;
import com.hotelpayroll.dto.ReservationResponse;
import com.hotelpayroll.dto.ReservationStatusUpdateRequest;
import com.hotelpayroll.dto.ReservationTableAssignRequest;
import com.hotelpayroll.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PreAuthorize("hasAuthority('CREATE_RESERVATIONS')")
    @PostMapping
    public ReservationResponse create(@Valid @RequestBody ReservationRequest request, Authentication authentication) {
        return reservationService.create(request, authentication.getName());
    }

    @PreAuthorize("hasAuthority('CREATE_RESERVATIONS')")
    @GetMapping("/my")
    public List<ReservationResponse> getMine(Authentication authentication) {
        return reservationService.getMine(authentication.getName());
    }

    @PreAuthorize("hasAuthority('VIEW_RESERVATIONS')")
    @GetMapping
    public List<ReservationResponse> getAll() {
        return reservationService.getAll();
    }

    @PreAuthorize("hasAuthority('UPDATE_RESERVATION_STATUS') or hasRole('RESTAURANT_MANAGER') or hasRole('SUPER_ADMIN')")
    @PatchMapping("/{id}/status")
    public ReservationResponse updateStatus(@PathVariable Long id, @Valid @RequestBody ReservationStatusUpdateRequest request) {
        return reservationService.updateStatus(id, request.getStatus());
    }

    @PreAuthorize("hasAuthority('ASSIGN_TABLES') or hasRole('SUPER_ADMIN')")
    @PatchMapping("/{id}/assign-table")
    public ReservationResponse assignTable(@PathVariable Long id, @Valid @RequestBody ReservationTableAssignRequest request) {
        return reservationService.assignTable(id, request.getAssignedTable());
    }

    @PreAuthorize("hasAuthority('CANCEL_RESERVATIONS')")
    @PostMapping("/{id}/cancel")
    public ReservationResponse cancel(@PathVariable Long id) {
        return reservationService.cancel(id);
    }
}
