package tn.esprit.rhservice.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.rhservice.dto.EmployeDTO;
import tn.esprit.rhservice.entity.Employe;
import tn.esprit.rhservice.enums.Departement;
import tn.esprit.rhservice.enums.Poste;
import tn.esprit.rhservice.enums.StatutEmploye;
import tn.esprit.rhservice.repository.EmployeRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployeService {

    private final EmployeRepository employeRepository;

    public List<EmployeDTO> getAll() {
        return employeRepository.findAll().stream().map(this::toDTO).toList();
    }

    public EmployeDTO getById(Long id) {
        return toDTO(findOrThrow(id));
    }

    public List<EmployeDTO> getByDepartement(Departement departement) {
        return employeRepository.findByDepartement(departement).stream().map(this::toDTO).toList();
    }

    public List<EmployeDTO> getByStatut(StatutEmploye statut) {
        return employeRepository.findByStatut(statut).stream().map(this::toDTO).toList();
    }

    public List<EmployeDTO> search(String query) {
        return employeRepository.findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(query, query)
                .stream().map(this::toDTO).toList();
    }

    public EmployeDTO create(EmployeDTO dto) {
        if (employeRepository.findByMatricule(dto.getMatricule()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Matricule déjà utilisé: " + dto.getMatricule());
        }
        if (employeRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email déjà utilisé: " + dto.getEmail());
        }
        Employe employe = toEntity(dto);
        employe.setStatut(StatutEmploye.ACTIF);
        return toDTO(employeRepository.save(employe));
    }

    public EmployeDTO update(Long id, EmployeDTO dto) {
        Employe employe = findOrThrow(id);
        employeRepository.findByEmail(dto.getEmail())
                .filter(e -> !e.getId().equals(id))
                .ifPresent(e -> { throw new ResponseStatusException(HttpStatus.CONFLICT, "Email déjà utilisé: " + dto.getEmail()); });
        employeRepository.findByMatricule(dto.getMatricule())
                .filter(e -> !e.getId().equals(id))
                .ifPresent(e -> { throw new ResponseStatusException(HttpStatus.CONFLICT, "Matricule déjà utilisé: " + dto.getMatricule()); });
        employe.setPrenom(dto.getPrenom());
        employe.setNom(dto.getNom());
        employe.setEmail(dto.getEmail());
        employe.setTelephone(dto.getTelephone());
        employe.setPoste(dto.getPoste());
        employe.setDepartement(dto.getDepartement());
        employe.setDateEmbauche(dto.getDateEmbauche());
        employe.setDateNaissance(dto.getDateNaissance());
        employe.setSalaire(dto.getSalaire());
        if (dto.getStatut() != null) employe.setStatut(dto.getStatut());
        return toDTO(employeRepository.save(employe));
    }

    public void delete(Long id) {
        if (!employeRepository.existsById(id)) {
            throw new EntityNotFoundException("Employé introuvable: " + id);
        }
        employeRepository.deleteById(id);
    }

    public EmployeDTO changerStatut(Long id, StatutEmploye statut) {
        Employe employe = findOrThrow(id);
        employe.setStatut(statut);
        return toDTO(employeRepository.save(employe));
    }

    private Employe findOrThrow(Long id) {
        return employeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employé introuvable: " + id));
    }

    private EmployeDTO toDTO(Employe e) {
        return EmployeDTO.builder()
                .id(e.getId()).matricule(e.getMatricule()).prenom(e.getPrenom()).nom(e.getNom())
                .email(e.getEmail()).telephone(e.getTelephone()).poste(e.getPoste())
                .departement(e.getDepartement()).dateEmbauche(e.getDateEmbauche())
                .dateNaissance(e.getDateNaissance()).salaire(e.getSalaire())
                .statut(e.getStatut()).keycloakId(e.getKeycloakId()).build();
    }

    private Employe toEntity(EmployeDTO dto) {
        return Employe.builder()
                .matricule(dto.getMatricule()).prenom(dto.getPrenom()).nom(dto.getNom())
                .email(dto.getEmail()).telephone(dto.getTelephone()).poste(dto.getPoste())
                .departement(dto.getDepartement()).dateEmbauche(dto.getDateEmbauche())
                .dateNaissance(dto.getDateNaissance()).salaire(dto.getSalaire())
                .keycloakId(dto.getKeycloakId()).build();
    }
}
