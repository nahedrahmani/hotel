package tn.esprit.rhservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.rhservice.dto.TacheDTO;
import tn.esprit.rhservice.enums.StatutTache;
import tn.esprit.rhservice.service.TacheService;

import java.util.List;

@RestController
@RequestMapping("/api/rh/taches")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class TacheController {

    private final TacheService tacheService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<TacheDTO> getAll() {
        return tacheService.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public TacheDTO getById(@PathVariable Long id) {
        return tacheService.getById(id);
    }

    @GetMapping("/employe/{employeId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<TacheDTO> getByEmploye(@PathVariable Long employeId) {
        return tacheService.getByEmploye(employeId);
    }

    @GetMapping("/statut/{statut}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<TacheDTO> getByStatut(@PathVariable StatutTache statut) {
        return tacheService.getByStatut(statut);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public TacheDTO create(@Valid @RequestBody TacheDTO dto) {
        return tacheService.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public TacheDTO update(@PathVariable Long id, @Valid @RequestBody TacheDTO dto) {
        return tacheService.update(id, dto);
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public TacheDTO changerStatut(@PathVariable Long id, @RequestParam StatutTache statut) {
        return tacheService.changerStatut(id, statut);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tacheService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
