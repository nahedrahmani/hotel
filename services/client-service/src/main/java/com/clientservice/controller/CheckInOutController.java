package com.clientservice.controller;

import com.clientservice.entity.CheckInRecord;
import com.clientservice.entity.ConsoStock;
import com.clientservice.service.CheckInOutService;
import com.clientservice.service.ConsoStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/checkinout")
@RequiredArgsConstructor
public class CheckInOutController {

    private final CheckInOutService checkInOutService;
    private final ConsoStockService consoStockService;

    @PostMapping("/checkin/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public CheckInRecord checkIn(@PathVariable Long reservationId,
                                  @RequestBody Map<String, Object> body) {
        String keycloakId    = (String)  body.get("keycloakId");
        Boolean docVerified  = (Boolean) body.get("documentVerified");
        String notes         = (String)  body.get("notes");
        return checkInOutService.checkIn(reservationId, keycloakId, docVerified, notes);
    }

    @PostMapping("/checkout/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public CheckInRecord checkOut(@PathVariable Long reservationId,
                                   @RequestBody Map<String, Object> body) {
        String keycloakId = (String) body.get("keycloakId");
        String notes      = (String) body.get("notes");
        return checkInOutService.checkOut(reservationId, keycloakId, notes);
    }

    @GetMapping("/reservation/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<CheckInRecord> getByReservation(@PathVariable Long reservationId) {
        return checkInOutService.getByReservation(reservationId);
    }

    @GetMapping("/client/{keycloakId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<CheckInRecord> getByClient(@PathVariable String keycloakId) {
        return checkInOutService.getByClient(keycloakId);
    }

    @PostMapping("/conso/{reservationId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ConsoStock enregistrerConso(@PathVariable Long reservationId,
                                        @RequestBody Map<String, Object> body) {
        Long chambreId  = Long.valueOf(body.get("chambreId").toString());
        Long produitId  = Long.valueOf(body.get("produitId").toString());
        Integer quantite = Integer.valueOf(body.get("quantite").toString());
        return consoStockService.enregistrer(reservationId, chambreId, produitId, quantite);
    }

    @GetMapping("/conso/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<ConsoStock> getConsoByReservation(@PathVariable Long reservationId) {
        return consoStockService.getByReservation(reservationId);
    }
}
