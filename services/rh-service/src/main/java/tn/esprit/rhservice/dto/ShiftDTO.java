package tn.esprit.rhservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import tn.esprit.rhservice.enums.TypeShift;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftDTO {
    private Long id;

    @NotNull(message = "L'ID de l'employé est obligatoire")
    private Long employeId;

    private String employeNom;
    private String employePrenom;

    @NotNull(message = "La date est obligatoire")
    private LocalDate date;

    @NotNull(message = "L'heure de début est obligatoire")
    private LocalTime heureDebut;

    @NotNull(message = "L'heure de fin est obligatoire")
    private LocalTime heureFin;

    private TypeShift typeShift;
    private String note;
}
