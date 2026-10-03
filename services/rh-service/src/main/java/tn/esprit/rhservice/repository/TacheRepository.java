package tn.esprit.rhservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.rhservice.entity.Tache;
import tn.esprit.rhservice.enums.PrioriteTache;
import tn.esprit.rhservice.enums.StatutTache;

import java.util.List;

@Repository
public interface TacheRepository extends JpaRepository<Tache, Long> {
    List<Tache> findByAssigneAId(Long employeId);
    List<Tache> findByStatut(StatutTache statut);
    List<Tache> findByPriorite(PrioriteTache priorite);
    List<Tache> findByChambreId(Long chambreId);
    List<Tache> findByAssigneAIdAndStatut(Long employeId, StatutTache statut);
}
