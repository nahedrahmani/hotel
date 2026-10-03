package com.clientservice.service;

import com.clientservice.client.ChambreClient;
import com.clientservice.client.StockClient;
import com.clientservice.entity.ConsoStock;
import com.clientservice.repository.ConsoStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsoStockService {

    private final ConsoStockRepository consoStockRepository;
    private final ChambreClient chambreClient;
    private final StockClient stockClient;

    public List<ConsoStock> getByReservation(Long reservationId) {
        return consoStockRepository.findByReservationId(reservationId);
    }

    public ConsoStock enregistrer(Long reservationId, Long chambreId, Long produitId, Integer quantite) {
        String nom = null;
        BigDecimal prix = null;
        try {
            StockClient.ProduitDTO produit = stockClient.getProduitById(produitId);
            nom = produit.getNom();
            prix = produit.getPrixUnitaire();
        } catch (Exception e) {
            log.warn("Could not fetch produit {} for conso: {}", produitId, e.getMessage());
        }
        ConsoStock conso = ConsoStock.builder()
                .reservationId(reservationId)
                .chambreId(chambreId)
                .produitId(produitId)
                .produitNom(nom)
                .quantite(quantite)
                .prixUnitaire(prix)
                .build();
        return consoStockRepository.save(conso);
    }

    /** Records default consumption (1 unit each) for all products assigned to the room. */
    public void enregistrerConsoParDefaut(Long reservationId, Long chambreId) {
        try {
            ChambreClient.ChambreDTO chambre = chambreClient.getChambreById(chambreId);
            if (chambre.getProduitIds() == null || chambre.getProduitIds().isEmpty()) return;
            chambre.getProduitIds().forEach(produitId ->
                    enregistrer(reservationId, chambreId, produitId, 1));
            log.info("Recorded default stock consumption for reservation {} (room {})", reservationId, chambreId);
        } catch (Exception e) {
            log.warn("Could not record default conso for reservation {}: {}", reservationId, e.getMessage());
        }
    }
}
