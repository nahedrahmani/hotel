package com.clientservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.math.BigDecimal;

@FeignClient(name = "stock-service")
public interface StockClient {

    @GetMapping("/api/stock/produits/{id}")
    ProduitDTO getProduitById(@PathVariable Long id);

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    class ProduitDTO {
        private Long id;
        private String nom;
        private BigDecimal prixUnitaire;
    }
}
