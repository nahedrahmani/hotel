package com.hotel.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigin;

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http.csrf(ServerHttpSecurity.CsrfSpec::disable)
                // CORS must be handled inside the security chain, otherwise preflight
                // (OPTIONS, no token) requests are rejected with 401 before reaching it
                .cors(Customizer.withDefaults())
                .authorizeExchange(exchange -> exchange
                        .pathMatchers("/eureka/**").permitAll()
                        // Room reads are public; mutations require auth
                        .pathMatchers(HttpMethod.GET, "/api/chambres/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/chambre/**").permitAll()
                        .pathMatchers("/api/chambres/**").authenticated()
                        .pathMatchers("/api/chambre/**").authenticated()
                        // Stock is internal — always requires auth
                        .pathMatchers("/api/stock/**").authenticated()
                        .pathMatchers("/api/chats/**").authenticated()
                        // Transport reads are public; mutations require auth
                        .pathMatchers(HttpMethod.GET, "/api/transports/**").permitAll()
                        .pathMatchers("/api/transports/**").authenticated()
                        .pathMatchers("/api/clients/**").authenticated()
                        .pathMatchers("/api/demandes/**").authenticated()
                        .pathMatchers("/api/checkinout/**").authenticated()
                        // Visitors can check availability and prices before logging in
                        .pathMatchers(HttpMethod.GET, "/api/reservations/availability", "/api/reservations/price").permitAll()
                        .pathMatchers("/api/reservations/**").authenticated()
                        .pathMatchers("/api/users/**").authenticated()
                        .pathMatchers("/api/rh/**").authenticated()
                        // Konnect calls back without a login; payment-service checks the payment with Konnect
                        .pathMatchers(HttpMethod.GET, "/api/payment/konnect/webhook").permitAll()
                        .pathMatchers("/api/payment/**").authenticated()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin(allowedOrigin);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}