package com.chambreservice;

import com.chambreservice.dto.ProduitDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/chambres")
public class ChambreController {

    @Autowired
    private ChambreService chambreService;

    @GetMapping
    public List<Chambre> getAllChambres(@RequestParam(required = false) Long hotelId) {
        return hotelId != null ? chambreService.getByHotelId(hotelId) : chambreService.getAllChambres();
    }

    @GetMapping("/a-nettoyer")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<Chambre> getChambresANettoyer(@RequestParam(required = false) Long hotelId) {
        return chambreService.getChambresANettoyer(hotelId);
    }

    @PatchMapping("/{id}/marquer-propre")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public Chambre marquerPropre(@PathVariable Long id) {
        return chambreService.marquerPropre(id);
    }

    @GetMapping("/{id}")
    public Chambre getChambreById(@PathVariable Long id) {
        return chambreService.getChambreById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chambre not found with id " + id));
    }

    @PostMapping(consumes = {"multipart/form-data"})
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Chambre createChambre(
            @RequestPart("chambre") Chambre chambre,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        return chambreService.createChambre(chambre, photo);
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Chambre updateChambre(
            @PathVariable Long id,
            @RequestPart("chambre") Chambre chambre,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        return chambreService.updateChambre(id, chambre, photo);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteChambre(@PathVariable Long id) {
        chambreService.deleteChambre(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/politique")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Chambre updatePolitique(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        return chambreService.updatePolitique(id, body);
    }

    @PostMapping("/{chambreId}/produits/{produitId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public Chambre addProduitToChambre(@PathVariable Long chambreId, @PathVariable Long produitId) {
        return chambreService.addProduitToChambre(chambreId, produitId);
    }

    @DeleteMapping("/{chambreId}/produits/{produitId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public Chambre removeProduitFromChambre(@PathVariable Long chambreId, @PathVariable Long produitId) {
        return chambreService.removeProduitFromChambre(chambreId, produitId);
    }

    @GetMapping("/{chambreId}/produits")
    public List<ProduitDTO> getProduitsByChambre(@PathVariable Long chambreId) {
        return chambreService.getProduitsByChambre(chambreId);
    }
}
