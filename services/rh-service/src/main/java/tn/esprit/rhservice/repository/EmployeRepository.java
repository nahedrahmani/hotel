package tn.esprit.rhservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.rhservice.entity.Employe;
import tn.esprit.rhservice.enums.Departement;
import tn.esprit.rhservice.enums.Poste;
import tn.esprit.rhservice.enums.StatutEmploye;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeRepository extends JpaRepository<Employe, Long> {
    Optional<Employe> findByMatricule(String matricule);
    Optional<Employe> findByEmail(String email);
    List<Employe> findByDepartement(Departement departement);
    List<Employe> findByPoste(Poste poste);
    List<Employe> findByStatut(StatutEmploye statut);
    List<Employe> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(String nom, String prenom);
}
