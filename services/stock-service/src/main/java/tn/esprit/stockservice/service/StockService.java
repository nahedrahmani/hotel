package tn.esprit.stockservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.stockservice.dto.MouvementStockDTO;
import tn.esprit.stockservice.dto.StockDTO;
import tn.esprit.stockservice.entity.MouvementStock;
import tn.esprit.stockservice.entity.Produit;
import tn.esprit.stockservice.entity.Stock;
import tn.esprit.stockservice.enums.TypeMouvement;
import tn.esprit.stockservice.repository.MouvementStockRepository;
import tn.esprit.stockservice.repository.ProduitRepository;
import tn.esprit.stockservice.repository.StockRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StockService {
    
    private final StockRepository stockRepository;
    private final ProduitRepository produitRepository;
    private final MouvementStockRepository mouvementRepository;

    public List<StockDTO> getAllStock() {
        Map<Long, Produit> produits = produitRepository.findAll().stream()
                .collect(Collectors.toMap(Produit::getId, p -> p));
        return stockRepository.findAll().stream()
                .map(s -> toDTO(s, produits))
                .collect(Collectors.toList());
    }

    public StockDTO getStockByProduitId(Long produitId) {
        Stock stock = stockRepository.findByProduitId(produitId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Stock non trouvé"));
        return toDTO(stock);
    }

    public void entreeStock(MouvementStockDTO dto) {
        Stock stock = stockRepository.findByProduitIdForUpdate(dto.getProduitId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Stock non trouvé"));
        
        stock.setQuantiteDisponible(stock.getQuantiteDisponible() + dto.getQuantite());
        stockRepository.save(stock);
        
        enregistrerMouvement(dto, TypeMouvement.ENTREE);
        log.info("Entrée stock: {} unités pour produit {}", dto.getQuantite(), dto.getProduitId());
    }

    public void sortieStock(MouvementStockDTO dto) {
        Stock stock = stockRepository.findByProduitIdForUpdate(dto.getProduitId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Stock non trouvé"));
        
        if (stock.getQuantiteDisponible() < dto.getQuantite()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Stock insuffisant");
        }
        
        stock.setQuantiteDisponible(stock.getQuantiteDisponible() - dto.getQuantite());
        stockRepository.save(stock);
        
        enregistrerMouvement(dto, TypeMouvement.SORTIE);
        log.info("Sortie stock: {} unités pour produit {}", dto.getQuantite(), dto.getProduitId());
    }

    public void ajustementStock(MouvementStockDTO dto) {
        Stock stock = stockRepository.findByProduitIdForUpdate(dto.getProduitId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Stock non trouvé"));
        
        stock.setQuantiteDisponible(dto.getQuantite());
        stockRepository.save(stock);
        
        enregistrerMouvement(dto, TypeMouvement.AJUSTEMENT);
        log.info("Ajustement stock: {} unités pour produit {}", dto.getQuantite(), dto.getProduitId());
    }

    public List<StockDTO> getProduitsEnRupture() {
        return stockRepository.findProduitsEnRupture().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Double getValeurTotaleStock() {
        Map<Long, Produit> produits = produitRepository.findAll()
                .stream()
                .collect(Collectors.toMap(Produit::getId, p -> p));

        return stockRepository.findAll().stream()
                .mapToDouble(stock -> {
                    Produit produit = produits.get(stock.getProduitId());
                    if (produit != null && produit.getPrixUnitaire() != null) {
                        return stock.getQuantiteDisponible() * produit.getPrixUnitaire();
                    }
                    return 0.0;
                })
                .sum();
    }

    private void enregistrerMouvement(MouvementStockDTO dto, TypeMouvement type) {
        MouvementStock mouvement = MouvementStock.builder()
                .produitId(dto.getProduitId())
                .typeMouvement(type)
                .quantite(dto.getQuantite())
                .motif(dto.getMotif())
                .utilisateurId(dto.getUtilisateurId())
                .build();
        mouvementRepository.save(mouvement);
    }

    private StockDTO toDTO(Stock stock) {
        return toDTO(stock, null);
    }

    private StockDTO toDTO(Stock stock, Map<Long, Produit> cache) {
        Produit produit = cache != null
                ? cache.get(stock.getProduitId())
                : produitRepository.findById(stock.getProduitId()).orElse(null);
        boolean enRupture = produit != null &&
                            stock.getQuantiteDisponible() <= produit.getSeuilMinimum();
        return StockDTO.builder()
                .id(stock.getId())
                .produitId(stock.getProduitId())
                .produitNom(produit != null ? produit.getNom() : "Inconnu")
                .quantiteDisponible(stock.getQuantiteDisponible())
                .quantiteReservee(stock.getQuantiteReservee())
                .emplacement(stock.getEmplacement())
                .enRupture(enRupture)
                .build();
    }
}
