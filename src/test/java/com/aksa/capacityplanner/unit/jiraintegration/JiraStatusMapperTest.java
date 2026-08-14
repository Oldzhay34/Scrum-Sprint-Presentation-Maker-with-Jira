package com.aksa.capacityplanner.unit.jiraintegration;

import com.aksa.capacityplanner.jiraintegration.domain.JiraStatusMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JiraStatusMapperTest {

    @Test
    void sd_tamamlandi_mapsToDone() {
        // Canli hata: SD'nin gercek "done" statusu "Tamamlandı" idi, eski harita
        // sadece "Tamam" biliyordu - 532 is kaleminin tamami Backlog'a dusuyordu.
        assertThat(JiraStatusMapper.resolve("SD", "Tamamlandı")).isEqualTo("Canlı");
    }

    @Test
    void sameRawStatus_meansDifferentThingsInDifferentTeams() {
        // "PAUSE" IZ'de acik/bekleyen sayilirken, YZ'de tamamlanmis sayilir -
        // takim bazli haritalamanin asil nedeni budur.
        assertThat(JiraStatusMapper.resolve("IZ", "PAUSE")).isEqualTo("Backlog");
        assertThat(JiraStatusMapper.resolve("YZ", "PAUSE")).isEqualTo("Canlı");
    }

    @Test
    void unknownProjectKey_fallsBackToBacklog() {
        assertThat(JiraStatusMapper.resolve("BILINMEYEN", "Tamamlandı")).isEqualTo("Backlog");
    }

    @Test
    void unmappedStatusWithinKnownProject_fallsBackToBacklog() {
        assertThat(JiraStatusMapper.resolve("SD", "Hic Bilinmeyen Statu")).isEqualTo("Backlog");
    }

    @Test
    void nullOrBlankStatus_fallsBackToBacklog() {
        assertThat(JiraStatusMapper.resolve("SD", null)).isEqualTo("Backlog");
        assertThat(JiraStatusMapper.resolve("SD", "  ")).isEqualTo("Backlog");
    }

    @Test
    void devEdiyor_mapsToInProgress_acrossTeams() {
        assertThat(JiraStatusMapper.resolve("RPA", "Devam Ediyor")).isEqualTo("Devam Ediyor");
        assertThat(JiraStatusMapper.resolve("DSYS", "Devam Ediyor")).isEqualTo("Devam Ediyor");
    }
}
