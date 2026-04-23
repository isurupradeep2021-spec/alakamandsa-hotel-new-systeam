package com.hotelpayroll.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReservationTableAssignRequest {

    @NotBlank(message = "Table identifier is required")
    @Size(max = 30, message = "Table identifier cannot exceed 30 characters")
    private String assignedTable;
}
