package com.clientservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.math.BigDecimal;

@FeignClient(name = "stock-service")
public interface StockClient {

    @GetMapping("/api/stock/produits/{id}")
    ProduitDTO getProduitById(@PathVariable Long id);

    @PostMapping("/api/stock/sortie")
    void sortie(@RequestBody MouvementDTO mouvement);

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    class ProduitDTO {
        private Long id;
        private String nom;
        private BigDecimal prixUnitaire;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    class MouvementDTO {
        private Long produitId;
        private String typeMouvement;
        private Integer quantite;
        private String motif;
    }
}
