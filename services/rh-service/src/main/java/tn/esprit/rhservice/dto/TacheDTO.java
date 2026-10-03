package tn.esprit.rhservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import tn.esprit.rhservice.enums.PrioriteTache;
import tn.esprit.rhservice.enums.StatutTache;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TacheDTO {
    private Long id;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;
    private Long assigneAId;
    private String assigneANom;
    private String assignePar;
    private PrioriteTache priorite;
    private StatutTache statut;
    private LocalDate dateEcheance;
    private LocalDateTime dateCompletion;
    private Long chambreId;
    private LocalDateTime dateCreation;
}
