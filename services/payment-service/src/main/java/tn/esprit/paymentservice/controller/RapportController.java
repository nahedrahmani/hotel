package tn.esprit.paymentservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.paymentservice.dto.RapportDTO;
import tn.esprit.paymentservice.service.RapportService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/payment/rapports")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class RapportController {

    private final RapportService rapportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public RapportDTO getRapport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        LocalDate d = debut != null ? debut : LocalDate.now().withDayOfMonth(1);
        LocalDate f = fin != null ? fin : LocalDate.now();
        return rapportService.genererRapport(d, f);
    }
}
