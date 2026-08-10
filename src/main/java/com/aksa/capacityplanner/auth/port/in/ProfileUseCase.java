package com.aksa.capacityplanner.auth.port.in;

import com.aksa.capacityplanner.auth.api.dto.ProfileUpdateRequest;
import com.aksa.capacityplanner.auth.domain.AuthUser;

/** Oturum acmis kullanicinin kendi profil bilgilerini yonetmesi (SessionUseCase'den ayri sorumluluk). */
public interface ProfileUseCase {

    /**
     * teamId/department gibi JWT claim'leri degisebildigi icin guncel
     * bilgiyle imzalanmis yeni bir access token da doner - cagiran taraf
     * (AuthController) bunu cookie'ye yeniden yazar.
     */
    ProfileUpdateResult updateProfile(String sicil, ProfileUpdateRequest request);

    record ProfileUpdateResult(AuthUser user, String accessToken) {
    }
}
