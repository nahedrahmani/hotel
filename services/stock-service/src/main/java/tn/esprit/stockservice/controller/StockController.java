package tn.esprit.stockservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import tn.esprit.stockservice.dto.MouvementStockDTO;
import tn.esprit.stockservice.dto.StockDTO;
import tn.esprit.stockservice.service.StockService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class StockController {

    private final StockService stockService;

    @GetMapping("/inventaire")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<StockDTO>> getInventaire() {
        return ResponseEntity.ok(stockService.getAllStock());
    }

    @GetMapping("/produit/{produitId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<StockDTO> getStockByProduit(@PathVariable Long produitId) {
        return ResponseEntity.ok(stockService.getStockByProduitId(produitId));
    }

    @PostMapping("/entree")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Void> entreeStock(@Valid @RequestBody MouvementStockDTO dto, @AuthenticationPrincipal Jwt jwt) {
        dto.setUtilisateurId(auteur(jwt));
        stockService.entreeStock(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sortie")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Void> sortieStock(@Valid @RequestBody MouvementStockDTO dto, @AuthenticationPrincipal Jwt jwt) {
        dto.setUtilisateurId(auteur(jwt));
        stockService.sortieStock(dto);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/ajustement")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> ajustementStock(@Valid @RequestBody MouvementStockDTO dto, @AuthenticationPrincipal Jwt jwt) {
        dto.setUtilisateurId(auteur(jwt));
        stockService.ajustementStock(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/alertes")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<StockDTO>> getProduitsEnRupture() {
        return ResponseEntity.ok(stockService.getProduitsEnRupture());
    }

    @GetMapping("/stats/valeur")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Map<String, Double>> getValeurTotale() {
        Double valeur = stockService.getValeurTotaleStock();
        return ResponseEntity.ok(Map.of("valeurTotale", valeur));
    }

    /** Who moved the stock, taken from the login token rather than trusted from the request body. */
    private static String auteur(Jwt jwt) {
        if (jwt == null) return null;
        String username = jwt.getClaimAsString("preferred_username");
        return username != null ? username : jwt.getSubject();
    }
}
