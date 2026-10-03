package tn.esprit.stockservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.stockservice.entity.MouvementStock;
import tn.esprit.stockservice.enums.TypeMouvement;
import tn.esprit.stockservice.repository.MouvementStockRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MouvementStockService {

    private final MouvementStockRepository mouvementRepository;

    public List<MouvementStock> getAll() {
        return mouvementRepository.findAll();
    }

    public List<MouvementStock> getByProduitId(Long produitId) {
        return mouvementRepository.findByProduitId(produitId);
    }

    public List<MouvementStock> getByType(TypeMouvement type) {
        return mouvementRepository.findByTypeMouvement(type);
    }

    public List<MouvementStock> getByPeriode(LocalDateTime debut, LocalDateTime fin) {
        return mouvementRepository.findByDateCreationBetween(debut, fin);
    }
}
