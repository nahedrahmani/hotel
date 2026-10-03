package tn.esprit.rhservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.rhservice.dto.EmployeDTO;
import tn.esprit.rhservice.enums.Departement;
import tn.esprit.rhservice.enums.StatutEmploye;
import tn.esprit.rhservice.service.EmployeService;

import java.util.List;

@RestController
@RequestMapping("/api/rh/employes")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class EmployeController {

    private final EmployeService employeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<EmployeDTO> getAll() {
        return employeService.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public EmployeDTO getById(@PathVariable Long id) {
        return employeService.getById(id);
    }

    @GetMapping("/departement/{departement}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<EmployeDTO> getByDepartement(@PathVariable Departement departement) {
        return employeService.getByDepartement(departement);
    }

    @GetMapping("/statut/{statut}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<EmployeDTO> getByStatut(@PathVariable StatutEmploye statut) {
        return employeService.getByStatut(statut);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<EmployeDTO> search(@RequestParam String q) {
        return employeService.search(q);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public EmployeDTO create(@Valid @RequestBody EmployeDTO dto) {
        return employeService.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public EmployeDTO update(@PathVariable Long id, @Valid @RequestBody EmployeDTO dto) {
        return employeService.update(id, dto);
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public EmployeDTO changerStatut(@PathVariable Long id, @RequestParam StatutEmploye statut) {
        return employeService.changerStatut(id, statut);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
