import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;

public class AuthIntegrationTest {

    @BeforeAll
    static void setUp(){
        RestAssured.baseURI = "http://localhost:4004";
    }

    @Test
    public void shouldReturnOkWithValidToken(){
        String loginPayload = """
            {
               "email":"testuser@test.com",
               "password":"password123"
            }
            """;

        Response res = given()
                .contentType("application/json")
                .body(loginPayload)
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .body("token", notNullValue())
                .extract()
                .response();

        System.out.println("Generated Token: "+ res.jsonPath().getString("token"));
    }

    @Test
    public void shouldReturnUnauthorizedOnInvalidLogin(){
        String loginPayload = """
            {
               "email":"invalid_user@test.com",
               "password":"wrongpassword"
            }
            """;

            given()
                .contentType("application/json")
                .body(loginPayload)
                .when()
                .post("/auth/login")
                .then()
                .statusCode(401);
    }

    @Test
    public void shouldReturn400OnInvalidEmail(){
        String loginPayload = """
            {
               "email":"not-an-email",
               "password":"password123"
            }
            """;

            given()
                .contentType("application/json")
                .body(loginPayload)
                .when()
                .post("/auth/login")
                .then()
                .statusCode(400);
    }

    @Test
    public void shouldReturn400OnMissingPassword(){
        String loginPayload = """
            {
               "email":"test@example.com"
            }
            """;

            given()
                .contentType("application/json")
                .body(loginPayload)
                .when()
                .post("/auth/login")
                .then()
                .statusCode(400);
    }
}
