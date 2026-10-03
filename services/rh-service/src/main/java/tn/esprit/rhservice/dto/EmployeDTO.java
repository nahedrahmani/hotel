package tn.esprit.rhservice.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.rhservice.enums.Departement;
import tn.esprit.rhservice.enums.Poste;
import tn.esprit.rhservice.enums.StatutEmploye;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeDTO {
    private Long id;

    @NotBlank(message = "Le matricule est obligatoire")
    private String matricule;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @Email(message = "Email invalide")
    @NotBlank(message = "L'email est obligatoire")
    private String email;

    private String telephone;

    @NotNull(message = "Le poste est obligatoire")
    private Poste poste;

    @NotNull(message = "Le département est obligatoire")
    private Departement departement;

    @NotNull(message = "La date d'embauche est obligatoire")
    private LocalDate dateEmbauche;

    private LocalDate dateNaissance;

    @Positive(message = "Le salaire doit être positif")
    private Double salaire;

    private StatutEmploye statut;
    private String keycloakId;
}
