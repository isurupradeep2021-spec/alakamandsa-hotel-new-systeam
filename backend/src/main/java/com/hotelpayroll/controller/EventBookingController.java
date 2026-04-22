package com.hotelpayroll.controller;

import com.hotelpayroll.entity.EventBooking;
import com.hotelpayroll.entity.Role;
import com.hotelpayroll.service.EventBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/event-bookings")
@RequiredArgsConstructor
public class EventBookingController {

    private final EventBookingService eventBookingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER', 'CUSTOMER')")
    public List<EventBooking> getAll(Authentication authentication) {
        return eventBookingService.listBookings(currentRole(authentication), authentication.getName());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER', 'CUSTOMER')")
    public EventBooking create(@RequestBody EventBooking booking, Authentication authentication) {
        return eventBookingService.createBooking(booking, authentication.getName(), currentRole(authentication));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER')")
    public EventBooking update(@PathVariable Long id, @RequestBody EventBooking booking) {
        return eventBookingService.updateBooking(id, booking);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER')")
    public void delete(@PathVariable Long id) {
        eventBookingService.deleteBooking(id);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER')")
    public Map<String, Object> analytics() {
        List<EventBooking> rows = eventBookingService.listBookings(Role.EVENT_MANAGER, "analytics");

        Map<String, Long> byType = rows.stream()
                .collect(Collectors.groupingBy(r -> r.getEventType() == null ? "Unknown" : r.getEventType(), Collectors.counting()));

        return Map.of(
                "events", rows.size(),
                "eventRevenue", eventBookingService.sumRevenue(rows),
                "popularTypes", byType
        );
    }

    private Role currentRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                .map(Role::valueOf)
                .orElse(Role.CUSTOMER);
    }
}
