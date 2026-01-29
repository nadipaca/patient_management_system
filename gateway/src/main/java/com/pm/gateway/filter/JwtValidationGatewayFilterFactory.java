package com.pm.gateway.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class JwtValidationGatewayFilterFactory extends AbstractGatewayFilterFactory<Object> {

    private final WebClient webClient;

    // for production level, use auth_Service_url from env variable or config server
    // auth-service:4005
    // ecs.aws.internal:723847
    public JwtValidationGatewayFilterFactory(WebClient.Builder webClientBuilder, @Value("${auth.service.url}") String authServiceUrl) {
        this.webClient = webClientBuilder.baseUrl(authServiceUrl).build();
    }

    // abstract gateway filter factory is used to add filter so that whatever requests pass through gateway has to be filtered i.e authentication
     @Override
    public GatewayFilter apply(Object config) {
        return (exchange, chain) -> {
            String token = exchange.getRequest().getHeaders().getFirst("Authorization");

            if(token == null || !token.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            return webClient.get()
                    .uri("/validate")
                    .header("Authorization", token)
                    .retrieve()
                    .toBodilessEntity()
                    .then(chain.filter(exchange));
        };
    }
}
