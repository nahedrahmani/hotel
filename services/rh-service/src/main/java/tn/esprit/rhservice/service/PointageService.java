package tn.esprit.rhservice.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.rhservice.dto.PointageDTO;
import tn.esprit.rhservice.entity.Employe;
import tn.esprit.rhservice.entity.Pointage;
import tn.esprit.rhservice.enums.StatutPointage;
import tn.esprit.rhservice.repository.EmployeRepository;
import tn.esprit.rhservice.repository.PointageRepository;
import tn.esprit.rhservice.repository.ShiftRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class PointageService {

    private final PointageRepository pointageRepository;
    private final EmployeRepository employeRepository;
    private final ShiftRepository shiftRepository;

    /** Minutes of tolerance before an arrival counts as late. */
    private static final int TOLERANCE_MINUTES = 5;

    public List<PointageDTO> getByDate(LocalDate date) {
        return pointageRepository.findByDate(date).stream().map(this::toDTO).toList();
    }

    public List<PointageDTO> getByEmploye(Long employeId, LocalDate debut, LocalDate fin) {
        return pointageRepository.findByEmployeIdAndDateBetween(employeId, debut, fin)
                .stream().map(this::toDTO).toList();
    }

    public PointageDTO pointageEntree(Long employeId) {
        LocalDate today = LocalDate.now();
        if (pointageRepository.findByEmployeIdAndDate(employeId, today).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Pointage d'entrée déjà enregistré pour aujourd'hui");
        }
        Employe employe = employeRepository.findById(employeId)
                .orElseThrow(() -> new EntityNotFoundException("Employé introuvable: " + employeId));

        LocalTime now = LocalTime.now();
        // Late compared with the start of the employee's own shift today; no shift, no lateness
        int retard = shiftRepository.findByEmployeIdAndDateBetween(employeId, today, today).stream()
                .map(s -> s.getHeureDebut())
                .min(LocalTime::compareTo)
                .filter(debut -> now.isAfter(debut.plusMinutes(TOLERANCE_MINUTES)))
                .map(debut -> (int) java.time.Duration.between(debut, now).toMinutes())
                .orElse(0);

        Pointage pointage = Pointage.builder()
                .employe(employe).date(today).heureEntree(now)
                .statut(retard > 0 ? StatutPointage.RETARD : StatutPointage.PRESENT)
                .retardMinutes(retard).build();
        return toDTO(pointageRepository.save(pointage));
    }

    public PointageDTO pointageSortie(Long employeId) {
        LocalDate today = LocalDate.now();
        Pointage pointage = pointageRepository.findByEmployeIdAndDate(employeId, today)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Aucun pointage d'entrée trouvé pour aujourd'hui"));
        if (pointage.getHeureSortie() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Pointage de sortie déjà enregistré pour aujourd'hui");
        }
        pointage.setHeureSortie(LocalTime.now());
        return toDTO(pointageRepository.save(pointage));
    }

    public PointageDTO create(PointageDTO dto) {
        Employe employe = employeRepository.findById(dto.getEmployeId())
                .orElseThrow(() -> new EntityNotFoundException("Employé introuvable: " + dto.getEmployeId()));
        Pointage pointage = Pointage.builder()
                .employe(employe).date(dto.getDate()).heureEntree(dto.getHeureEntree())
                .heureSortie(dto.getHeureSortie()).statut(dto.getStatut() != null ? dto.getStatut() : StatutPointage.PRESENT)
                .retardMinutes(dto.getRetardMinutes()).note(dto.getNote()).build();
        return toDTO(pointageRepository.save(pointage));
    }

    public PointageDTO update(Long id, PointageDTO dto) {
        Pointage pointage = pointageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pointage introuvable: " + id));
        pointage.setHeureEntree(dto.getHeureEntree());
        pointage.setHeureSortie(dto.getHeureSortie());
        pointage.setStatut(dto.getStatut());
        pointage.setRetardMinutes(dto.getRetardMinutes());
        pointage.setNote(dto.getNote());
        return toDTO(pointageRepository.save(pointage));
    }

    public Map<String, Long> getStatsJour(LocalDate date) {
        long presents = pointageRepository.countByDateAndStatut(date, StatutPointage.PRESENT);
        long retards = pointageRepository.countByDateAndStatut(date, StatutPointage.RETARD);
        long absents = pointageRepository.countByDateAndStatut(date, StatutPointage.ABSENT);
        long conges = pointageRepository.countByDateAndStatut(date, StatutPointage.EN_CONGE);
        return Map.of("presents", presents, "retards", retards, "absents", absents, "conges", conges);
    }

    private PointageDTO toDTO(Pointage p) {
        return PointageDTO.builder()
                .id(p.getId()).employeId(p.getEmploye().getId())
                .employeNom(p.getEmploye().getNom()).employePrenom(p.getEmploye().getPrenom())
                .date(p.getDate()).heureEntree(p.getHeureEntree()).heureSortie(p.getHeureSortie())
                .statut(p.getStatut()).retardMinutes(p.getRetardMinutes()).note(p.getNote()).build();
    }
}
