package com.esprit.ms.reservation.client;

import com.esprit.ms.reservation.DTOs.ChambreDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@FeignClient(name = "chambre-service")
public interface ChambreClient {

    /** Used for validation and enriching reservation responses */
    @GetMapping("/api/internal/chambres/{id}")
    ChambreDTO getChambreById(@PathVariable Long id);

    /** Called when reservation status changes to sync room availability */
    @PatchMapping("/api/internal/chambres/{id}/statut")
    void updateStatut(@PathVariable Long id, @RequestBody Map<String, String> body);
}
