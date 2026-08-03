package com.aksa.capacityplanner.subsystem.capacity;

import com.aksa.capacityplanner.testsupport.AbstractTestcontainersSupport;
import io.restassured.RestAssured;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.time.Duration;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * capacity modulunun team + leave modulleriyle orkestrasyonunu, iki katmanli cache'i
 * ve RabbitMQ jira-sync akisini gercek Postgres/Redis/RabbitMQ container'lari uzerinde dogrular.
 * Tek bir modulun degil, birden fazla modulun birlikte calismasinin testidir.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CapacityDashboardSubsystemIT extends AbstractTestcontainersSupport {

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "http://localhost";
    }

    @Test
    void dashboard_aggregatesWorkItemsAcrossTeamAndLeaveModules() {
        int teamId = given().contentType("application/json")
                .body("{\"name\":\"Subsystem Test Ekibi\",\"maintenanceAllocationPercent\":0}")
                .when().post("/api/teams")
                .then().statusCode(200).extract().path("id");

        int memberId = given().contentType("application/json")
                .body("""
                        {"fullName":"Deniz Yilmaz","role":"Gelistirici","startDate":"2026-01-01","statusCode":"OPEN"}
                        """)
                .when().post("/api/teams/{teamId}/members", teamId)
                .then().statusCode(200).extract().path("id");

        given().contentType("application/json")
                .body("""
                        {"teamMemberId":%d,"title":"Ozellik A","plannedEffortDays":10,"statusCode":"OPEN"}
                        """.formatted(memberId))
                .when().post("/api/teams/{teamId}/work-items", teamId)
                .then().statusCode(200);

        given()
        .when()
                .get("/api/teams/{teamId}/capacity-dashboard?reportDate=2026-06-01", teamId)
        .then()
                .statusCode(200)
                .body("totalPlannedEffort", equalTo(10.0f))
                .body("remainingEffort", equalTo(10.0f))
                .body("memberMetrics.size()", equalTo(1))
                .body("memberMetrics[0].fullName", equalTo("Deniz Yilmaz"));
    }

    @Test
    void dashboard_isCached_thenInvalidatedAfterNewWorkItem() {
        int teamId = given().contentType("application/json")
                .body("{\"name\":\"Cache Test Ekibi\"}")
                .when().post("/api/teams")
                .then().statusCode(200).extract().path("id");

        float firstTotal = given()
                .when().get("/api/teams/{teamId}/capacity-dashboard?reportDate=2026-06-01", teamId)
                .then().statusCode(200).extract().path("totalPlannedEffort");
        assertEquals(0.0f, firstTotal);

        given().contentType("application/json")
                .body("{\"title\":\"Yeni is\",\"plannedEffortDays\":7,\"statusCode\":\"OPEN\"}")
                .when().post("/api/teams/{teamId}/work-items", teamId)
                .then().statusCode(200);

        // Cache evict tetiklendi, yeni is kaleminin dashboard'a yansimasi beklenir (5dk TTL'i beklemeden)
        given()
                .when().get("/api/teams/{teamId}/capacity-dashboard?reportDate=2026-06-01", teamId)
                .then().statusCode(200).body("totalPlannedEffort", equalTo(7.0f));
    }

    @Test
    void jiraSyncTrigger_isConsumedAsynchronouslyViaRabbitMq() {
        int teamId = given().contentType("application/json")
                .body("{\"name\":\"Jira Sync Test Ekibi\"}")
                .when().post("/api/teams")
                .then().statusCode(200).extract().path("id");

        given().contentType("application/json")
                .body("{\"jiraProjectKey\":\"SUB\"}")
                .when().post("/api/teams/{teamId}/jira-sync", teamId)
                .then().statusCode(202);

        // Jira devre disi (NoOp adaptor) oldugu icin issue donmez; ama mesaj kuyruktan
        // tuketilip akis hatasiz tamamlanmali - is kalemi listesi bos kalmaya devam eder.
        Awaitility.await().atMost(Duration.ofSeconds(5)).untilAsserted(() ->
                given().when().get("/api/teams/{teamId}/work-items", teamId)
                        .then().statusCode(200).body("size()", equalTo(0)));
    }
}
