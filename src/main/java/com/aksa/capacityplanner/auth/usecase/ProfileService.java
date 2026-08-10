package com.aksa.capacityplanner.auth.usecase;

import com.aksa.capacityplanner.auth.api.dto.ProfileUpdateRequest;
import com.aksa.capacityplanner.auth.domain.AuthUser;
import com.aksa.capacityplanner.auth.domain.InvalidCredentialsException;
import com.aksa.capacityplanner.auth.port.in.ProfileUseCase;
import com.aksa.capacityplanner.auth.port.out.UserRepositoryPort;
import com.aksa.capacityplanner.auth.security.JwtTokenProvider;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfileService implements ProfileUseCase {

    private final UserRepositoryPort userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public ProfileService(UserRepositoryPort userRepository, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public ProfileUpdateResult updateProfile(String sicil, ProfileUpdateRequest request) {
        AuthUser user = userRepository.findBySicil(sicil)
                .orElseThrow(() -> new InvalidCredentialsException("Oturum bulunamadı, tekrar giriş yapın."));
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName());
        }
        user.setTeamId(request.teamId());
        // Profil ekrani su an tek takim secimi sunuyor. Secilen takim zaten
        // kullanicinin mevcut coklu-takim listesinde varsa (admin tarafindan
        // atanmis ek takimlar, bkz. MockUserRepositoryAdapter) o listeyi
        // OLDUGU GIBI koru - aksi halde herhangi bir profil kaydi (ilgisiz bir
        // alani degistirmek icin bile) sessizce ikinci takimi siler. Secilen
        // takim listede yoksa (kullanici gercekten farkli/tek bir takima
        // geciyor demektir) tek elemanli yeni listeye dus.
        List<Long> currentTeamIds = user.getTeamIds();
        boolean keepExistingTeamIds = request.teamId() != null
                && currentTeamIds != null && currentTeamIds.contains(request.teamId());
        if (!keepExistingTeamIds) {
            user.setTeamIds(request.teamId() != null ? List.of(request.teamId()) : List.of());
        }
        user.setCompany(request.company());
        user.setDepartment(request.department());
        user.setTitle(request.title());
        user.setExtensionAttribute4(request.extensionAttribute4());
        user.setExtensionAttribute6(request.extensionAttribute6());
        user.setExtensionAttribute8(request.extensionAttribute8());
        userRepository.save(user);
        String accessToken = jwtTokenProvider.createAccessToken(user);
        return new ProfileUpdateResult(user, accessToken);
    }
}
