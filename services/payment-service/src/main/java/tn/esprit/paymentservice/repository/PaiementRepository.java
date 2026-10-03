package tn.esprit.paymentservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.esprit.paymentservice.entity.Paiement;
import tn.esprit.paymentservice.enums.MethodePaiement;
import tn.esprit.paymentservice.enums.StatutPaiement;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {
    Optional<Paiement> findByReference(String reference);
    List<Paiement> findByFactureId(Long factureId);
    List<Paiement> findByStatut(StatutPaiement statut);
    List<Paiement> findByMethodePaiement(MethodePaiement methode);
    List<Paiement> findByDatePaiementBetween(LocalDateTime debut, LocalDateTime fin);

    @Query("SELECT COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.statut = 'CONFIRME' AND p.datePaiement BETWEEN :debut AND :fin")
    BigDecimal sumRevenuePeriode(LocalDateTime debut, LocalDateTime fin);

    @Query("SELECT p.methodePaiement, COALESCE(SUM(p.montant), 0) FROM Paiement p WHERE p.statut = 'CONFIRME' AND p.datePaiement BETWEEN :debut AND :fin GROUP BY p.methodePaiement")
    List<Object[]> revenueParMethode(LocalDateTime debut, LocalDateTime fin);
}
