package tn.esprit.paymentservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.esprit.paymentservice.entity.Facture;
import tn.esprit.paymentservice.enums.StatutFacture;
import tn.esprit.paymentservice.enums.TypeFacture;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {
    Optional<Facture> findByNumero(String numero);
    List<Facture> findByStatut(StatutFacture statut);
    List<Facture> findByTypeFacture(TypeFacture type);
    List<Facture> findByClientId(Long clientId);
    List<Facture> findByReservationId(Long reservationId);
    List<Facture> findByDateEmissionBetween(LocalDate debut, LocalDate fin);
    List<Facture> findByStatutAndDateEcheanceBefore(StatutFacture statut, LocalDate date);

    @Query("SELECT COUNT(f) FROM Facture f WHERE f.statut = 'EMISE' OR f.statut = 'PARTIELLEMENT_PAYEE' OR f.statut = 'EN_RETARD'")
    long countImpayees();

    @Query("SELECT f FROM Facture f WHERE f.clientNom LIKE %:query% OR f.numero LIKE %:query%")
    List<Facture> search(String query);
}
