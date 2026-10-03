package com.clientservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "chambre-service")
public interface ChambreClient {

    @GetMapping("/api/internal/chambres/{id}")
    ChambreDTO getChambreById(@PathVariable Long id);

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    class ChambreDTO {
        private Long id;
        private String numero;
        private Double prix;
        private List<Long> produitIds;
    }
}
