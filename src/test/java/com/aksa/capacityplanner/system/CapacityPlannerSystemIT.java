package com.aksa.capacityplanner.system;

import com.aksa.capacityplanner.testsupport.AbstractTestcontainersSupport;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Tam kara-kutu (blackbox) sistem testi: uygulamayi gercek Postgres
 * container'lariyla tamamen ayaga kaldirir ve sadece HTTP sinirindan, harici bir
 * istemci gibi davranarak dogrular. Ic yapiyi (hangi sinif hangi katmanda) bilmez.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CapacityPlannerSystemIT extends AbstractTestcontainersSupport {

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "http://localhost";
    }

    @Test
    void companyWideLeaveCalendar_isSeededAndAccessibleOnFreshStartup() {
        given()
        .when()
                .get("/api/leave-periods/company-wide")
        .then()
                .statusCode(200)
                .body("size()", greaterThan(0))
                .body("name", hasItem("Ortak Sirket Izni"));
    }

    @Test
    void fullLifecycle_team_member_customField_workItem_dashboard() {
        int teamId = given().contentType("application/json")
                .body("{\"name\":\"Sistem Test Ekibi\",\"maintenanceAllocationPercent\":0.1}")
                .when().post("/api/teams")
                .then().statusCode(200).body("name", equalTo("Sistem Test Ekibi")).extract().path("id");

        given().contentType("application/json")
                .body("""
                        {"fieldKey":"fteOrani","label":"FTE Orani","type":"PERCENT","required":false,"sortOrder":0}
                        """)
                .when().post("/api/teams/{teamId}/custom-fields", teamId)
                .then().statusCode(200);

        int memberId = given().contentType("application/json")
                .body("""
                        {"fullName":"Sistem Test Kisisi","role":"Analist","startDate":"2026-02-01","statusCode":"OPEN"}
                        """)
                .when().post("/api/teams/{teamId}/members", teamId)
                .then().statusCode(200).extract().path("id");

        given().contentType("application/json")
                .body("{\"statusCode\":\"IN_PROGRESS\"}")
                .when().patch("/api/teams/{teamId}/members/{memberId}/status", teamId, memberId)
                .then().statusCode(200)
                .body("statusCode", equalTo("IN_PROGRESS"));

        given().contentType("application/json")
                .body("""
                        {"teamMemberId":%d,"title":"Sistem test isi","plannedEffortDays":20,"statusCode":"OPEN"}
                        """.formatted(memberId))
                .when().post("/api/teams/{teamId}/work-items", teamId)
                .then().statusCode(200);

        given()
        .when()
                .get("/api/teams/{teamId}/capacity-dashboard?reportDate=2026-06-01", teamId)
        .then()
                .statusCode(200)
                .body("teamId", equalTo(teamId))
                .body("totalPlannedEffort", equalTo(20.0f))
                .body("memberMetrics[0].totalPlannedEffort", equalTo(20.0f))
                .body("memberMetrics[0].riskLevel", notNullValue());
    }

    @Test
    void unknownTeam_returns404WithStructuredError() {
        given()
        .when()
                .get("/api/teams/{teamId}", 999_999)
        .then()
                .statusCode(404)
                .body("status", equalTo(404))
                .body("message", containsString("bulunamadi"));
    }

    @Test
    void invalidTeamPayload_returns400() {
        given().contentType("application/json")
                .body("{}")
        .when()
                .post("/api/teams")
        .then()
                .statusCode(400);
    }
}
