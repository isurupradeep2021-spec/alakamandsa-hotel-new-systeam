package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.AiChatRequest;
import com.hotelpayroll.dto.AiChatResponse;
import com.hotelpayroll.entity.EventBooking;
import com.hotelpayroll.entity.MenuItem;
import com.hotelpayroll.entity.Payroll;
import com.hotelpayroll.entity.Reservation;
import com.hotelpayroll.entity.Room;
import com.hotelpayroll.entity.RoomBooking;
import com.hotelpayroll.entity.RoomStatus;
import com.hotelpayroll.entity.User;
import com.hotelpayroll.repository.EventBookingRepository;
import com.hotelpayroll.repository.MenuItemRepository;
import com.hotelpayroll.repository.PayrollRepository;
import com.hotelpayroll.repository.ReservationRepository;
import com.hotelpayroll.repository.RoomBookingRepository;
import com.hotelpayroll.repository.RoomRepository;
import com.hotelpayroll.repository.UserRepository;
import com.hotelpayroll.service.AiChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiChatServiceImpl implements AiChatService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomBookingRepository roomBookingRepository;
    private final EventBookingRepository eventBookingRepository;
    private final MenuItemRepository menuItemRepository;
    private final ReservationRepository reservationRepository;
    private final PayrollRepository payrollRepository;

    @Override
    public AiChatResponse chat(AiChatRequest request, String username) {
        String message = request.getMessage().trim();
        User user = userRepository.findByUsername(username).orElse(null);
        List<String> modules = resolveModules(request.getModule(), message);
        String answer = buildAnswer(message, modules, user);

        return AiChatResponse.builder()
                .answer(answer)
                .modules(modules)
                .provider("Local")
                .model("codebase-chatbot")
                .configured(true)
                .build();
    }

    private String buildAnswer(String message, List<String> modules, User user) {
        String lower = message.toLowerCase(Locale.ROOT);
        List<String> parts = new ArrayList<>();

        if (modules.contains("rooms") || modules.contains("general")) {
            if (containsAny(lower, "room", "booking", "check-in", "checkout", "availability", "stay")) {
                parts.add(buildRoomAnswer(lower));
            }
        }

        if (modules.contains("restaurant") || modules.contains("general")) {
            if (containsAny(lower, "restaurant", "menu", "dining", "table", "reservation", "meal", "food")) {
                parts.add(buildRestaurantAnswer(lower));
            }
        }

        if (modules.contains("events") || modules.contains("general")) {
            if (containsAny(lower, "event", "hall", "wedding", "conference", "party", "booking")) {
                parts.add(buildEventAnswer(lower));
            }
        }

        if (modules.contains("payroll") || modules.contains("general")) {
            if (containsAny(lower, "payroll", "salary", "staff", "overtime", "deduction", "wage")) {
                parts.add(buildPayrollAnswer(lower));
            }
        }

        if (parts.isEmpty()) {
            parts.add(buildGeneralAnswer(user));
        }

        return String.join("\n\n", parts);
    }

    private String buildGeneralAnswer(User user) {
        return """
                This is the local codebase chatbot. I answer from your live hotel data, not an external AI provider.
               
                You can ask things like:
                - room availability and latest room bookings
                - menu counts and upcoming table reservations
                - upcoming events and event revenue
                - latest payroll records and salary totals
                
                Current user: %s
                """.formatted(user == null ? "unknown" : user.getFullName() + " (" + user.getRole().name() + ")");
    }

    private String buildRoomAnswer(String lower) {
        List<Room> rooms = roomRepository.findAll();
        List<RoomBooking> bookings = roomBookingRepository.findAll();
        long available = rooms.stream().filter(room -> room.getRoomStatus() == RoomStatus.AVAILABLE).count();
        long reservedOrOccupied = rooms.stream()
                .filter(room -> room.getRoomStatus() == RoomStatus.RESERVED || room.getRoomStatus() == RoomStatus.OCCUPIED)
                .count();
        long maintenance = rooms.stream().filter(room -> room.getRoomStatus() == RoomStatus.MAINTENANCE).count();

        String recentBookings = bookings.stream()
                .sorted(Comparator.comparing(RoomBooking::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(3)
                .map(booking -> "%s room %s from %s to %s (%s)".formatted(
                        safe(booking.getBookingCustomer()),
                        safe(booking.getRoomNumber()),
                        formatDate(booking.getCheckInDate()),
                        formatDate(booking.getCheckOutDate()),
                        safeEnum(booking.getBookingStatus() == null ? null : booking.getBookingStatus().name())
                ))
                .collect(Collectors.joining("; "));

        if (containsAny(lower, "availability", "available")) {
            return "Rooms summary: total " + rooms.size() + ", available " + available + ", reserved or occupied " + reservedOrOccupied + ", maintenance " + maintenance + ".";
        }

        return "Rooms summary: total " + rooms.size() + ", available " + available + ", reserved or occupied " + reservedOrOccupied + ", maintenance " + maintenance + ". Latest bookings: " + fallbackText(recentBookings, "none") + ".";
    }

    private String buildRestaurantAnswer(String lower) {
        List<MenuItem> menuItems = menuItemRepository.findAllByOrderByNameAsc();
        List<Reservation> reservations = reservationRepository.findAllByOrderByReservationDateAscCreatedAtDesc();
        long availableItems = menuItems.stream().filter(item -> Boolean.TRUE.equals(item.getAvailable())).count();
        long upcomingReservations = reservations.stream()
                .filter(reservation -> reservation.getReservationDate() != null && !reservation.getReservationDate().isBefore(LocalDate.now()))
                .count();

        Map<String, Long> cuisineCounts = menuItems.stream()
                .collect(Collectors.groupingBy(item -> item.getCuisine().name(), Collectors.counting()));

        String reservationPreview = reservations.stream()
                .filter(reservation -> reservation.getReservationDate() != null && !reservation.getReservationDate().isBefore(LocalDate.now()))
                .sorted(Comparator.comparing(Reservation::getReservationDate))
                .limit(3)
                .map(reservation -> "%s on %s for %d guests".formatted(
                        safe(reservation.getName()),
                        formatDate(reservation.getReservationDate()),
                        reservation.getGuestCount() == null ? 0 : reservation.getGuestCount()
                ))
                .collect(Collectors.joining("; "));

        if (containsAny(lower, "menu", "food", "cuisine")) {
            return "Restaurant summary: menu items " + menuItems.size() + ", available now " + availableItems + ", cuisine mix " + cuisineCounts + ".";
        }

        return "Restaurant summary: menu items " + menuItems.size() + ", available now " + availableItems + ", upcoming reservations " + upcomingReservations + ". Next reservations: " + fallbackText(reservationPreview, "none") + ".";
    }

    private String buildEventAnswer(String lower) {
        List<EventBooking> events = eventBookingRepository.findAllByOrderByEventDateTimeDesc();
        long upcoming = events.stream()
                .filter(event -> event.getEventDateTime() != null && event.getEventDateTime().isAfter(LocalDateTime.now()))
                .count();
        BigDecimal revenue = events.stream()
                .map(EventBooking::getTotalPrice)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String nextEvents = events.stream()
                .filter(event -> event.getEventDateTime() != null)
                .sorted(Comparator.comparing(EventBooking::getEventDateTime))
                .limit(3)
                .map(event -> "%s at %s on %s".formatted(
                        safe(event.getEventType()),
                        safe(event.getHallName()),
                        formatDateTime(event.getEventDateTime())
                ))
                .collect(Collectors.joining("; "));

        if (containsAny(lower, "revenue", "income", "price")) {
            return "Event summary: bookings " + events.size() + ", upcoming " + upcoming + ", total booked revenue " + revenue + ".";
        }

        return "Event summary: bookings " + events.size() + ", upcoming " + upcoming + ". Next events: " + fallbackText(nextEvents, "none") + ".";
    }

    private String buildPayrollAnswer(String lower) {
        List<Payroll> payrollRecords = payrollRepository.findAll();
        BigDecimal totalNet = payrollRecords.stream()
                .map(Payroll::getNetSalary)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String latest = payrollRecords.stream()
                .sorted(Comparator.comparing(Payroll::getGeneratedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(3)
                .map(payroll -> "%s %s/%s net %s".formatted(
                        payroll.getStaff() == null ? "unknown" : safe(payroll.getStaff().getName()),
                        payroll.getMonth(),
                        payroll.getYear(),
                        payroll.getNetSalary()
                ))
                .collect(Collectors.joining("; "));

        if (containsAny(lower, "total", "sum", "salary total")) {
            return "Payroll summary: records " + payrollRecords.size() + ", total net salary " + totalNet + ".";
        }

        return "Payroll summary: records " + payrollRecords.size() + ", total net salary " + totalNet + ". Latest payroll entries: " + fallbackText(latest, "none") + ".";
    }

    private List<String> resolveModules(String explicitModule, String message) {
        Set<String> modules = new LinkedHashSet<>();
        if (explicitModule != null && !explicitModule.isBlank()) {
            modules.add(normalizeModule(explicitModule));
        }

        String lower = message.toLowerCase(Locale.ROOT);
        if (containsAny(lower, "room", "booking", "check-in", "checkout", "stay", "availability")) {
            modules.add("rooms");
        }
        if (containsAny(lower, "menu", "restaurant", "dining", "table", "reservation", "meal", "food")) {
            modules.add("restaurant");
        }
        if (containsAny(lower, "event", "hall", "wedding", "conference", "party")) {
            modules.add("events");
        }
        if (containsAny(lower, "payroll", "salary", "staff", "wage", "deduction", "overtime")) {
            modules.add("payroll");
        }

        if (modules.isEmpty()) {
            modules.add("general");
        }
        return List.copyOf(modules);
    }

    private String normalizeModule(String module) {
        String lower = module.toLowerCase(Locale.ROOT);
        if (lower.startsWith("room")) return "rooms";
        if (lower.startsWith("event")) return "events";
        if (lower.startsWith("rest") || lower.startsWith("menu") || lower.startsWith("din")) return "restaurant";
        if (lower.startsWith("pay") || lower.startsWith("staff")) return "payroll";
        return "general";
    }

    private boolean containsAny(String text, String... terms) {
        for (String term : terms) {
            if (text.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private String formatDate(LocalDate date) {
        return date == null ? "-" : DATE_FORMAT.format(date);
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime == null ? "-" : DATE_TIME_FORMAT.format(dateTime);
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String safeEnum(String value) {
        return value == null || value.isBlank() ? "-" : value.replace('_', ' ').toLowerCase(Locale.ROOT);
    }

    private String fallbackText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
