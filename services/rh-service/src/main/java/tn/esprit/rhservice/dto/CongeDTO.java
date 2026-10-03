package tn.esprit.rhservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import tn.esprit.rhservice.enums.StatutConge;
import tn.esprit.rhservice.enums.TypeConge;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CongeDTO {
    private Long id;

    @NotNull(message = "L'ID de l'employé est obligatoire")
    private Long employeId;

    private String employeNom;
    private String employePrenom;

    @NotNull(message = "Le type de congé est obligatoire")
    private TypeConge typeConge;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate dateFin;

    private String motif;
    private StatutConge statut;
    private String approvePar;
    private LocalDateTime dateDecision;
    private LocalDateTime dateDemande;
    private Integer nombreJours;
}
