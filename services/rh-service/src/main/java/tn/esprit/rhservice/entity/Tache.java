package tn.esprit.rhservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import tn.esprit.rhservice.enums.PrioriteTache;
import tn.esprit.rhservice.enums.StatutTache;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "taches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigne_a_id")
    private Employe assigneA;

    private String assignePar;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PrioriteTache priorite = PrioriteTache.NORMALE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutTache statut = StatutTache.A_FAIRE;

    private LocalDate dateEcheance;
    private LocalDateTime dateCompletion;

    private Long chambreId;

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
