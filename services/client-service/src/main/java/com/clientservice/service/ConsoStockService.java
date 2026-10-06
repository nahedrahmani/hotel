package com.clientservice.service;

import com.clientservice.client.PaymentClient;
import com.clientservice.client.StockClient;
import com.clientservice.entity.ConsoStock;
import com.clientservice.repository.ConsoStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsoStockService {

    private final ConsoStockRepository consoStockRepository;
    private final StockClient stockClient;
    private final PaymentClient paymentClient;

    public List<ConsoStock> getByReservation(Long reservationId) {
        return consoStockRepository.findByReservationId(reservationId);
    }

    /**
     * Records what a guest took from the room (minibar): it is billed on the stay invoice and
     * leaves the stock. Done by reception before the check-out issues the invoice.
     */
    public ConsoStock enregistrer(Long reservationId, Long chambreId, Long produitId, Integer quantite) {
        if (quantite == null || quantite <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La quantité doit être positive");
        }
        StockClient.ProduitDTO produit;
        try {
            produit = stockClient.getProduitById(produitId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Produit introuvable dans le stock : " + produitId);
        }
        String nom = produit.getNom();
        BigDecimal prix = produit.getPrixUnitaire();

        // Billing first: an extra that cannot be billed must not be recorded as consumed
        PaymentClient.LigneDTO ligne = new PaymentClient.LigneDTO();
        ligne.setDescription("Minibar — " + nom);
        ligne.setQuantite(quantite);
        ligne.setPrixUnitaire(prix);
        ligne.setTauxTva(BigDecimal.valueOf(19));
        ligne.setPrixTtc(true);   // minibar prices are shown to guests VAT included
        try {
            paymentClient.ajouterLigneSejour(reservationId, ligne);
        } catch (Exception e) {
            log.warn("Could not bill conso of reservation {}: {}", reservationId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La consommation n'a pas pu être ajoutée à la facture du séjour");
        }
        try {
            stockClient.sortie(new StockClient.MouvementDTO(produitId, "SORTIE", quantite,
                    "Minibar chambre — réservation n° " + reservationId));
        } catch (Exception e) {
            // Billed already; the stock can be corrected by an adjustment
            log.warn("Stock not decremented for conso of reservation {}: {}", reservationId, e.getMessage());
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
}
