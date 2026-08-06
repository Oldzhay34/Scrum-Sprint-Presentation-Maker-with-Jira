package com.aksa.capacityplanner.auth.adapter.out;

import com.aksa.capacityplanner.auth.domain.AuthUser;
import com.aksa.capacityplanner.auth.domain.Role;
import com.aksa.capacityplanner.auth.port.out.UserRepositoryPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Gercek kullanici/DB kaynagi baglanana kadar kullanilan sabit (in-memory)
 * kullanici listesi. UserRepositoryPort uzerinden tuketildigi icin, DB
 * baglandiginda bu sinifin yerine ayni portu implemente eden bir JPA
 * adaptoru konulmasi yeterli - cagiran kod (AuthService) degismez.
 *
 * Mock kimlik bilgileri:
 *  - admin / admin123  (ADMIN, teamId yok, tum takimlari duzenleyebilir)
 *  - 10001 / po123     (PO, teamId=1, department="RPA Ekibi")
 *  - 10002 / po123     (PO, teamId=2, department="İş Zekası Ekibi")
 *
 * department degerleri bilerek "rpa"/"zeka" iceriyor - frontend'deki
 * resolveTeamTypeFromDepartment ve backend'deki TeamType.fromDepartmentName
 * ile ayni "isim icinde arama" mantigina gore takim tipini dogru cozumlesin.
 */
@Component
public class MockUserRepositoryAdapter implements UserRepositoryPort {

    private final Map<String, AuthUser> usersBySicil;

    public MockUserRepositoryAdapter(PasswordEncoder passwordEncoder) {
        this.usersBySicil = Stream.of(
                mockUser("admin", passwordEncoder.encode("admin123"), "Admin Kullanıcı", Role.ADMIN, null,
                        "AKSA Enerji", "Bilgi Teknolojileri", "Sistem Yöneticisi", "Yönetici", "Sistem Yöneticisi", "1000"),
                mockUser("10001", passwordEncoder.encode("po123"), "PO Bir", Role.PO, 1L,
                        "AKSA Enerji", "RPA Ekibi", "Kıdemli Ürün Sorumlusu", "Uzman", "Kıdemli Ürün Sorumlusu", "2010"),
                mockUser("10002", passwordEncoder.encode("po123"), "PO İki", Role.PO, 2L,
                        "AKSA Enerji", "İş Zekası Ekibi", "Ürün Sorumlusu", "Uzman", "Ürün Sorumlusu", "2020")
        ).collect(Collectors.toMap(AuthUser::getSicil, u -> u));
    }

    private AuthUser mockUser(String sicil, String passwordHash, String fullName, Role role, Long teamId,
                               String company, String department, String title,
                               String extensionAttribute4, String extensionAttribute6, String extensionAttribute8) {
        AuthUser user = new AuthUser();
        user.setSicil(sicil);
        user.setPasswordHash(passwordHash);
        user.setFullName(fullName);
        user.setRole(role);
        user.setTeamId(teamId);
        user.setCompany(company);
        user.setDepartment(department);
        user.setTitle(title);
        user.setExtensionAttribute4(extensionAttribute4);
        user.setExtensionAttribute6(extensionAttribute6);
        user.setExtensionAttribute8(extensionAttribute8);
        return user;
    }

    @Override
    public Optional<AuthUser> findBySicil(String sicil) {
        return Optional.ofNullable(usersBySicil.get(sicil));
    }
}
