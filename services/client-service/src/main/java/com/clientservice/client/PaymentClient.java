package com.clientservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@FeignClient(name = "payment-service")
public interface PaymentClient {

    @GetMapping("/api/payment/factures/reservation/{reservationId}")
    List<FactureDTO> getByReservation(@PathVariable Long reservationId);

    @PatchMapping("/api/payment/factures/{id}/emettre")
    FactureDTO emettre(@PathVariable Long id);

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    class FactureDTO {
        private Long id;
        private String statut;
        private BigDecimal totalTTC;
    }
}
