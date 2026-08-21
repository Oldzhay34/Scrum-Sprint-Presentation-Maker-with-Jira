package com.aksa.capacityplanner.module.team;

import com.aksa.capacityplanner.testsupport.AbstractTestcontainersSupport;
import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

/**
 * Team modulunun uctan uca (api -> facade -> usecase -> persistence) dogrulanmasi,
 * gercek Postgres container.i uzerinde (Flyway migration'lari dahil).
 * Diger modullerle (leave, capacity) orkestrasyon subsystem katmaninda test edilir.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class TeamModuleIT extends AbstractTestcontainersSupport {

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "http://localhost";
    }

    @Test
    void createTeam_addMember_defaultTargetWorkDaysCalculatedViaRealHolidayCalendar() {
        int teamId =
                given()
                        .contentType("application/json")
                        .body("""
                                {"name":"Modul Test Ekibi","maintenanceAllocationPercent":0.2}
                                """)
                .when()
                        .post("/api/teams")
                .then()
                        .statusCode(200)
                        .body("name", equalTo("Modul Test Ekibi"))
                        .extract().path("id");

        // startDate 1 Haziran'dan once -> varsayilan hedef 145 gun (gercek tatil takvimi ile hesaplanir)
        given()
                .contentType("application/json")
                .body("""
                        {"fullName":"Ada Lovelace","role":"Gelistirici","startDate":"2026-01-15","statusCode":"OPEN"}
                        """)
        .when()
                .post("/api/teams/{teamId}/members", teamId)
        .then()
                .statusCode(200)
                .body("fullName", equalTo("Ada Lovelace"))
                .body("targetWorkDays", equalTo(145.0f))
                .body("targetWorkDaysOverridden", equalTo(false));

        given()
        .when()
                .get("/api/teams/{teamId}/members", teamId)
        .then()
                .statusCode(200)
                .body("size()", equalTo(1))
                .body("[0].fullName", equalTo("Ada Lovelace"));
    }

    @Test
    void addMember_startingAfterJune1_getsProratedTargetWorkDays() {
        int teamId =
                given().contentType("application/json").body("{\"name\":\"Gec Baslayan Ekip\"}")
                        .when().post("/api/teams")
                        .then().statusCode(200).extract().path("id");

        float target =
                given()
                        .contentType("application/json")
                        .body("""
                                {"fullName":"Gec Baslayan Kisi","startDate":"2026-11-02"}
                                """)
                .when()
                        .post("/api/teams/{teamId}/members", teamId)
                .then()
                        .statusCode(200)
                        .extract().path("targetWorkDays");

        assertThat(target, lessThan(145.0f));
        assertThat(target, greaterThan(0.0f));
    }

    @Test
    void customFieldDefinition_canBeAddedAndListedForTeam() {
        int teamId =
                given().contentType("application/json").body("{\"name\":\"RPA\"}")
                        .when().post("/api/teams")
                        .then().statusCode(200).extract().path("id");

        given()
                .contentType("application/json")
                .body("""
                        {"fieldKey":"fteOrani","label":"FTE Orani","type":"PERCENT","required":true,"sortOrder":0}
                        """)
        .when()
                .post("/api/teams/{teamId}/custom-fields", teamId)
        .then()
                .statusCode(200)
                .body("fieldKey", equalTo("fteOrani"));

        given()
        .when()
                .get("/api/teams/{teamId}/custom-fields", teamId)
        .then()
                .statusCode(200)
                .body("size()", equalTo(1))
                .body("[0].label", equalTo("FTE Orani"));
    }
}
