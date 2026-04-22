package com.hotelpayroll.config;

import com.hotelpayroll.entity.Role;
import com.hotelpayroll.entity.CuisineType;
import com.hotelpayroll.entity.MealService;
import com.hotelpayroll.entity.MenuItem;
import com.hotelpayroll.entity.Staff;
import com.hotelpayroll.entity.StaffStatus;
import com.hotelpayroll.entity.User;
import com.hotelpayroll.entity.Reservation;
import com.hotelpayroll.entity.MealType;
import com.hotelpayroll.entity.SeatingPreference;
import com.hotelpayroll.entity.ReservationStatus;
import com.hotelpayroll.repository.MenuItemRepository;
import com.hotelpayroll.repository.StaffRepository;
import com.hotelpayroll.repository.UserRepository;
import com.hotelpayroll.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import java.time.LocalDate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StaffRepository staffRepository;
    private final MenuItemRepository menuItemRepository;
    private final ReservationRepository reservationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        User superAdmin = upsertUser("superadmin", "Super Admin", Role.SUPER_ADMIN);
        User manager = upsertUser("manager", "Hotel Manager", Role.MANAGER);
        User staff = upsertUser("staff", "Staff Member", Role.STAFF_MEMBER);
        upsertUser("customer", "Customer User", Role.CUSTOMER);
        upsertUser("restaurant-manager", "Restaurant Manager", Role.RESTAURANT_MANAGER);
        upsertUser("event-manager", "Event Manager", Role.EVENT_MANAGER);

        if (staffRepository.count() == 0) {
            staffRepository.save(Staff.builder()
                    .name("Nimal Perera")
                    .position("Reception Staff")
                    .basicSalary(new BigDecimal("75000.00"))
                    .attendance(26)
                    .overtimeHours(12.0)
                    .absentDays(2)
                    .overtimeRate(new BigDecimal("1200.00"))
                    .dailyRate(new BigDecimal("3000.00"))
                    .status(StaffStatus.ACTIVE)
                    .user(staff)
                    .build());

            staffRepository.save(Staff.builder()
                    .name("Kasun Silva")
                    .position("Kitchen Staff")
                    .basicSalary(new BigDecimal("68000.00"))
                    .attendance(27)
                    .overtimeHours(8.0)
                    .absentDays(1)
                    .overtimeRate(new BigDecimal("1000.00"))
                    .dailyRate(new BigDecimal("2700.00"))
                    .status(StaffStatus.ACTIVE)
                    .user(manager)
                    .build());
        }

        upsertMenuItem("Grilled Herb Chicken", CuisineType.WESTERN, "4200.00",
                "Served with garlic mash and sauteed vegetables.", "Chef Choice", MealService.DINNER, true);
        upsertMenuItem("Pad Thai Prawns", CuisineType.THAI_CHINESE, "3900.00",
                "Rice noodles, tamarind glaze, and roasted peanuts.", "Hot", MealService.LUNCH, true);
        upsertMenuItem("Lamprais Signature", CuisineType.SRI_LANKAN, "3600.00",
                "Banana leaf parcel with rice, curry, and sambol.", "Local Favorite", MealService.LUNCH, true);

        upsertMenuItem("Omelette & Toast", CuisineType.WESTERN, "500.00",
                "Fluffy omelette with toasted bread and butter", "Healthy", MealService.BREAKFAST, true);
        upsertMenuItem("Vegetable Soup", CuisineType.WESTERN, "650.00",
                "Warm soup made with fresh vegetables and herbs", "Healthy", MealService.ALL_DAY, true);
        upsertMenuItem("Devilled Prawns", CuisineType.SRI_LANKAN, "1700.00",
                "Spicy fried prawns with chili paste and sauce", "Spicy", MealService.DINNER, true);
        upsertMenuItem("Egg Fried Rice", CuisineType.THAI_CHINESE, "900.00",
                "Fried rice with egg, vegetables, and soy sauce", "Budget", MealService.LUNCH, true);

        upsertMenuItem("Butter Chicken", CuisineType.INDIAN, "1600.00",
                "Creamy tomato-based chicken curry with rich spices", "Best Seller", MealService.DINNER, true);
        upsertMenuItem("Chicken Biryani", CuisineType.INDIAN, "1500.00",
                "Fragrant basmati rice cooked with spiced chicken and herbs", "Popular", MealService.LUNCH, true);
        upsertMenuItem("Garlic Naan", CuisineType.INDIAN, "400.00",
                "Soft flatbread topped with garlic and butter", "Side Dish", MealService.DINNER, true);
        upsertMenuItem("Paneer Butter Masala", CuisineType.INDIAN, "1300.00",
                "Cottage cheese cubes cooked in creamy tomato gravy", "Vegetarian", MealService.DINNER, true);
        upsertMenuItem("Dal Tadka", CuisineType.INDIAN, "900.00",
                "Yellow lentils tempered with spices and herbs", "Healthy", MealService.LUNCH, true);

        // New Western Dishes (4)
        upsertMenuItem("Beef Steak with Mashed Potatoes", CuisineType.WESTERN, "2500.00",
                "Juicy beef steak served with creamy mashed potatoes.", "Premium", MealService.DINNER, true);
        upsertMenuItem("Classic Caesar Salad", CuisineType.WESTERN, "1200.00",
                "Crisp romaine lettuce, croutons, parmesan cheese and caesar dressing.", "Healthy", MealService.ALL_DAY, true);
        upsertMenuItem("Spaghetti Carbonara", CuisineType.WESTERN, "1800.00",
                "Classic Italian pasta with creamy egg, bacon, and parmesan cheese.", "Popular", MealService.DINNER, true);
        upsertMenuItem("Fish and Chips", CuisineType.WESTERN, "2000.00",
                "Crispy battered fish fillet served with french fries and tartar sauce.", "Classic", MealService.LUNCH, true);

        // New Sri Lankan Dishes (4)
        upsertMenuItem("Chicken Kottu Roti", CuisineType.SRI_LANKAN, "1500.00",
                "Spicy chopped roti stir-fried with vegetables, egg, and chicken curry.", "Local Favorite", MealService.DINNER, true);
        upsertMenuItem("Hoppers and Egg Hoppers", CuisineType.SRI_LANKAN, "800.00",
                "Crispy bowl-shaped pancakes made from rice flour, served with seeni sambol.", "Breakfast Special", MealService.BREAKFAST, true);
        upsertMenuItem("Black Pork Curry", CuisineType.SRI_LANKAN, "1800.00",
                "Traditional rich and spicy dark roasted pork curry.", "Spicy", MealService.LUNCH, true);
        upsertMenuItem("String Hoppers with Kiri Hodi", CuisineType.SRI_LANKAN, "700.00",
                "Steamed rice flour noodles served with turmeric coconut milk gravy and sambol.", "Classic", MealService.BREAKFAST, true);

        // New Thai Chinese Dishes (6)
        upsertMenuItem("Tom Yum Soup", CuisineType.THAI_CHINESE, "1400.00",
                "Spicy and sour Thai soup with prawns, mushrooms, and fragrant herbs.", "Hot & Spicy", MealService.ALL_DAY, true);
        upsertMenuItem("Sweet and Sour Chicken", CuisineType.THAI_CHINESE, "1600.00",
                "Crispy chicken pieces tossed in a tangy sweet and sour sauce with bell peppers.", "Popular", MealService.LUNCH, true);
        upsertMenuItem("Green Curry Chicken", CuisineType.THAI_CHINESE, "1700.00",
                "Thai green curry with tender chicken, bamboo shoots, and coconut milk.", "Authentic", MealService.DINNER, true);
        upsertMenuItem("Hot Butter Cuttlefish", CuisineType.THAI_CHINESE, "2200.00",
                "Crispy fried cuttlefish tossed in a spicy, buttery sauce.", "Best Seller", MealService.DINNER, true);
        upsertMenuItem("Szechuan Beef", CuisineType.THAI_CHINESE, "2100.00",
                "Spicy stir-fried beef with Szechuan peppercorns and dried chilies.", "Spicy", MealService.DINNER, true);
        upsertMenuItem("Vegetable Chop Suey", CuisineType.THAI_CHINESE, "1200.00",
                "Stir-fried mixed vegetables in a light savory sauce.", "Healthy", MealService.LUNCH, true);

        upsertReservation("Nimal Perera", "nimal@gmail.com", "0771234561", "2026-04-25", MealType.LUNCH, 2, SeatingPreference.INDOOR, "Window seat");
        upsertReservation("Kavindi Fernando", "kavindi@gmail.com", "0712345678", "2026-04-25", MealType.DINNER, 4, SeatingPreference.OUTDOOR, "Birthday decoration");
        upsertReservation("Lahiru Silva", "lahiru@gmail.com", "0759876543", "2026-04-26", MealType.LUNCH, 3, SeatingPreference.INDOOR, "Vegetarian menu");
        upsertReservation("Anjali Kumari", "anjali@gmail.com", "0775566778", "2026-04-26", MealType.DINNER, 2, SeatingPreference.INDOOR, "Quiet table");
        upsertReservation("Ramesh Wickramasinghe", "ramesh@gmail.com", "0761122334", "2026-04-27", MealType.LUNCH, 5, SeatingPreference.OUTDOOR, "Family seating");
        upsertReservation("Tharushi Jayasinghe", "tharushi@gmail.com", "0719988776", "2026-04-27", MealType.DINNER, 2, SeatingPreference.INDOOR, "Anniversary setup");
        upsertReservation("Sahan Fernando", "sahan@gmail.com", "0753344556", "2026-04-28", MealType.LUNCH, 1, SeatingPreference.INDOOR, "None");
        upsertReservation("Dilini Perera", "dilini@gmail.com", "0778899001", "2026-04-28", MealType.DINNER, 3, SeatingPreference.OUTDOOR, "Birthday cake");
        upsertReservation("Hasitha Bandara", "hasitha@gmail.com", "0767788990", "2026-04-29", MealType.LUNCH, 2, SeatingPreference.INDOOR, "Fast service");
        upsertReservation("Sanduni Rajapaksha", "sanduni@gmail.com", "0714455667", "2026-04-29", MealType.DINNER, 6, SeatingPreference.OUTDOOR, "Large table for group");
    }

    private void upsertMenuItem(String name,
                                CuisineType cuisine,
                                String price,
                                String description,
                                String badge,
                                MealService mealService,
                                boolean available) {
        if (menuItemRepository.existsByNameIgnoreCase(name)) {
            return;
        }
        menuItemRepository.save(MenuItem.builder()
                .name(name)
                .cuisine(cuisine)
                .price(new BigDecimal(price))
                .description(description)
                .badge(badge)
                .mealService(mealService)
                .available(available)
                .build());
    }

    private void upsertReservation(String name, String email, String phone, String date, MealType mealType, int guestCount, SeatingPreference seatingPreference, String specialRequests) {
        if (reservationRepository.existsByEmail(email)) {
            return;
        }
        reservationRepository.save(Reservation.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .reservationDate(LocalDate.parse(date))
                .mealType(mealType)
                .guestCount(guestCount)
                .seatingPreference(seatingPreference)
                .specialRequests(specialRequests)
                .status(ReservationStatus.PENDING)
                .createdByUsername("customer")
                .build());
    }

    private User upsertUser(String username, String fullName, Role role) {
        return userRepository.findByUsername(username).orElseGet(() -> userRepository.save(
                User.builder()
                        .username(username)
                        .fullName(fullName)
                        .password(passwordEncoder.encode("Password@123"))
                        .role(role)
                        .enabled(true)
                        .build()
        ));
    }
}
