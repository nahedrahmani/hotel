package tn.esprit.paymentservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.paymentservice.dto.FactureDTO;
import tn.esprit.paymentservice.dto.LigneFactureDTO;
import tn.esprit.paymentservice.enums.StatutFacture;
import tn.esprit.paymentservice.service.FactureService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payment/factures")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class FactureController {

    private final FactureService factureService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<FactureDTO> getAll() {
        return factureService.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public FactureDTO getById(@PathVariable Long id) {
        return factureService.getById(id);
    }

    @GetMapping("/statut/{statut}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<FactureDTO> getByStatut(@PathVariable StatutFacture statut) {
        return factureService.getByStatut(statut);
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<FactureDTO> getByClient(@PathVariable Long clientId) {
        return factureService.getByClient(clientId);
    }

    @GetMapping("/reservation/{reservationId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<FactureDTO> getByReservation(@PathVariable Long reservationId) {
        return factureService.getByReservation(reservationId);
    }

    // Extras consumed during the stay (minibar) are billed by reception before check-out
    @PostMapping("/reservation/{reservationId}/lignes")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public FactureDTO ajouterLigneSejour(@PathVariable Long reservationId, @RequestBody LigneFactureDTO ligne) {
        return factureService.ajouterLigneSejour(reservationId, ligne);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<FactureDTO> search(@RequestParam String q) {
        return factureService.search(q);
    }

    @GetMapping("/periode")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<FactureDTO> getByPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return factureService.getByPeriode(debut, fin);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public FactureDTO create(@Valid @RequestBody FactureDTO dto) {
        return factureService.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public FactureDTO update(@PathVariable Long id, @Valid @RequestBody FactureDTO dto) {
        return factureService.update(id, dto);
    }

    // Reception issues the stay invoice when the guest checks out
    @PatchMapping("/{id}/emettre")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public FactureDTO emettre(@PathVariable Long id) {
        return factureService.emettre(id);
    }

    @PatchMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public FactureDTO annuler(@PathVariable Long id) {
        return factureService.annuler(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        factureService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
