package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.DashboardRoomInsight;
import com.hotelpayroll.dto.DashboardResponse;
import com.hotelpayroll.entity.AuditLog;
import com.hotelpayroll.entity.Room;
import com.hotelpayroll.entity.RoomBooking;
import com.hotelpayroll.entity.StaffStatus;
import com.hotelpayroll.repository.AuditLogRepository;
import com.hotelpayroll.repository.PayrollRepository;
import com.hotelpayroll.repository.RoomBookingRepository;
import com.hotelpayroll.repository.RoomRepository;
import com.hotelpayroll.repository.StaffRepository;
import com.hotelpayroll.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final StaffRepository staffRepository;
    private final PayrollRepository payrollRepository;
    private final RoomRepository roomRepository;
    private final RoomBookingRepository roomBookingRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    public DashboardResponse getSummary() {
        long totalStaff = staffRepository.findAll().stream().filter(s -> s.getStatus() == StaffStatus.ACTIVE).count();
        long totalPayrollRecords = payrollRepository.count();
        BigDecimal totalSalaryPaid = payrollRepository.findAll().stream()
                .map(p -> p.getNetSalary() == null ? BigDecimal.ZERO : p.getNetSalary())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalRooms = roomRepository.count();
        long roomBookings = roomBookingRepository.count();

        LocalDate today = LocalDate.now();
        LocalDate currentStart = today.minusDays(6);
        LocalDate previousStart = today.minusDays(13);
        LocalDate previousEnd = today.minusDays(7);

        List<AuditLog> roomCreateLogs = auditLogRepository.findAll().stream()
            .filter(log -> "CREATE".equalsIgnoreCase(log.getAction()))
            .filter(log -> "Room".equalsIgnoreCase(log.getEntityName()))
            .toList();

        long createdRoomsCurrentWeek = roomCreateLogs.stream()
            .filter(log -> log.getCreatedAt() != null)
            .filter(log -> isBetween(log.getCreatedAt().toLocalDate(), currentStart, today))
            .count();

        long createdRoomsPreviousWeek = roomCreateLogs.stream()
            .filter(log -> log.getCreatedAt() != null)
            .filter(log -> isBetween(log.getCreatedAt().toLocalDate(), previousStart, previousEnd))
            .count();

        List<RoomBooking> allBookings = roomBookingRepository.findAll();

        long bookingsCurrentWeek = allBookings.stream()
            .filter(b -> b.getCreatedAt() != null)
            .filter(b -> isBetween(b.getCreatedAt().toLocalDate(), currentStart, today))
            .count();

        long bookingsPreviousWeek = allBookings.stream()
            .filter(b -> b.getCreatedAt() != null)
            .filter(b -> isBetween(b.getCreatedAt().toLocalDate(), previousStart, previousEnd))
            .count();

        Map<String, Long> bookingCountByRoom = allBookings.stream()
            .collect(Collectors.groupingBy(RoomBooking::getRoomNumber, Collectors.counting()));

        roomRepository.findAll().stream()
            .map(Room::getRoomNumber)
            .forEach(roomNumber -> bookingCountByRoom.putIfAbsent(roomNumber, 0L));

        List<DashboardRoomInsight> mostBookedRooms = bookingCountByRoom.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder())
                .thenComparing(Map.Entry.comparingByKey()))
            .limit(3)
            .map(entry -> DashboardRoomInsight.builder()
                .roomNumber(entry.getKey())
                .bookings(entry.getValue())
                .build())
            .toList();

        List<DashboardRoomInsight> leastBookedRooms = bookingCountByRoom.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue()
                .thenComparing(Map.Entry.comparingByKey()))
            .limit(3)
            .map(entry -> DashboardRoomInsight.builder()
                .roomNumber(entry.getKey())
                .bookings(entry.getValue())
                .build())
            .toList();

        return DashboardResponse.builder()
                .totalStaff(totalStaff)
                .totalPayrollRecords(totalPayrollRecords)
                .totalSalaryPaid(totalSalaryPaid)
            .totalRooms(totalRooms)
            .roomBookings(roomBookings)
            .totalRoomsChangePercent(calculatePercentageChange(createdRoomsCurrentWeek, createdRoomsPreviousWeek))
            .roomBookingsChangePercent(calculatePercentageChange(bookingsCurrentWeek, bookingsPreviousWeek))
            .mostBookedRooms(mostBookedRooms)
            .leastBookedRooms(leastBookedRooms)
                .build();
    }

        private boolean isBetween(LocalDate target, LocalDate start, LocalDate end) {
        return (target.isEqual(start) || target.isAfter(start))
            && (target.isEqual(end) || target.isBefore(end));
        }

        private double calculatePercentageChange(long current, long previous) {
        if (previous == 0L) {
            return current > 0L ? 100.0 : 0.0;
        }

        double raw = ((double) (current - previous) / (double) previous) * 100.0;
        return BigDecimal.valueOf(raw).setScale(1, RoundingMode.HALF_UP).doubleValue();
        }
}
