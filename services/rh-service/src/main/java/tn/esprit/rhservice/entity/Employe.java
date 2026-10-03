package tn.esprit.rhservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.rhservice.enums.Departement;
import tn.esprit.rhservice.enums.Poste;
import tn.esprit.rhservice.enums.StatutEmploye;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    @NotBlank(message = "Le matricule est obligatoire")
    private String matricule;

    @NotBlank(message = "Le prénom est obligatoire")
    private String prenom;

    @NotBlank(message = "Le nom est obligatoire")
    private String nom;

    @Email(message = "Email invalide")
    @NotBlank(message = "L'email est obligatoire")
    @Column(unique = true, nullable = false)
    private String email;

    private String telephone;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le poste est obligatoire")
    private Poste poste;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le département est obligatoire")
    private Departement departement;

    @NotNull(message = "La date d'embauche est obligatoire")
    private LocalDate dateEmbauche;

    private LocalDate dateNaissance;

    @Positive(message = "Le salaire doit être positif")
    private Double salaire;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutEmploye statut = StatutEmploye.ACTIF;

    private String keycloakId;

    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        dateModification = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }
}
