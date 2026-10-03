package com.chambreservice.service;

import com.chambreservice.client.StockClient;
import com.chambreservice.dto.ProduitDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockIntegrationService {

    private final StockClient stockClient;

    public List<ProduitDTO> getAllProduits() {
        try {
            return stockClient.getAllProduits();
        } catch (Exception e) {
            log.warn("Could not reach stock-service to fetch all produits: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public ProduitDTO getProduitById(Long id) {
        try {
            return stockClient.getProduitById(id);
        } catch (Exception e) {
            log.warn("Could not fetch produit with id {} from stock-service: {}", id, e.getMessage());
            return null;
        }
    }

    public List<ProduitDTO> getProduitsByCategorie(String categorie) {
        try {
            return stockClient.getProduitsByCategorie(categorie);
        } catch (Exception e) {
            log.warn("Could not fetch produits for categorie {} from stock-service: {}", categorie, e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<ProduitDTO> getProduitsDisponibles() {
        return getAllProduits();
    }

    public Map<String, Object> getStockStatistics() {
        List<ProduitDTO> produits = getAllProduits();
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProduits", produits.size());
        stats.put("categories", produits.stream()
            .map(ProduitDTO::getCategorie)
            .distinct()
            .count());

        try {
            Map<String, Double> valeurData = stockClient.getValeurTotale();
            stats.put("valeurTotale", valeurData.getOrDefault("valeurTotale", 0.0));
        } catch (Exception e) {
            log.warn("Could not fetch stock value from stock-service: {}", e.getMessage());
            stats.put("valeurTotale", 0.0);
        }

        return stats;
    }
}
