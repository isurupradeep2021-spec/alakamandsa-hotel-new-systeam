package com.hotelpayroll.dto;

import com.hotelpayroll.entity.MealType;
import com.hotelpayroll.entity.ReservationStatus;
import com.hotelpayroll.entity.SeatingPreference;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ReservationResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String createdByUsername;
    private LocalDate reservationDate;
    private MealType mealType;
    private Integer guestCount;
    private SeatingPreference seatingPreference;
    private String specialRequests;
    private String assignedTable;
    private ReservationStatus status;
    private LocalDateTime createdAt;
}
