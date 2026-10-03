package tn.esprit.rhservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.rhservice.dto.ShiftDTO;
import tn.esprit.rhservice.service.PlanningService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/rh/planning")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class PlanningController {

    private final PlanningService planningService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<ShiftDTO> getPlanningByPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return planningService.getPlanningByPeriode(debut, fin);
    }

    @GetMapping("/employe/{employeId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<ShiftDTO> getPlanningByEmploye(
            @PathVariable Long employeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return planningService.getPlanningByEmploye(employeId, debut, fin);
    }

    @GetMapping("/jour")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<ShiftDTO> getShiftsByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return planningService.getShiftsByDate(date);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ShiftDTO createShift(@Valid @RequestBody ShiftDTO dto) {
        return planningService.createShift(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ShiftDTO updateShift(@PathVariable Long id, @Valid @RequestBody ShiftDTO dto) {
        return planningService.updateShift(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteShift(@PathVariable Long id) {
        planningService.deleteShift(id);
        return ResponseEntity.noContent().build();
    }
}
