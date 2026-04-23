package com.hotelpayroll.dto;

import com.hotelpayroll.entity.MealType;
import com.hotelpayroll.entity.SeatingPreference;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ReservationRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 120, message = "Name must be between 2 and 120 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(
            regexp = "^\\+?[0-9][0-9\\-()\\s]{7,19}$",
            message = "Please provide a valid phone number"
    )
    private String phone;

    @NotNull(message = "Date is required")
    @FutureOrPresent(message = "Reservation date cannot be in the past")
    private LocalDate reservationDate;

    @NotNull(message = "Meal is required")
    private MealType mealType;

    @NotNull(message = "Guest count is required")
    @Min(value = 1, message = "At least 1 guest is required")
    @Max(value = 20, message = "Maximum 20 guests allowed per booking")
    private Integer guestCount;

    @NotNull(message = "Seating preference is required")
    private SeatingPreference seatingPreference;

    @Size(max = 1000, message = "Special requests cannot exceed 1000 characters")
    private String specialRequests;
}
