package tn.esprit.rhservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.rhservice.dto.PointageDTO;
import tn.esprit.rhservice.service.PointageService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rh/pointages")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class PointageController {

    private final PointageService pointageService;

    @GetMapping("/jour")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<PointageDTO> getByDate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return pointageService.getByDate(date != null ? date : LocalDate.now());
    }

    @GetMapping("/employe/{employeId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<PointageDTO> getByEmploye(
            @PathVariable Long employeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return pointageService.getByEmploye(employeId, debut, fin);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public Map<String, Long> getStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return pointageService.getStatsJour(date != null ? date : LocalDate.now());
    }

    @PostMapping("/entree/{employeId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public PointageDTO pointageEntree(@PathVariable Long employeId) {
        return pointageService.pointageEntree(employeId);
    }

    @PatchMapping("/sortie/{employeId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public PointageDTO pointageSortie(@PathVariable Long employeId) {
        return pointageService.pointageSortie(employeId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public PointageDTO create(@Valid @RequestBody PointageDTO dto) {
        return pointageService.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public PointageDTO update(@PathVariable Long id, @Valid @RequestBody PointageDTO dto) {
        return pointageService.update(id, dto);
    }
}
