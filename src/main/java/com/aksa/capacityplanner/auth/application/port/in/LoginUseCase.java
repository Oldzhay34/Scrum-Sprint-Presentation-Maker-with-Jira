package com.aksa.capacityplanner.auth.application.port.in;

import com.aksa.capacityplanner.auth.adapter.in.web.dto.LoginRequest;
import com.aksa.capacityplanner.auth.adapter.in.web.dto.LoginResponse;

public interface LoginUseCase {

    LoginResponse login(LoginRequest request);
}