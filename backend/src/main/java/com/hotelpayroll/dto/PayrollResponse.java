package com.hotelpayroll.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PayrollResponse {
    private Long id;
    private Long staffId;
    private String staffName;
    private BigDecimal basicSalary;
    private BigDecimal overtimePay;
    private BigDecimal deductions;
    private BigDecimal netSalary;
    private Integer month;
    private Integer year;
}
