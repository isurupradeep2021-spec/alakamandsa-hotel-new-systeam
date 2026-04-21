package com.hotelpayroll.service;

import com.hotelpayroll.dto.AuthResponse;
import com.hotelpayroll.dto.LoginRequest;
import com.hotelpayroll.dto.RegisterRequest;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
}
