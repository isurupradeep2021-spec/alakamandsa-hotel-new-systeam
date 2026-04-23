package com.hotelpayroll.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardRoomInsight {
    private String roomNumber;
    private long bookings;
}
