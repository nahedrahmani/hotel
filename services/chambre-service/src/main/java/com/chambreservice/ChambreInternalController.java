package com.chambreservice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Internal endpoints for inter-service calls (not exposed via gateway routes).
 * Callers must propagate the user's Bearer token (see FeignConfig).
 */
@RestController
@RequestMapping("/api/internal/chambres")
public class ChambreInternalController {

    @Autowired
    private ChambreService chambreService;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public Chambre getChambreById(@PathVariable Long id) {
        return chambreService.getChambreById(id)
                .orElseThrow(() -> new RuntimeException("Chambre not found: " + id));
    }

    @GetMapping("/a-nettoyer")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<Chambre> getChambresANettoyer(@RequestParam(required = false) Long hotelId) {
        return chambreService.getChambresANettoyer(hotelId);
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public void updateStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statut = body.get("statut");
        if (statut == null) return;
        chambreService.updateStatut(id, statut);
    }

    @PatchMapping("/{id}/marquer-propre")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public void marquerPropre(@PathVariable Long id) {
        chambreService.marquerPropre(id);
    }
}
