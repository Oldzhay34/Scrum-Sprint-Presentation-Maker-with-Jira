package com.aksa.capacityplanner.auth.infrastructure.security;

import com.aksa.capacityplanner.application.port.out.PersonnelQueryPort;
import com.aksa.capacityplanner.domain.model.Personnel;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final PersonnelQueryPort personnelQueryPort;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        Personnel personnel = personnelQueryPort
                .findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Kullanıcı bulunamadı."
                        )
                );

        return User.builder()
                .username(personnel.username())
                .password(personnel.password())
                .disabled(!personnel.active())
                .authorities(
                        personnel.roles()
                                .stream()
                                .map(role -> new SimpleGrantedAuthority(
                                        role.startsWith("ROLE_")
                                                ? role
                                                : "ROLE_" + role
                                ))
                                .toList()
                )
                .build();
    }
}