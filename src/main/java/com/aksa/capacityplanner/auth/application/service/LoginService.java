package com.aksa.capacityplanner.auth.application.service;

import com.aksa.capacityplanner.auth.adapter.in.web.dto.LoginResponse;
import com.aksa.capacityplanner.auth.application.port.in.LoginCommand;
import com.aksa.capacityplanner.auth.application.port.in.LoginUseCase;
import com.aksa.capacityplanner.auth.application.port.out.PersonnelQueryPort;
import com.aksa.capacityplanner.auth.application.port.out.TokenGeneratePort;
import com.aksa.capacityplanner.auth.domain.model.Personnel;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginService implements LoginUseCase {

    private final AuthenticationManager authenticationManager;
    private final PersonnelQueryPort personnelQueryPort;
    private final TokenGeneratePort tokenGeneratePort;

    @Override
    public LoginResponse login(LoginCommand command) {

        Authentication authenticationRequest =
                UsernamePasswordAuthenticationToken.unauthenticated(
                        command.username(),
                        command.password()
                );

        try {
            Authentication authentication =
                    authenticationManager.authenticate(authenticationRequest);

            if (!authentication.isAuthenticated()) {
                throw new InvalidCredentialsException();
            }

            Personnel personnel = personnelQueryPort
                    .findByUsername(command.username())
                    .filter(Personnel::active)
                    .orElseThrow(InvalidCredentialsException::new);

            TokenGeneratePort.GeneratedToken generatedToken =
                    tokenGeneratePort.generate(personnel);

            return new LoginResponse(
                    generatedToken.accessToken(),
                    "Bearer",
                    generatedToken.expiresIn()
            );

        } catch (AuthenticationException exception) {
            throw new InvalidCredentialsException();
        }
    }
}