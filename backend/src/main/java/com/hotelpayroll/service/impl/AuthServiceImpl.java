package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.AuthResponse;
import com.hotelpayroll.dto.LoginRequest;
import com.hotelpayroll.dto.RegisterRequest;
import com.hotelpayroll.entity.Role;
import com.hotelpayroll.entity.User;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.repository.UserRepository;
import com.hotelpayroll.security.CustomUserDetailsService;
import com.hotelpayroll.security.JwtService;
import com.hotelpayroll.security.RolePermissions;
import com.hotelpayroll.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;

    @Override
    public AuthResponse login(LoginRequest request) {
        String normalizedUsername = normalizeLoginUsername(request.getUsername());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(normalizedUsername, request.getPassword()));

        User user = userRepository.findByUsernameIgnoreCase(normalizedUsername)
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        return AuthResponse.builder()
                .token(jwtService.generateToken(userDetails))
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .permissions(RolePermissions.forRole(user.getRole()).stream().map(Enum::name).collect(Collectors.toSet()))
                .build();
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        String normalizedUsername = request.getUsername().trim();
        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new BadRequestException("Username already exists");
        }

        if (request.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("SUPER_ADMIN cannot be registered through this endpoint");
        }

        User saved = userRepository.save(User.builder()
                .fullName(request.getFullName())
            .username(normalizedUsername)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .enabled(true)
                .build());

        UserDetails userDetails = userDetailsService.loadUserByUsername(saved.getUsername());
        return AuthResponse.builder()
                .token(jwtService.generateToken(userDetails))
                .username(saved.getUsername())
                .fullName(saved.getFullName())
                .role(saved.getRole())
                .permissions(RolePermissions.forRole(saved.getRole()).stream().map(Enum::name).collect(Collectors.toSet()))
                .build();
    }

    private String normalizeLoginUsername(String username) {
        String normalized = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        String compact = normalized.replaceAll("[^a-z0-9]", "");

        return switch (compact) {
            case "superadmin" -> "superadmin";
            case "manager" -> "manager";
            case "staff", "staffmember" -> "staff";
            case "customer" -> "customer";
            case "restaurantmanager" -> "restaurant-manager";
            case "eventmanager" -> "event-manager";
            default -> normalized;
        };
    }
}
