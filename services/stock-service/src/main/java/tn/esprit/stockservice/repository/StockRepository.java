package tn.esprit.stockservice.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.esprit.stockservice.entity.Stock;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByProduitId(Long produitId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Stock s WHERE s.produitId = :produitId")
    Optional<Stock> findByProduitIdForUpdate(Long produitId);
    
    @Query("SELECT s FROM Stock s WHERE s.quantiteDisponible <= (SELECT p.seuilMinimum FROM Produit p WHERE p.id = s.produitId)")
    List<Stock> findProduitsEnRupture();

    void deleteByProduitId(Long produitId);
}
