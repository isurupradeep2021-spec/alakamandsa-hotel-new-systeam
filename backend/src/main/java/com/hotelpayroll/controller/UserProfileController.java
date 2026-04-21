package com.hotelpayroll.controller;

import com.hotelpayroll.dto.ChangePasswordRequest;
import com.hotelpayroll.dto.UpdateProfileRequest;
import com.hotelpayroll.dto.UserProfileResponse;
import com.hotelpayroll.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public UserProfileResponse me(Authentication authentication) {
        return userProfileService.getCurrentUser(authentication.getName());
    }

    @PutMapping
    public UserProfileResponse update(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        return userProfileService.updateCurrentUser(authentication.getName(), request);
    }

    @PostMapping("/change-password")
    public void changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        userProfileService.changePassword(authentication.getName(), request);
    }
}
