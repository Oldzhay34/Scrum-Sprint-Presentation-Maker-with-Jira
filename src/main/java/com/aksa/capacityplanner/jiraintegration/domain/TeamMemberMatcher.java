package com.aksa.capacityplanner.jiraintegration.domain;

import com.aksa.capacityplanner.team.domain.TeamMember;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Jira issue'sunun assignee alanini (fields.assignee) takimin TeamMember
 * kayitlariyla eslestirir.
 *
 * ONCEDEN bu eslesme HIC yapilmiyordu - Jira'dan cekilen assignee bilgisi
 * DEFAULT_FIELDS'a dahildi (bkz. JiraRestClientAdapter) ama JiraSyncRequestConsumer
 * hic okumuyordu, bu yuzden Jira kaynakli her WorkItem.teamMemberId DAIMA null
 * kaliyordu - dashboard'daki "Kisi Bazli Kapasite Ozeti" tablosu Jira senkronizasyonuyla
 * hicbir zaman dolmuyordu (muhtemelen kullanicinin "tam istenildigi gibi
 * cekememisiz" dedigi asil sorun buydu).
 *
 * Once email (varsa - Jira Cloud'da gizlilik ayarlarina gore bos gelebilir),
 * yoksa TAM AD karsilastirmasi denenir. Isimler Jira'da ("BURAK BURHAN") ve
 * uygulamada ("Burak Burhan") farkli buyuk/kucuk harf ve TR karakter
 * bicimlerinde olabildigi icin karsilastirma normalize edilerek yapilir.
 */
public final class TeamMemberMatcher {

    private static final Pattern COMBINING_MARKS = Pattern.compile("\\p{M}");
    private static final Locale TURKISH = Locale.forLanguageTag("tr");

    private TeamMemberMatcher() {
    }

    /** assignee null/bossa veya eslesme bulunamazsa null doner - cagiran taraf WorkItem.teamMemberId'i null birakir. */
    @SuppressWarnings("unchecked")
    public static Long resolveTeamMemberId(Object assigneeField, List<TeamMember> teamMembers) {
        if (!(assigneeField instanceof Map<?, ?> assigneeMap) || teamMembers.isEmpty()) {
            return null;
        }
        Map<String, Object> assignee = (Map<String, Object>) assigneeMap;

        String email = asString(assignee.get("emailAddress"));
        if (email != null) {
            for (TeamMember member : teamMembers) {
                if (member.getEmail() != null && member.getEmail().equalsIgnoreCase(email)) {
                    return member.getId();
                }
            }
        }

        String displayName = asString(assignee.get("displayName"));
        if (displayName != null) {
            String normalizedTarget = normalize(displayName);
            for (TeamMember member : teamMembers) {
                if (normalize(member.getFullName()).equals(normalizedTarget)) {
                    return member.getId();
                }
            }
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
