package com.hotelpayroll.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StaffRequest {
    @NotBlank(message = "Name cannot be empty")
    private String name;

    @NotBlank(message = "Position cannot be empty")
    private String position;

    @NotNull
    @DecimalMin(value = "0.01", message = "Salary must be greater than 0")
    private BigDecimal basicSalary;

    @NotNull
    @Min(value = 0, message = "Attendance cannot be negative")
    @Max(value = 31, message = "Attendance cannot exceed total days in month")
    private Integer attendance;

    @NotNull
    @DecimalMin(value = "0.0", message = "Overtime hours cannot be negative")
    private Double overtimeHours;

    @NotNull
    @Min(value = 0, message = "Absent days cannot be negative")
    private Integer absentDays;

    @NotNull
    @DecimalMin(value = "0.01", message = "Overtime rate must be greater than 0")
    private BigDecimal overtimeRate;

    @NotNull
    @DecimalMin(value = "0.01", message = "Daily rate must be greater than 0")
    private BigDecimal dailyRate;

    private Long userId;
}
