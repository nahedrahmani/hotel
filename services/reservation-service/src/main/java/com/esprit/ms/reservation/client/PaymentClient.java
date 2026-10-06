package com.esprit.ms.reservation.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@FeignClient(name = "payment-service")
public interface PaymentClient {

    @GetMapping("/api/payment/factures/reservation/{reservationId}")
    List<FactureDTO> getFacturesByReservation(@PathVariable Long reservationId);

    @PostMapping("/api/payment/factures")
    FactureDTO createFacture(@RequestBody FactureCreateDTO dto);

    @PatchMapping("/api/payment/factures/{id}/annuler")
    FactureDTO annulerFacture(@PathVariable Long id);

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    class FactureDTO {
        private Long id;
        private String numero;
        private String statut;
        private BigDecimal totalTTC;
        private BigDecimal montantPaye;
        private BigDecimal montantRestant;
        private String dateEmission;
        private String clientNom;
    }

    @Data
    class FactureCreateDTO {
        private Long reservationId;
        private Long clientId;
        private String clientNom;
        private String clientEmail;
        private String typeFacture;
        private LocalDate dateEmission;
        private LocalDate dateEcheance;
        private String notes;
        private List<LigneDTO> lignes;
    }

    @Data
    class LigneDTO {
        private String description;
        private Integer quantite;
        private BigDecimal prixUnitaire;
        private BigDecimal tauxTva;
        /** prixUnitaire includes VAT — room prices are quoted to guests TTC */
        private Boolean prixTtc;
    }
}
