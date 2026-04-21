package com.hotelpayroll.dto;

import com.hotelpayroll.entity.RoomStatus;
import com.hotelpayroll.entity.RoomType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class RoomRequest {

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotNull(message = "Room type is required")
    private RoomType roomType;

    @NotBlank(message = "Photo URL is required")
    private String photoUrl;

    @NotBlank(message = "Room description is required")
    private String roomDescription;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotNull(message = "Normal price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Normal price must be greater than 0")
    private BigDecimal normalPrice;

    @NotNull(message = "Weekend price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Weekend price must be greater than 0")
    private BigDecimal weekendPrice;

    @DecimalMin(value = "0.0", inclusive = false, message = "Seasonal price must be greater than 0")
    private BigDecimal seasonalPrice;

    @NotNull(message = "Room status is required")
    private RoomStatus roomStatus;
}
