package com.hotelpayroll.service.impl;

import com.hotelpayroll.dto.ChangePasswordRequest;
import com.hotelpayroll.dto.UpdateProfileRequest;
import com.hotelpayroll.dto.UserProfileResponse;
import com.hotelpayroll.entity.User;
import com.hotelpayroll.exception.BadRequestException;
import com.hotelpayroll.exception.ResourceNotFoundException;
import com.hotelpayroll.repository.UserRepository;
import com.hotelpayroll.service.AuditService;
import com.hotelpayroll.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Override
    public UserProfileResponse getCurrentUser(String username) {
        User user = findByUsername(username);
        return toResponse(user);
    }

    @Override
    public UserProfileResponse updateCurrentUser(String username, UpdateProfileRequest request) {
        User user = findByUsername(username);
        user.setFullName(request.getFullName().trim());
        User saved = userRepository.save(user);
        auditService.log("PROFILE_UPDATE", "User", saved.getId().toString(), username, "Updated profile name");
        return toResponse(saved);
    }

    @Override
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = findByUsername(username);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (request.getNewPassword().length() < 8) {
            throw new BadRequestException("New password must be at least 8 characters");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditService.log("PASSWORD_CHANGE", "User", user.getId().toString(), username, "Changed account password");
    }

    private User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
