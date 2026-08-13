package com.aksa.capacityplanner.unit.jiraintegration;

import com.aksa.capacityplanner.jiraintegration.domain.JiraEstimationFieldMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JiraEstimationFieldMapperTest {

    @Test
    void resolveStoryPoints_prefersPrimaryField_customfield10016() {
        Map<String, Object> fields = Map.of(
                "customfield_10016", 5,
                "customfield_10057", 8);

        Number result = JiraEstimationFieldMapper.resolveStoryPoints(fields);

        assertThat(result).isEqualTo(5);
    }

    @Test
    void resolveStoryPoints_fallsBackToSecondaryField_whenPrimaryMissing() {
        Map<String, Object> fields = Map.of("customfield_10057", 8);

        Number result = JiraEstimationFieldMapper.resolveStoryPoints(fields);

        assertThat(result).isEqualTo(8);
    }

    @Test
    void resolveStoryPoints_returnsNull_whenNeitherFieldPresent() {
        Map<String, Object> fields = Map.of("summary", "bir is");

        Number result = JiraEstimationFieldMapper.resolveStoryPoints(fields);

        assertThat(result).isNull();
    }

    @Test
    void resolveStoryPoints_ignoresNonNumericValue() {
        Map<String, Object> fields = Map.of("customfield_10016", "N/A");

        Number result = JiraEstimationFieldMapper.resolveStoryPoints(fields);

        assertThat(result).isNull();
    }
}
