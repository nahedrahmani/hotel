package tn.esprit.rhservice.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.rhservice.dto.CongeDTO;
import tn.esprit.rhservice.entity.Conge;
import tn.esprit.rhservice.entity.Employe;
import tn.esprit.rhservice.enums.StatutConge;
import tn.esprit.rhservice.enums.StatutEmploye;
import tn.esprit.rhservice.repository.CongeRepository;
import tn.esprit.rhservice.repository.EmployeRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CongeService {

    private final CongeRepository congeRepository;
    private final EmployeRepository employeRepository;

    public List<CongeDTO> getAll() {
        return congeRepository.findAll().stream().map(this::toDTO).toList();
    }

    public List<CongeDTO> getByEmploye(Long employeId) {
        return congeRepository.findByEmployeId(employeId).stream().map(this::toDTO).toList();
    }

    public List<CongeDTO> getByStatut(StatutConge statut) {
        return congeRepository.findByStatut(statut).stream().map(this::toDTO).toList();
    }

    public CongeDTO getById(Long id) {
        return toDTO(findOrThrow(id));
    }

    public CongeDTO create(CongeDTO dto) {
        if (dto.getDateFin().isBefore(dto.getDateDebut())) {
            throw new IllegalArgumentException("La date de fin doit être après la date de début");
        }
        Employe employe = employeRepository.findById(dto.getEmployeId())
                .orElseThrow(() -> new EntityNotFoundException("Employé introuvable: " + dto.getEmployeId()));

        Conge conge = Conge.builder()
                .employe(employe).typeConge(dto.getTypeConge())
                .dateDebut(dto.getDateDebut()).dateFin(dto.getDateFin())
                .motif(dto.getMotif()).statut(StatutConge.EN_ATTENTE).build();
        return toDTO(congeRepository.save(conge));
    }

    public CongeDTO approuver(Long id, String approvePar) {
        Conge conge = findOrThrow(id);
        if (conge.getStatut() != StatutConge.EN_ATTENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce congé n'est plus en attente");
        }
        conge.setStatut(StatutConge.APPROUVE);
        conge.setApprovePar(approvePar);
        conge.setDateDecision(LocalDateTime.now());

        // Only mark the employee as on leave if the leave has already started
        if (!LocalDate.now().isBefore(conge.getDateDebut())) {
            conge.getEmploye().setStatut(StatutEmploye.EN_CONGE);
            employeRepository.save(conge.getEmploye());
        }

        return toDTO(congeRepository.save(conge));
    }

    public CongeDTO refuser(Long id, String approvePar) {
        Conge conge = findOrThrow(id);
        if (conge.getStatut() != StatutConge.EN_ATTENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce congé n'est plus en attente");
        }
        conge.setStatut(StatutConge.REFUSE);
        conge.setApprovePar(approvePar);
        conge.setDateDecision(LocalDateTime.now());
        return toDTO(congeRepository.save(conge));
    }

    public void delete(Long id) {
        Conge conge = findOrThrow(id);
        if (conge.getStatut() == StatutConge.APPROUVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Impossible de supprimer un congé approuvé");
        }
        congeRepository.deleteById(id);
    }

    private Conge findOrThrow(Long id) {
        return congeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Congé introuvable: " + id));
    }

    private CongeDTO toDTO(Conge c) {
        int jours = (int) ChronoUnit.DAYS.between(c.getDateDebut(), c.getDateFin()) + 1;
        return CongeDTO.builder()
                .id(c.getId()).employeId(c.getEmploye().getId())
                .employeNom(c.getEmploye().getNom()).employePrenom(c.getEmploye().getPrenom())
                .typeConge(c.getTypeConge()).dateDebut(c.getDateDebut()).dateFin(c.getDateFin())
                .motif(c.getMotif()).statut(c.getStatut()).approvePar(c.getApprovePar())
                .dateDecision(c.getDateDecision()).dateDemande(c.getDateDemande())
                .nombreJours(jours).build();
    }
}
