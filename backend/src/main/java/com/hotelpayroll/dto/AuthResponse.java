package com.hotelpayroll.dto;

import com.hotelpayroll.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String username;
    private String fullName;
    private Role role;
    private Set<String> permissions;
}
