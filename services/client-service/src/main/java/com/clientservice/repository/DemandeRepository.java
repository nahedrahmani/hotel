package com.clientservice.repository;

import com.clientservice.entity.Demande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DemandeRepository extends JpaRepository<Demande, Long> {
    List<Demande> findByKeycloakIdOrderByDateCreationDesc(String keycloakId);
    List<Demande> findByChambreIdOrderByDateCreationDesc(Long chambreId);
    List<Demande> findByStatutOrderByPriorityDescDateCreationDesc(Demande.DemandeStatut statut);
    List<Demande> findAllByOrderByPriorityDescDateCreationDesc();
}
