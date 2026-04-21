package com.hotelpayroll.dto;

import com.hotelpayroll.entity.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String username;
    private String fullName;
    private Role role;
}
