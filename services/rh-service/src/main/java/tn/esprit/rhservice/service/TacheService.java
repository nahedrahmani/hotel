package tn.esprit.rhservice.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.rhservice.dto.TacheDTO;
import tn.esprit.rhservice.entity.Employe;
import tn.esprit.rhservice.entity.Tache;
import tn.esprit.rhservice.enums.StatutTache;
import tn.esprit.rhservice.repository.EmployeRepository;
import tn.esprit.rhservice.repository.TacheRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TacheService {

    private final TacheRepository tacheRepository;
    private final EmployeRepository employeRepository;

    public List<TacheDTO> getAll() {
        return tacheRepository.findAll().stream().map(this::toDTO).toList();
    }

    public List<TacheDTO> getByEmploye(Long employeId) {
        return tacheRepository.findByAssigneAId(employeId).stream().map(this::toDTO).toList();
    }

    public List<TacheDTO> getByStatut(StatutTache statut) {
        return tacheRepository.findByStatut(statut).stream().map(this::toDTO).toList();
    }

    public TacheDTO getById(Long id) {
        return toDTO(findOrThrow(id));
    }

    public TacheDTO create(TacheDTO dto) {
        Tache tache = Tache.builder()
                .titre(dto.getTitre()).description(dto.getDescription())
                .assignePar(dto.getAssignePar())
                .priorite(dto.getPriorite()).statut(StatutTache.A_FAIRE)
                .dateEcheance(dto.getDateEcheance()).chambreId(dto.getChambreId()).build();

        if (dto.getAssigneAId() != null) {
            Employe employe = employeRepository.findById(dto.getAssigneAId())
                    .orElseThrow(() -> new EntityNotFoundException("Employé introuvable: " + dto.getAssigneAId()));
            tache.setAssigneA(employe);
        }
        return toDTO(tacheRepository.save(tache));
    }

    public TacheDTO update(Long id, TacheDTO dto) {
        Tache tache = findOrThrow(id);
        tache.setTitre(dto.getTitre());
        tache.setDescription(dto.getDescription());
        tache.setPriorite(dto.getPriorite());
        tache.setDateEcheance(dto.getDateEcheance());
        tache.setChambreId(dto.getChambreId());

        if (dto.getAssigneAId() != null) {
            Employe employe = employeRepository.findById(dto.getAssigneAId())
                    .orElseThrow(() -> new EntityNotFoundException("Employé introuvable: " + dto.getAssigneAId()));
            tache.setAssigneA(employe);
        }
        return toDTO(tacheRepository.save(tache));
    }

    public TacheDTO changerStatut(Long id, StatutTache statut) {
        Tache tache = findOrThrow(id);
        tache.setStatut(statut);
        if (statut == StatutTache.TERMINE) {
            tache.setDateCompletion(LocalDateTime.now());
        }
        return toDTO(tacheRepository.save(tache));
    }

    public void delete(Long id) {
        if (!tacheRepository.existsById(id)) {
            throw new EntityNotFoundException("Tâche introuvable: " + id);
        }
        tacheRepository.deleteById(id);
    }

    private Tache findOrThrow(Long id) {
        return tacheRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tâche introuvable: " + id));
    }

    private TacheDTO toDTO(Tache t) {
        String assigneANom = t.getAssigneA() != null
                ? t.getAssigneA().getPrenom() + " " + t.getAssigneA().getNom()
                : null;
        return TacheDTO.builder()
                .id(t.getId()).titre(t.getTitre()).description(t.getDescription())
                .assigneAId(t.getAssigneA() != null ? t.getAssigneA().getId() : null)
                .assigneANom(assigneANom).assignePar(t.getAssignePar())
                .priorite(t.getPriorite()).statut(t.getStatut())
                .dateEcheance(t.getDateEcheance()).dateCompletion(t.getDateCompletion())
                .chambreId(t.getChambreId()).dateCreation(t.getDateCreation()).build();
    }
}
