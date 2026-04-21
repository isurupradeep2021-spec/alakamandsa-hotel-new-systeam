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
import com.hotelpayroll.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        return AuthResponse.builder()
                .token(jwtService.generateToken(userDetails))
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }

        if (request.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("SUPER_ADMIN cannot be registered through this endpoint");
        }

        User saved = userRepository.save(User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
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
                .build();
    }
}
