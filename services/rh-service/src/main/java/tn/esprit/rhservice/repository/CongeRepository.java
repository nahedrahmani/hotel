package tn.esprit.rhservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.rhservice.entity.Conge;
import tn.esprit.rhservice.enums.StatutConge;

import java.util.List;

@Repository
public interface CongeRepository extends JpaRepository<Conge, Long> {
    List<Conge> findByEmployeId(Long employeId);
    List<Conge> findByStatut(StatutConge statut);
    List<Conge> findByEmployeIdAndStatut(Long employeId, StatutConge statut);
}
