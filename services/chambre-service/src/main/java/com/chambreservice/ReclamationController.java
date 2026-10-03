package com.chambreservice;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/reclamations")
public class ReclamationController {

    @Autowired
    private ReclamationService reclamationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<Reclamation> getAllReclamations() {
        return reclamationService.getAllReclamations();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Reclamation getReclamationById(@PathVariable Long id) {
        return reclamationService.getReclamationById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reclamation not found with id " + id));
    }

    @GetMapping("/chambre/{chambreId}")
    @PreAuthorize("isAuthenticated()")
    public List<Reclamation> getReclamationsByChambre(@PathVariable Long chambreId) {
        return reclamationService.getReclamationsByChambre(chambreId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public Reclamation createReclamation(@Valid @RequestBody Reclamation reclamation) {
        return reclamationService.createReclamation(reclamation);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public Reclamation updateReclamation(@PathVariable Long id, @Valid @RequestBody Reclamation reclamation) {
        return reclamationService.updateReclamation(id, reclamation);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteReclamation(@PathVariable Long id) {
        reclamationService.deleteReclamation(id);
        return ResponseEntity.noContent().build();
    }
}
