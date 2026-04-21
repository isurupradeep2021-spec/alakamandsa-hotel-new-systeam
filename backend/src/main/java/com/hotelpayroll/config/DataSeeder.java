package com.hotelpayroll.config;

import com.hotelpayroll.entity.Role;
import com.hotelpayroll.entity.Staff;
import com.hotelpayroll.entity.StaffStatus;
import com.hotelpayroll.entity.User;
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
