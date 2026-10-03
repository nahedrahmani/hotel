package com.chambreservice.controller;

import com.chambreservice.ChambreService;
import com.chambreservice.dto.ProduitDTO;
import com.chambreservice.dto.ChambreStockDTO;
import com.chambreservice.dto.AssignProduitRequest;
import com.chambreservice.service.StockIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chambre/stock")
@RequiredArgsConstructor
public class StockIntegrationController {

    private final StockIntegrationService stockIntegrationService;
    private final ChambreService chambreService;

    @GetMapping("/produits")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<ProduitDTO>> getAllProduits() {
        return ResponseEntity.ok(stockIntegrationService.getAllProduits());
    }

    @GetMapping("/produits/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<ProduitDTO> getProduitById(@PathVariable Long id) {
        return ResponseEntity.ok(stockIntegrationService.getProduitById(id));
    }

    @GetMapping("/produits/categorie/{categorie}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<ProduitDTO>> getProduitsByCategorie(@PathVariable String categorie) {
        return ResponseEntity.ok(stockIntegrationService.getProduitsByCategorie(categorie));
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<ProduitDTO>> getProduitsDisponibles() {
        return ResponseEntity.ok(stockIntegrationService.getProduitsDisponibles());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Map<String, Object>> getStockStats() {
        return ResponseEntity.ok(stockIntegrationService.getStockStatistics());
    }

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<String> assignProduitToChambre(@RequestBody AssignProduitRequest request) {
        chambreService.addProduitToChambre(request.getChambreId(), request.getProduitId());
        return ResponseEntity.ok("Produit assigné avec succès");
    }

    @GetMapping("/chambre/{chambreId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<ChambreStockDTO> getChambreStock(@PathVariable Long chambreId) {
        List<ProduitDTO> produits = chambreService.getProduitsByChambre(chambreId);
        ChambreStockDTO dto = new ChambreStockDTO();
        dto.setChambreId(chambreId);
        dto.setProduitsAssocies(produits);
        dto.setNombreProduits(produits.size());
        return ResponseEntity.ok(dto);
    }
}
