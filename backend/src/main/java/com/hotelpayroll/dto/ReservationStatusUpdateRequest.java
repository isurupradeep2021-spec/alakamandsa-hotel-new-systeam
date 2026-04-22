package com.hotelpayroll.dto;

import com.hotelpayroll.entity.ReservationStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReservationStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private ReservationStatus status;

    @AssertTrue(message = "Use cancel endpoint to set CANCELLED status")
    public boolean isAllowedStatusUpdate() {
        return status != ReservationStatus.CANCELLED;
    }
}
