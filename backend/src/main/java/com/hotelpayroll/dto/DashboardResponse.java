package com.hotelpayroll.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private long totalStaff;
    private BigDecimal totalSalaryPaid;
    private long totalPayrollRecords;
    private long totalRooms;
    private long roomBookings;
    private double totalRoomsChangePercent;
    private double roomBookingsChangePercent;
    private List<DashboardRoomInsight> mostBookedRooms;
    private List<DashboardRoomInsight> leastBookedRooms;
}
