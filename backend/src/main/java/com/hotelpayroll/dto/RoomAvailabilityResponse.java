package com.hotelpayroll.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
@AllArgsConstructor
public class RoomAvailabilityResponse {
    private String roomNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private boolean available;
    private Integer remainingRooms;
    private Integer totalRooms;
    private String message;
}

