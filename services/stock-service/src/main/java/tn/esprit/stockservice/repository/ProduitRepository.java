package tn.esprit.stockservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.stockservice.entity.Produit;
import tn.esprit.stockservice.enums.CategorieStock;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Long> {
    Optional<Produit> findByCode(String code);
    List<Produit> findByCategorie(CategorieStock categorie);
    List<Produit> findByNomContainingIgnoreCase(String nom);
}
