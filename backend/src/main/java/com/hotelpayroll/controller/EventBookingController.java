package com.hotelpayroll.controller;

import com.hotelpayroll.entity.EventBooking;
import com.hotelpayroll.entity.Role;
import com.hotelpayroll.repository.EventBookingRepository;
import com.hotelpayroll.service.EventBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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

    private final EventBookingRepository repository;
    private final EventBookingService eventBookingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER', 'CUSTOMER')")
    public List<EventBooking> getAll(Authentication authentication) {
        return eventBookingService.listBookings(resolveRole(authentication), authentication.getName());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER', 'CUSTOMER')")
    public EventBooking create(@RequestBody EventBooking booking, Authentication authentication) {
        return eventBookingService.createBooking(booking, authentication.getName(), resolveRole(authentication));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER')")
    public EventBooking update(@PathVariable Long id, @RequestBody EventBooking booking) {
        return eventBookingService.updateBooking(id, booking);
    }

    private Role resolveRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring("ROLE_".length()))
                .map(Role::valueOf)
                .findFirst()
                .orElse(Role.CUSTOMER);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER')")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'EVENT_MANAGER')")
    public Map<String, Object> analytics() {
        List<EventBooking> rows = repository.findAll();

        Map<String, Long> byType = rows.stream()
                .collect(Collectors.groupingBy(r -> r.getEventType() == null ? "Unknown" : r.getEventType(), Collectors.counting()));

        return Map.of(
                "events", rows.size(),
                "eventRevenue", eventBookingService.sumRevenue(rows),
                "popularTypes", byType
        );
    }
}
