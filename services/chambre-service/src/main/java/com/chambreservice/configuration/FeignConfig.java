package com.chambreservice.configuration;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Calls to stock-service carry the caller's token, which stock-service requires. */
@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor propagateAuthorizationHeader() {
        return requestTemplate -> {
            var attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes servletAttrs) {
                String auth = servletAttrs.getRequest().getHeader("Authorization");
                if (auth != null && !auth.isBlank()) {
                    requestTemplate.header("Authorization", auth);
                }
            }
        };
    }
}
