package com.chambreservice.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtRoleConverter jwtRoleConverter;

    public SecurityConfig(JwtRoleConverter jwtRoleConverter) {
        this.jwtRoleConverter = jwtRoleConverter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authorizeHttpRequests(auth -> auth
                        // Internal inter-service endpoints — require a valid JWT (callers propagate the user token)
                        .requestMatchers("/api/internal/**").authenticated()
                        // Room reads are public; mutations require authentication
                        .requestMatchers(HttpMethod.GET, "/api/chambres/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chambre/**").permitAll()
                        .requestMatchers("/api/chambres/**").authenticated()
                        .requestMatchers("/api/chambre/**").authenticated()
                        // Reclamation and chat REST require auth; WebSocket upgrade cannot carry Bearer headers
                        .requestMatchers("/api/reclamations/**").authenticated()
                        .requestMatchers("/api/chats/**").authenticated()
                        .requestMatchers("/ws-chat/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                );

        return http.build();
    }

    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwtRoleConverter);
        return converter;
    }
}
