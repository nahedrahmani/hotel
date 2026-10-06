package tn.esprit.rhservice.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.rhservice.dto.ShiftDTO;
import tn.esprit.rhservice.entity.Employe;
import tn.esprit.rhservice.entity.Shift;
import tn.esprit.rhservice.enums.TypeShift;
import tn.esprit.rhservice.repository.EmployeRepository;
import tn.esprit.rhservice.repository.ShiftRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanningService {

    private final ShiftRepository shiftRepository;
    private final EmployeRepository employeRepository;

    public List<ShiftDTO> getPlanningByPeriode(LocalDate debut, LocalDate fin) {
        return shiftRepository.findPlanningByPeriode(debut, fin).stream().map(this::toDTO).toList();
    }

    public List<ShiftDTO> getPlanningByEmploye(Long employeId, LocalDate debut, LocalDate fin) {
        return shiftRepository.findByEmployeIdAndDateBetween(employeId, debut, fin)
                .stream().map(this::toDTO).toList();
    }

    public List<ShiftDTO> getShiftsByDate(LocalDate date) {
        return shiftRepository.findByDate(date).stream().map(this::toDTO).toList();
    }

    /** A night shift ends the next morning; any other shift ends the same day, after it starts. */
    private static void checkHours(ShiftDTO dto) {
        if (dto.getHeureDebut() == null || dto.getHeureFin() == null || dto.getHeureFin().equals(dto.getHeureDebut())) {
            throw new IllegalArgumentException("Indiquez une heure de début et une heure de fin différentes");
        }
        if (dto.getTypeShift() != TypeShift.NUIT && dto.getHeureFin().isBefore(dto.getHeureDebut())) {
            throw new IllegalArgumentException("L'heure de fin doit être après l'heure de début (sauf pour un shift de nuit)");
        }
    }

    public ShiftDTO createShift(ShiftDTO dto) {
        checkHours(dto);
        Employe employe = employeRepository.findById(dto.getEmployeId())
                .orElseThrow(() -> new EntityNotFoundException("Employé introuvable: " + dto.getEmployeId()));
        Shift shift = Shift.builder()
                .employe(employe).date(dto.getDate())
                .heureDebut(dto.getHeureDebut()).heureFin(dto.getHeureFin())
                .typeShift(dto.getTypeShift()).note(dto.getNote()).build();
        return toDTO(shiftRepository.save(shift));
    }

    public ShiftDTO updateShift(Long id, ShiftDTO dto) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Shift introuvable: " + id));
        if (dto.getEmployeId() != null && !dto.getEmployeId().equals(shift.getEmploye().getId())) {
            Employe employe = employeRepository.findById(dto.getEmployeId())
                    .orElseThrow(() -> new EntityNotFoundException("Employé introuvable: " + dto.getEmployeId()));
            shift.setEmploye(employe);
        }
        checkHours(dto);
        shift.setDate(dto.getDate());
        shift.setHeureDebut(dto.getHeureDebut());
        shift.setHeureFin(dto.getHeureFin());
        shift.setTypeShift(dto.getTypeShift());
        shift.setNote(dto.getNote());
        return toDTO(shiftRepository.save(shift));
    }

    public void deleteShift(Long id) {
        if (!shiftRepository.existsById(id)) {
            throw new EntityNotFoundException("Shift introuvable: " + id);
        }
        shiftRepository.deleteById(id);
    }

    private ShiftDTO toDTO(Shift s) {
        return ShiftDTO.builder()
                .id(s.getId()).employeId(s.getEmploye().getId())
                .employeNom(s.getEmploye().getNom()).employePrenom(s.getEmploye().getPrenom())
                .date(s.getDate()).heureDebut(s.getHeureDebut()).heureFin(s.getHeureFin())
                .typeShift(s.getTypeShift()).note(s.getNote()).build();
    }
}
