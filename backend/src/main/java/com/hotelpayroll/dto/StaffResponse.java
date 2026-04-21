package com.hotelpayroll.dto;

import com.hotelpayroll.entity.StaffStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class StaffResponse {
    private Long id;
    private String name;
    private String position;
    private BigDecimal basicSalary;
    private Integer attendance;
    private Double overtimeHours;
    private Integer absentDays;
    private BigDecimal overtimeRate;
    private BigDecimal dailyRate;
    private StaffStatus status;
}
