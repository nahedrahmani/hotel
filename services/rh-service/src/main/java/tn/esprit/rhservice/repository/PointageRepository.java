package tn.esprit.rhservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.esprit.rhservice.entity.Pointage;
import tn.esprit.rhservice.enums.StatutPointage;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PointageRepository extends JpaRepository<Pointage, Long> {
    List<Pointage> findByEmployeId(Long employeId);
    List<Pointage> findByDate(LocalDate date);
    Optional<Pointage> findByEmployeIdAndDate(Long employeId, LocalDate date);
    List<Pointage> findByEmployeIdAndDateBetween(Long employeId, LocalDate debut, LocalDate fin);
    List<Pointage> findByDateBetween(LocalDate debut, LocalDate fin);
    long countByDateAndStatut(LocalDate date, StatutPointage statut);

    @Query("SELECT COUNT(p) FROM Pointage p WHERE p.date = :date AND p.statut = 'PRESENT'")
    long countPresentsAujourdhui(LocalDate date);
}
