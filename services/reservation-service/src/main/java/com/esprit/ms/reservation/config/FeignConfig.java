package com.esprit.ms.reservation.config;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Map;

@Configuration
public class FeignConfig {

    @Value("${service-auth.token-uri:http://localhost:9999/realms/hotel/protocol/openid-connect/token}")
    private String tokenUri;

    @Value("${service-auth.client-id:reservation-service}")
    private String clientId;

    @Value("${service-auth.client-secret}")
    private String clientSecret;

    private final RestClient restClient = RestClient.create();
    private String cachedToken;
    private Instant expiresAt = Instant.EPOCH;

    /**
     * Calls to other services (room lookup, room status sync, invoice creation) are made
     * with this service's own Keycloak service account, not the end user's token.
     * Forwarding the user's token made those calls fail whenever the caller was a guest
     * (or STAFF creating invoices), because the internal endpoints require staff roles.
     */
    @Bean
    public RequestInterceptor serviceAccountAuthorization() {
        return requestTemplate -> requestTemplate.header("Authorization", "Bearer " + serviceToken());
    }

    private synchronized String serviceToken() {
        // Refresh 30s before expiry so an in-flight call never carries a stale token
        if (cachedToken == null || Instant.now().isAfter(expiresAt.minusSeconds(30))) {
            var form = new LinkedMultiValueMap<String, String>();
            form.add("grant_type", "client_credentials");
            form.add("client_id", clientId);
            form.add("client_secret", clientSecret);

            Map<?, ?> response = restClient.post()
                    .uri(tokenUri)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);

            cachedToken = (String) response.get("access_token");
            expiresAt = Instant.now().plusSeconds(((Number) response.get("expires_in")).longValue());
        }
        return cachedToken;
    }
}
