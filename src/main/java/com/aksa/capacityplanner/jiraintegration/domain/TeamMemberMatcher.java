package com.aksa.capacityplanner.jiraintegration.domain;

import com.aksa.capacityplanner.team.domain.TeamMember;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Jira issue'sunun assignee alanini (fields.assignee) takimin TeamMember
 * kayitlariyla eslestirir.
 *
 * TARIHCE:
 * 1) Ilk halinde bu eslesme HIC yapilmiyordu - her Jira kaynakli WorkItem.teamMemberId
 *    DAIMA null kaliyordu.
 * 2) Sadece TAM AD (normalize edilmis) karsilastirmasi eklendi - ama gercek RPA
 *    verisinde team_members.full_name cogu kisi icin sadece ILK AD ("Atakan")
 *    iken Jira TAM AD donduruyordu ("Salim Atakan Bozkurt") - 586 issue'nun
 *    334'u eslesemedi. Bir TOKEN fallback'i eklendi (tam ad, Jira adinin
 *    kelimelerinden birine esitse eslestir) - bu sayiyi azaltti ama RPA'nin 8
 *    gercek katilimcisindan hala sadece 3'u eslesebiliyordu (canli test,
 *    2026-08-14): geri kalan 5 kisi team_members'ta HIC KAYITLI degildi.
 * 3) KESIN COZUM (referans "Jira Dashboard" projesindeki yaklasimla ayni
 *    prensip - orada uyelik hic manuel bir roster'a dayanmiyor, dogrudan Jira
 *    issue'larinin assignee'sinden turetiliyor): artik birincil eslesme KALICI
 *    bir kimlikle - Jira'nin accountId'siyle - yapilir. Bu ad degisikliklerinden
 *    etkilenmez ve TEK dogru anahtar. jiraAccountId'si henuz kayitli olmayan
 *    (manuel girilmis eski) uyeler icin email/isim fallback'i hala calisir -
 *    eslesirse jiraAccountId geriye doldurulur (bkz. JiraSyncRequestConsumer),
 *    boylece bir dahaki sefere dogrudan accountId ile eslesir. HICBIR eslesme
 *    yoksa cagiran taraf (JiraSyncRequestConsumer) YENI bir TeamMember otomatik
 *    olusturur - artik "takimda 8 kisi var ama 3'u gorunuyor" sorunu olmamali.
 */
public final class TeamMemberMatcher {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TeamMemberMatcher.class);
    private static final Pattern COMBINING_MARKS = Pattern.compile("\\p{M}");
    private static final Locale TURKISH = Locale.forLanguageTag("tr");

    private TeamMemberMatcher() {
    }

    /** Jira'nin ham assignee Map'inden ihtiyac duyulan alanlari cikarir. */
    public record JiraAssignee(String accountId, String displayName, String email, String avatarUrl) {
    }

    @SuppressWarnings("unchecked")
    public static JiraAssignee extractAssignee(Object assigneeField) {
        if (!(assigneeField instanceof Map<?, ?> raw)) {
            return null;
        }
        Map<String, Object> assignee = (Map<String, Object>) raw;
        String accountId = asString(assignee.get("accountId"));
        String displayName = asString(assignee.get("displayName"));
        String email = asString(assignee.get("emailAddress"));
        String avatarUrl = extractAvatarUrl(assignee.get("avatarUrls"));
        if (accountId == null && displayName == null) {
            return null;
        }
        return new JiraAssignee(accountId, displayName, email, avatarUrl);
    }

    @SuppressWarnings("unchecked")
    private static String extractAvatarUrl(Object avatarUrlsField) {
        if (!(avatarUrlsField instanceof Map<?, ?> raw)) {
            return null;
        }
        Map<String, Object> avatarUrls = (Map<String, Object>) raw;
        // En buyuk boyuttan kucuge dogru dener - Jira Cloud genelde 48x48/32x32/24x24/16x16 saglar.
        for (String size : List.of("48x48", "32x32", "24x24", "16x16")) {
            String url = asString(avatarUrls.get(size));
            if (url != null) {
                return url;
            }
        }
        return null;
    }

    /** assignee null veya eslesme bulunamazsa null doner - cagiran taraf bu durumda yeni bir TeamMember olusturmayi degerlendirmeli. */
    public static TeamMember resolve(JiraAssignee assignee, List<TeamMember> teamMembers) {
        if (assignee == null || teamMembers.isEmpty()) {
            return null;
        }

        if (assignee.accountId() != null) {
            for (TeamMember member : teamMembers) {
                if (assignee.accountId().equals(member.getJiraAccountId())) {
                    return member;
                }
            }
        }

        if (assignee.email() != null) {
            for (TeamMember member : teamMembers) {
                if (member.getEmail() != null && member.getEmail().equalsIgnoreCase(assignee.email())) {
                    return member;
                }
            }
        }

        if (assignee.displayName() == null) {
            return null;
        }
        String normalizedTarget = normalize(assignee.displayName());
        for (TeamMember member : teamMembers) {
            if (normalize(member.getFullName()).equals(normalizedTarget)) {
                return member;
            }
        }

        return resolveByNameToken(assignee.displayName(), normalizedTarget, teamMembers);
    }

    /** TeamMember.fullName kaydi sadece ilk ad/lakap oldugunda, Jira'nin tam adiyla kelime bazinda eslestirir. */
    private static TeamMember resolveByNameToken(String displayName, String normalizedTarget, List<TeamMember> teamMembers) {
        List<String> tokens = List.of(normalizedTarget.split(" "));
        List<TeamMember> candidates = new ArrayList<>();
        for (TeamMember member : teamMembers) {
            String normalizedMember = normalize(member.getFullName());
            if (!normalizedMember.isEmpty() && tokens.contains(normalizedMember)) {
                candidates.add(member);
            }
        }
        if (candidates.size() == 1) {
            TeamMember match = candidates.get(0);
            log.info("Assignee '{}' -> TeamMember '{}' (id={}) TOKEN eslesmesiyle bulundu (tam ad birebir eslesmiyordu).",
                    displayName, match.getFullName(), match.getId());
            return match;
        }
        if (candidates.size() > 1) {
            log.warn("Assignee '{}' icin BIRDEN FAZLA takim uyesi token eslesti ({}), belirsizlik nedeniyle atlanidi.",
                    displayName, candidates.stream().map(TeamMember::getFullName).toList());
        }
        return null;
    }

    private static String asString(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    /** Buyuk/kucuk harf, TR karakter varyasyonlari (I/İ/ı/i) ve fazla bosluklari yok sayarak karsilastirma anahtari uretir. */
    static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String lower = value.trim().toLowerCase(TURKISH).replace('ı', 'i');
        String decomposed = Normalizer.normalize(lower, Normalizer.Form.NFD);
        String withoutMarks = COMBINING_MARKS.matcher(decomposed).replaceAll("");
        return withoutMarks.replaceAll("\\s+", " ").trim();
    }
}
