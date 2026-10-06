package com.clientservice.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@FeignClient(name = "reservation-service")
public interface ReservationClient {

    @GetMapping("/api/reservations/{id}")
    ReservationDTO getById(@PathVariable Long id);

    @PutMapping("/api/reservations/{id}")
    ReservationDTO update(@PathVariable Long id, @RequestBody ReservationDTO dto);

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    class ReservationDTO {
        private Long id;
        private Long customerId;
        // Sent back unchanged on update: reservation-service replaces every field it receives
        private String keycloakId;
        private String guestName;
        private String guestEmail;
        private String specialRequests;
        private String cancelReason;
        private Long roomId;
        private String checkInDate;
        private String checkOutDate;
        private Integer numberOfGuests;
        private String reservationType;
        private String status;
        private BigDecimal totalPrice;
        private BigDecimal depositPaid;
    }
}
