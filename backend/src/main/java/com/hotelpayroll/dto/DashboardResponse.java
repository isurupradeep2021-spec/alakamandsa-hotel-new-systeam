package com.hotelpayroll.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardResponse {
    private long totalStaff;
    private BigDecimal totalSalaryPaid;
    private long totalPayrollRecords;
}
