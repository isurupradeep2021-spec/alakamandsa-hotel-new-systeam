package com.hotelpayroll.config;

import com.hotelpayroll.entity.Role;
import com.hotelpayroll.entity.CuisineType;
import com.hotelpayroll.entity.MealService;
import com.hotelpayroll.entity.MenuItem;
import com.hotelpayroll.entity.Staff;
import com.hotelpayroll.entity.StaffStatus;
import com.hotelpayroll.entity.User;
import com.hotelpayroll.repository.MenuItemRepository;
import com.hotelpayroll.repository.StaffRepository;
import com.hotelpayroll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StaffRepository staffRepository;
    private final MenuItemRepository menuItemRepository;
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
