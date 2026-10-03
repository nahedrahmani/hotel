package tn.esprit.rhservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import tn.esprit.rhservice.enums.TypeShift;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "shifts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employe_id", nullable = false)
    @NotNull(message = "L'employé est obligatoire")
    private Employe employe;

    @NotNull(message = "La date est obligatoire")
    private LocalDate date;

    @NotNull(message = "L'heure de début est obligatoire")
    private LocalTime heureDebut;

    @NotNull(message = "L'heure de fin est obligatoire")
    private LocalTime heureFin;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TypeShift typeShift = TypeShift.MATIN;

    private String note;
}
