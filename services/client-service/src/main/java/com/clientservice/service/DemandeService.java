package com.clientservice.service;

import com.clientservice.entity.Demande;
import com.clientservice.repository.DemandeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DemandeService {

    private final DemandeRepository demandeRepository;

    public List<Demande> getAll() {
        return demandeRepository.findAllByOrderByPriorityDescDateCreationDesc();
    }

    public Demande getById(Long id) {
        return demandeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Demande not found: " + id));
    }

    public List<Demande> getByClient(String keycloakId) {
        return demandeRepository.findByKeycloakIdOrderByDateCreationDesc(keycloakId);
    }

    public List<Demande> getByChambre(Long chambreId) {
        return demandeRepository.findByChambreIdOrderByDateCreationDesc(chambreId);
    }

    public List<Demande> getByStatut(Demande.DemandeStatut statut) {
        return demandeRepository.findByStatutOrderByPriorityDescDateCreationDesc(statut);
    }

    public Demande create(Demande demande) {
        demande.setStatut(Demande.DemandeStatut.OUVERTE);
        demande.setDateCreation(null); // will be set by @CreationTimestamp
        return demandeRepository.save(demande);
    }

    public Demande updateStatut(Long id, Demande.DemandeStatut newStatut) {
        Demande demande = getById(id);
        validateTransition(demande.getStatut(), newStatut);
        demande.setStatut(newStatut);
        if (newStatut == Demande.DemandeStatut.TRAITEE || newStatut == Demande.DemandeStatut.FERMEE) {
            demande.setDateTraitement(LocalDateTime.now());
        }
        return demandeRepository.save(demande);
    }

    public Demande assign(Long id, String assignedTo) {
        Demande demande = getById(id);
        demande.setAssignedTo(assignedTo);
        if (demande.getStatut() == Demande.DemandeStatut.OUVERTE) {
            demande.setStatut(Demande.DemandeStatut.EN_COURS);
        }
        return demandeRepository.save(demande);
    }

    public void delete(Long id) {
        Demande demande = getById(id);
        demandeRepository.delete(demande);
    }

    private void validateTransition(Demande.DemandeStatut current, Demande.DemandeStatut next) {
        boolean valid = switch (current) {
            case OUVERTE   -> next == Demande.DemandeStatut.EN_COURS  || next == Demande.DemandeStatut.FERMEE;
            case EN_COURS  -> next == Demande.DemandeStatut.TRAITEE   || next == Demande.DemandeStatut.FERMEE;
            case TRAITEE   -> next == Demande.DemandeStatut.FERMEE;
            case FERMEE    -> false;
        };
        if (!valid) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Transition invalide: " + current + " → " + next);
        }
    }
}
