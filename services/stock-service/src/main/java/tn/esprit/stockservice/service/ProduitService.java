package tn.esprit.stockservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.stockservice.dto.ProduitDTO;
import tn.esprit.stockservice.entity.Produit;
import tn.esprit.stockservice.entity.Stock;
import tn.esprit.stockservice.enums.CategorieStock;
import tn.esprit.stockservice.repository.ProduitRepository;
import tn.esprit.stockservice.repository.StockRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProduitService {
    
    private final ProduitRepository produitRepository;
    private final StockRepository stockRepository;

    public List<ProduitDTO> getAllProduits() {
        return produitRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProduitDTO getProduitById(Long id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produit non trouvé"));
        return toDTO(produit);
    }

    public ProduitDTO createProduit(ProduitDTO dto) {
        if (produitRepository.findByCode(dto.getCode()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un produit avec ce code existe déjà");
        }
        
        Produit produit = toEntity(dto);
        Produit saved = produitRepository.save(produit);
        
        // Créer le stock initial
        Stock stock = Stock.builder()
                .produitId(saved.getId())
                .quantiteDisponible(0)
                .quantiteReservee(0)
                .emplacement("Entrepôt principal")
                .build();
        stockRepository.save(stock);
        
        log.info("Produit créé: {}", saved.getNom());
        return toDTO(saved);
    }

    public ProduitDTO updateProduit(Long id, ProduitDTO dto) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produit non trouvé"));
        
        produit.setNom(dto.getNom());
        produit.setDescription(dto.getDescription());
        produit.setCategorie(dto.getCategorie());
        produit.setUnite(dto.getUnite());
        produit.setPrixUnitaire(dto.getPrixUnitaire());
        produit.setSeuilMinimum(dto.getSeuilMinimum());
        produit.setSeuilMaximum(dto.getSeuilMaximum());
        produit.setFournisseur(dto.getFournisseur());
        
        Produit updated = produitRepository.save(produit);
        log.info("Produit mis à jour: {}", updated.getNom());
        return toDTO(updated);
    }

    public void deleteProduit(Long id) {
        if (!produitRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produit non trouvé");
        }
        stockRepository.deleteByProduitId(id);
        produitRepository.deleteById(id);
        log.info("Produit supprimé: {}", id);
    }

    public List<ProduitDTO> getProduitsByCategorie(CategorieStock categorie) {
        return produitRepository.findByCategorie(categorie).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ProduitDTO> searchProduits(String nom) {
        return produitRepository.findByNomContainingIgnoreCase(nom).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private ProduitDTO toDTO(Produit produit) {
        return ProduitDTO.builder()
                .id(produit.getId())
                .code(produit.getCode())
                .nom(produit.getNom())
                .description(produit.getDescription())
                .categorie(produit.getCategorie())
                .unite(produit.getUnite())
                .prixUnitaire(produit.getPrixUnitaire())
                .seuilMinimum(produit.getSeuilMinimum())
                .seuilMaximum(produit.getSeuilMaximum())
                .fournisseur(produit.getFournisseur())
                .build();
    }

    private Produit toEntity(ProduitDTO dto) {
        return Produit.builder()
                .code(dto.getCode())
                .nom(dto.getNom())
                .description(dto.getDescription())
                .categorie(dto.getCategorie())
                .unite(dto.getUnite())
                .prixUnitaire(dto.getPrixUnitaire())
                .seuilMinimum(dto.getSeuilMinimum())
                .seuilMaximum(dto.getSeuilMaximum())
                .fournisseur(dto.getFournisseur())
                .build();
    }
}
