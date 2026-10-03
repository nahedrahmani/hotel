package tn.esprit.stockservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.stockservice.entity.MouvementStock;
import tn.esprit.stockservice.enums.TypeMouvement;
import tn.esprit.stockservice.service.MouvementStockService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/stock/mouvements")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class MouvementController {

    private final MouvementStockService mouvementService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<MouvementStock>> getAllMouvements() {
        return ResponseEntity.ok(mouvementService.getAll());
    }

    @GetMapping("/produit/{produitId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<MouvementStock>> getMouvementsByProduit(
            @PathVariable Long produitId) {
        return ResponseEntity.ok(mouvementService.getByProduitId(produitId));
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<MouvementStock>> getMouvementsByType(
            @PathVariable TypeMouvement type) {
        return ResponseEntity.ok(mouvementService.getByType(type));
    }

    @GetMapping("/periode")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<MouvementStock>> getMouvementsByPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(mouvementService.getByPeriode(debut, fin));
    }
}
