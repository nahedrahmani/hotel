package tn.esprit.stockservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.stockservice.dto.ProduitDTO;
import tn.esprit.stockservice.enums.CategorieStock;
import tn.esprit.stockservice.service.ProduitService;

import java.util.List;

@RestController
@RequestMapping("/api/stock/produits")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class ProduitController {

    private final ProduitService produitService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<ProduitDTO>> getAllProduits() {
        return ResponseEntity.ok(produitService.getAllProduits());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<ProduitDTO> getProduitById(@PathVariable Long id) {
        return ResponseEntity.ok(produitService.getProduitById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ProduitDTO> createProduit(@Valid @RequestBody ProduitDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(produitService.createProduit(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ProduitDTO> updateProduit(
            @PathVariable Long id,
            @Valid @RequestBody ProduitDTO dto) {
        return ResponseEntity.ok(produitService.updateProduit(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduit(@PathVariable Long id) {
        produitService.deleteProduit(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categorie/{categorie}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<ProduitDTO>> getProduitsByCategorie(
            @PathVariable CategorieStock categorie) {
        return ResponseEntity.ok(produitService.getProduitsByCategorie(categorie));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<ProduitDTO>> searchProduits(@RequestParam String nom) {
        return ResponseEntity.ok(produitService.searchProduits(nom));
    }
}
