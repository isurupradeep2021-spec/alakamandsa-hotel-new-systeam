package com.hotelpayroll.service;

import com.hotelpayroll.dto.ChangePasswordRequest;
import com.hotelpayroll.dto.UpdateProfileRequest;
import com.hotelpayroll.dto.UserProfileResponse;

public interface UserProfileService {
    UserProfileResponse getCurrentUser(String username);
    UserProfileResponse updateCurrentUser(String username, UpdateProfileRequest request);
    void changePassword(String username, ChangePasswordRequest request);
}
