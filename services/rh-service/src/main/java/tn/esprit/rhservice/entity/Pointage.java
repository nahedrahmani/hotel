package tn.esprit.rhservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import tn.esprit.rhservice.enums.StatutPointage;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "pointages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pointage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    @NotNull(message = "L'employé est obligatoire")
    private Employe employe;

    @NotNull(message = "La date est obligatoire")
    private LocalDate date;

    private LocalTime heureEntree;
    private LocalTime heureSortie;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutPointage statut = StatutPointage.PRESENT;

    private Integer retardMinutes;
    private String note;
}
