package com.aksa.capacityplanner.auth.adapter.out;

import com.aksa.capacityplanner.auth.domain.AuthUser;
import com.aksa.capacityplanner.auth.domain.Role;
import com.aksa.capacityplanner.auth.port.out.UserRepositoryPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
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
 *  - 29547 / 123456    (PO, "Gözde Son", teamId=3, "Ürün Geliştirme Ekibi")
 *  - 30816 / 123456    (PO, "Ece Sena Salan", teamId=2, "İş Zekası Ekibi")
 *  - 33603 / 123456    (PO, "Muaz Furkan", teamId=4, "Yapay Zeka Ekibi")
 *  - 25493 / 123456    (PO, "Alican Özekinci", teamId=6, "Doküman ve Süreç Yönetim Sistemi Ekibi")
 *  - 35840 / 123456    (PO, "Züleyha Kadeş Tanrıverdi", teamId=5, teamIds=[5,7] -
 *                        Dijital Uygulamalar + Konum Tabanlı Ürün Geliştirme/CBS)
 *  - 37547 / 123456    (PO, "Pelinsu Çevikel", teamId=1, "RPA Ekibi")
 *  - 35834 / 123456    (PO, "Büşra Can", teamId=5, teamIds=[5,7] -
 *                        Dijital Uygulamalar + Konum Tabanlı Ürün Geliştirme/CBS)
 *                        (teamId degerleri teams tablosundaki sabit id'lerle
 *                        birebir eslesir - bkz. V13__seed_teams.sql:
 *                          1 RPA Ekibi
 *                          2 İş Zekası Ekibi
 *                          3 Ürün Geliştirme Ekibi
 *                          4 Yapay Zeka Ekibi
 *                          5 Dijital Uygulamalar Ekibi
 *                          6 Doküman ve Süreç Yönetim Sistemi Ekibi
 *                          7 Konum Tabanlı Ürün Geliştirme Ekibi (CBS)
 *                        yeni takim eklenirse iki taraf birlikte guncellenmeli;
 *                        kullanici kendisi de sonradan profil ekranindan
 *                        degistirebilir - ama profil ekrani su an tek takim
 *                        secebiliyor, teamIds'i coklu tutan hesaplar icin
 *                        profil ekranindan kaydetmek listeyi teke dusurur,
 *                        bkz. ProfileService)
 *
 * department degerleri bilerek "rpa"/"zeka" iceriyor - frontend'deki
 * resolveTeamTypeFromDepartment ve backend'deki TeamType.fromDepartmentName
 * ile ayni "isim icinde arama" mantigina gore takim tipini dogru cozumlesin.
 *
 * usersBySicil mutable (ConcurrentHashMap) tutuluyor cunku save() ile profil
 * guncellemesi bu map'i yerinde degistiriyor - gercek DB baglanana kadar
 * degisiklikler sadece uygulama ayakta oldugu surece kalicidir.
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
                        "AKSA Enerji", "İş Zekası Ekibi", "Ürün Sorumlusu", "Uzman", "Ürün Sorumlusu", "2020"),
                mockUser("29547", passwordEncoder.encode("123456"), "Gözde Son", Role.PO, 3L,
                        "AKSA Enerji", "Ürün Geliştirme Ekibi", "", "", "", ""),
                mockUser("30816", passwordEncoder.encode("123456"), "Ece Sena Salan", Role.PO, 2L,
                        "AKSA Enerji", "İş Zekası Ekibi", "", "", "", ""),
                mockUser("33603", passwordEncoder.encode("123456"), "Muaz Furkan", Role.PO, 4L,
                        "AKSA Enerji", "Yapay Zeka Ekibi", "", "", "", ""),
                mockUser("25493", passwordEncoder.encode("123456"), "Alican Özekinci", Role.PO, 6L,
                        "AKSA Enerji", "Doküman ve Süreç Yönetim Sistemi Ekibi", "", "", "", ""),
                mockUser("35840", passwordEncoder.encode("123456"), "Züleyha Kadeş Tanrıverdi", Role.PO, 5L,
                        "AKSA Enerji", "Dijital Uygulamalar Ekibi", "", "", "", "", List.of(5L, 7L)),
                mockUser("37547", passwordEncoder.encode("123456"), "Pelinsu Çevikel", Role.PO, 1L,
                        "AKSA Enerji", "RPA Ekibi", "", "", "", ""),
                mockUser("35834", passwordEncoder.encode("123456"), "Büşra Can", Role.PO, 5L,
                        "AKSA Enerji", "Dijital Uygulamalar Ekibi", "", "", "", "", List.of(5L, 7L))
        ).collect(Collectors.toMap(AuthUser::getSicil, u -> u, (a, b) -> b, ConcurrentHashMap::new));
    }

    private AuthUser mockUser(String sicil, String passwordHash, String fullName, Role role, Long teamId,
                               String company, String department, String title,
                               String extensionAttribute4, String extensionAttribute6, String extensionAttribute8) {
        return mockUser(sicil, passwordHash, fullName, role, teamId, company, department, title,
                extensionAttribute4, extensionAttribute6, extensionAttribute8,
                teamId != null ? List.of(teamId) : List.of());
    }

    /** Birden fazla takima duzenleme yetkisi olan PO'lar icin (orn. iki ekibi birlikte yuruten kisiler). */
    private AuthUser mockUser(String sicil, String passwordHash, String fullName, Role role, Long teamId,
                               String company, String department, String title,
                               String extensionAttribute4, String extensionAttribute6, String extensionAttribute8,
                               List<Long> teamIds) {
        AuthUser user = new AuthUser();
        user.setSicil(sicil);
        user.setPasswordHash(passwordHash);
        user.setFullName(fullName);
        user.setRole(role);
        user.setTeamId(teamId);
        user.setTeamIds(teamIds);
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

    @Override
    public void save(AuthUser user) {
        usersBySicil.put(user.getSicil(), user);
    }
}
