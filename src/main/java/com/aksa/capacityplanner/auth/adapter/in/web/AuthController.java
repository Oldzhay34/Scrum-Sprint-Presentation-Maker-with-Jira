package com.aksa.capacityplanner.auth.adapter.in.web;

import com.aksa.capacityplanner.auth.adapter.in.web.dto.LoginRequest;
import com.aksa.capacityplanner.auth.adapter.in.web.dto.LoginResponse;
import com.aksa.capacityplanner.auth.application.port.in.LoginCommand;
import com.aksa.capacityplanner.auth.application.port.in.LoginUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final LoginUseCase loginUseCase;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {

        LoginCommand command = new LoginCommand(
                request.username(),
                request.password()
        );

        return ResponseEntity.ok(
                loginUseCase.login(command)
        );
    }
}