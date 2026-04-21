package com.hotelpayroll.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PayrollRequest {

    @NotNull
    private Long staffId;

    @NotNull
    @Min(1)
    @Max(12)
    private Integer month;

    @NotNull
    @Min(2000)
    @Max(2100)
    private Integer year;
}
