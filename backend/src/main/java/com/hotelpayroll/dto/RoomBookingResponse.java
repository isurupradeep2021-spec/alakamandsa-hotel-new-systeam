package com.hotelpayroll.dto;

import com.hotelpayroll.entity.RoomBookingStatus;
import com.hotelpayroll.entity.RoomType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class RoomBookingResponse {
    private Long id;
    private String bookingCustomer;
    private String customerEmail;
    private String roomNumber;
    private Integer bookedRooms;
    private Integer guestCount;
    private RoomType roomType;
    private Integer guests;
    private RoomBookingStatus bookingStatus;
    private BigDecimal amount;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private LocalDateTime createdAt;
}
