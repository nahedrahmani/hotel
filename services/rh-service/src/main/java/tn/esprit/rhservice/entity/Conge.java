package tn.esprit.rhservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import tn.esprit.rhservice.enums.StatutConge;
import tn.esprit.rhservice.enums.TypeConge;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "conges")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    @NotNull(message = "L'employé est obligatoire")
    private Employe employe;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Le type de congé est obligatoire")
    private TypeConge typeConge;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate dateFin;

    @Column(length = 500)
    private String motif;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutConge statut = StatutConge.EN_ATTENTE;

    private String approvePar;
    private LocalDateTime dateDecision;
    private LocalDateTime dateDemande;

    @PrePersist
    protected void onCreate() {
        dateDemande = LocalDateTime.now();
    }
}
