package com.hotelpayroll.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String bookingCustomer;

    @Column(nullable = false)
    private String customerEmail;

    @Column
    private String createdByUsername;

    @Column(nullable = false)
    private String roomNumber;

    @Column
    @Builder.Default
    private Integer bookedRooms = 1;

    @Column
    @Builder.Default
    private Integer guestCount = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RoomBookingStatus bookingStatus = RoomBookingStatus.BOOKED;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate checkInDate;

    @Column(nullable = false)
    private LocalDate checkOutDate;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
