package com.hotelpayroll.service;

import com.hotelpayroll.entity.EventBooking;
import com.hotelpayroll.entity.Role;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.repository.EventBookingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventBookingServiceTest {

    @Mock
    private EventBookingRepository repository;

    @InjectMocks
    private EventBookingService eventBookingService;

    @Test
    void prepareForSave_calculatesDurationAndPremiumTotalPrice() {
        EventBooking booking = EventBooking.builder()
                .customerName("Nimal Perera")
                .customerEmail("Nimal@example.com")
                .customerMobile("0771234567")
                .eventType("Wedding")
                .hallName("Grand Ballroom")
                .packageName("Premium")
                .eventDateTime(LocalDateTime.of(2026, 4, 10, 10, 0))
                .endDateTime(LocalDateTime.of(2026, 4, 10, 14, 30))
                .attendees(200)
                .pricePerGuest(new BigDecimal("25000"))
                .status("INQUIRY")
                .build();

        when(repository.findByHallNameIgnoreCase("Grand Ballroom")).thenReturn(List.of());

        EventBooking saved = eventBookingService.prepareForSave(booking, null);

        assertEquals("nimal@example.com", saved.getCustomerEmail());
        assertEquals(4.5, saved.getDurationHours());
        assertEquals(new BigDecimal("122500.00"), saved.getTotalPrice());
        assertEquals(new BigDecimal("122500.00"), saved.getTotalCost());
        assertEquals("Premium", saved.getPackageName());
    }

    @Test
    void prepareForSave_throwsWhenHallHasOverlappingBooking() {
        EventBooking existing = EventBooking.builder()
                .id(5L)
                .hallName("Grand Ballroom")
                .status("CONFIRMED")
                .eventDateTime(LocalDateTime.of(2026, 4, 10, 12, 0))
                .endDateTime(LocalDateTime.of(2026, 4, 10, 15, 0))
                .build();

        EventBooking newBooking = EventBooking.builder()
                .customerName("Kasun Silva")
                .customerEmail("kasun@example.com")
                .customerMobile("0712345678")
                .eventType("Conference")
                .hallName("Grand Ballroom")
                .packageName("Standard")
                .eventDateTime(LocalDateTime.of(2026, 4, 10, 13, 0))
                .endDateTime(LocalDateTime.of(2026, 4, 10, 16, 0))
                .attendees(80)
                .pricePerGuest(new BigDecimal("10000"))
                .status("INQUIRY")
                .build();

        when(repository.findByHallNameIgnoreCase("Grand Ballroom")).thenReturn(List.of(existing));

        BadRequestException error = assertThrows(
                BadRequestException.class,
                () -> eventBookingService.prepareForSave(newBooking, null)
        );

        assertEquals("Hall conflict detected for the selected time range", error.getMessage());
    }

    @Test
    void listBookings_returnsOnlyCustomerOwnedRowsForCustomerRole() {
        EventBooking booking = EventBooking.builder().id(1L).createdByUsername("customer-1").build();
        when(repository.findByCreatedByUsernameOrderByEventDateTimeDesc("customer-1")).thenReturn(List.of(booking));

        List<EventBooking> result = eventBookingService.listBookings(Role.CUSTOMER, "customer-1");

        assertEquals(1, result.size());
        assertEquals("customer-1", result.get(0).getCreatedByUsername());
    }

    @Test
    void createBooking_forCustomerAssignsOwnershipAndInquiryStatus() {
        EventBooking booking = EventBooking.builder()
                .customerName("Customer User")
                .customerEmail("customer@example.com")
                .customerMobile("0777777777")
                .eventType("Birthday")
                .hallName("Garden Pavilion")
                .packageName("Standard")
                .eventDateTime(LocalDateTime.of(2026, 6, 1, 18, 0))
                .endDateTime(LocalDateTime.of(2026, 6, 1, 22, 0))
                .attendees(60)
                .pricePerGuest(new BigDecimal("12000"))
                .status("CONFIRMED")
                .build();

        when(repository.findByHallNameIgnoreCase("Garden Pavilion")).thenReturn(List.of());
        when(repository.save(org.mockito.ArgumentMatchers.any(EventBooking.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        EventBooking saved = eventBookingService.createBooking(booking, "customer-login", Role.CUSTOMER);

        assertEquals("customer-login", saved.getCreatedByUsername());
        assertEquals("INQUIRY", saved.getStatus());
        verify(repository).save(org.mockito.ArgumentMatchers.any(EventBooking.class));
    }
}
