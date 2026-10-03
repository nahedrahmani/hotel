package tn.esprit.rhservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.rhservice.dto.CongeDTO;
import tn.esprit.rhservice.enums.StatutConge;
import tn.esprit.rhservice.service.CongeService;

import java.util.List;

@RestController
@RequestMapping("/api/rh/conges")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class CongeController {

    private final CongeService congeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<CongeDTO> getAll() {
        return congeService.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public CongeDTO getById(@PathVariable Long id) {
        return congeService.getById(id);
    }

    @GetMapping("/employe/{employeId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<CongeDTO> getByEmploye(@PathVariable Long employeId) {
        return congeService.getByEmploye(employeId);
    }

    @GetMapping("/statut/{statut}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<CongeDTO> getByStatut(@PathVariable StatutConge statut) {
        return congeService.getByStatut(statut);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public CongeDTO create(@Valid @RequestBody CongeDTO dto) {
        return congeService.create(dto);
    }

    @PatchMapping("/{id}/approuver")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public CongeDTO approuver(@PathVariable Long id, @RequestParam String approvePar) {
        return congeService.approuver(id, approvePar);
    }

    @PatchMapping("/{id}/refuser")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public CongeDTO refuser(@PathVariable Long id, @RequestParam String approvePar) {
        return congeService.refuser(id, approvePar);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        congeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
