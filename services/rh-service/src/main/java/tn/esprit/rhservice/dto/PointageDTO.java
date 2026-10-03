package tn.esprit.rhservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import tn.esprit.rhservice.enums.StatutPointage;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointageDTO {
    private Long id;

    @NotNull(message = "L'ID de l'employé est obligatoire")
    private Long employeId;

    private String employeNom;
    private String employePrenom;

    @NotNull(message = "La date est obligatoire")
    private LocalDate date;

    private LocalTime heureEntree;
    private LocalTime heureSortie;
    private StatutPointage statut;
    private Integer retardMinutes;
    private String note;
}
