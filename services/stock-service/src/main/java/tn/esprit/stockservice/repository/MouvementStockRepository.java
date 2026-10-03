package tn.esprit.stockservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.stockservice.entity.MouvementStock;
import tn.esprit.stockservice.enums.TypeMouvement;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {
    List<MouvementStock> findByProduitId(Long produitId);
    List<MouvementStock> findByTypeMouvement(TypeMouvement typeMouvement);
    List<MouvementStock> findByDateCreationBetween(LocalDateTime debut, LocalDateTime fin);
}
