package com.hotelpayroll.dto;

import com.hotelpayroll.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String fullName;

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotNull
    private Role role;
}
