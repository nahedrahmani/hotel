package com.clientservice.controller;

import com.clientservice.entity.Demande;
import com.clientservice.service.DemandeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
public class DemandeController {

    private final DemandeService demandeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<Demande> getAll(@RequestParam(required = false) Demande.DemandeStatut statut) {
        return statut != null ? demandeService.getByStatut(statut) : demandeService.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public Demande getById(@PathVariable Long id) {
        return demandeService.getById(id);
    }

    @GetMapping("/client/{keycloakId}")
    // Guests follow the requests they filed; staff see anyone's
    @PreAuthorize("#keycloakId == authentication.name or hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<Demande> getByClient(@PathVariable String keycloakId) {
        return demandeService.getByClient(keycloakId);
    }

    @GetMapping("/chambre/{chambreId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<Demande> getByChambre(@PathVariable Long chambreId) {
        return demandeService.getByChambre(chambreId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public Demande create(@RequestBody Demande demande,
                          @AuthenticationPrincipal Jwt jwt,
                          Authentication authentication) {
        // Staff may log a request for any guest; a guest's request is always filed under their own account
        boolean staff = authentication.getAuthorities().stream()
                .anyMatch(a -> List.of("ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF").contains(a.getAuthority()));
        if (!staff) {
            demande.setKeycloakId(jwt.getSubject());
        }
        return demandeService.create(demande);
    }

    @PutMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public Demande updateStatut(@PathVariable Long id,
                                @RequestBody Map<String, String> body) {
        String raw = body.get("statut");
        if (raw == null) throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "statut is required");
        try {
            return demandeService.updateStatut(id, Demande.DemandeStatut.valueOf(raw));
        } catch (IllegalArgumentException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid statut: " + raw);
        }
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Demande assign(@PathVariable Long id,
                          @RequestBody Map<String, String> body) {
        return demandeService.assign(id, body.get("assignedTo"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        demandeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
