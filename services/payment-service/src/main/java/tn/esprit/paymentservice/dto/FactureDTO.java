package tn.esprit.paymentservice.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.paymentservice.enums.StatutFacture;
import tn.esprit.paymentservice.enums.TypeFacture;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureDTO {
    private Long id;
    private String numero;
    private Long reservationId;
    private Long clientId;

    @NotBlank(message = "Le nom du client est obligatoire")
    private String clientNom;

    private String clientEmail;
    private String clientTelephone;
    private String clientAdresse;
    private TypeFacture typeFacture;

    @NotNull(message = "La date d'émission est obligatoire")
    private LocalDate dateEmission;

    private LocalDate dateEcheance;

    @NotEmpty(message = "La facture doit contenir au moins une ligne")
    private List<LigneFactureDTO> lignes;

    private List<PaiementDTO> paiements;
    private StatutFacture statut;
    private String notes;

    private BigDecimal sousTotal;
    private BigDecimal totalTva;
    private BigDecimal totalTTC;
    private BigDecimal montantPaye;
    private BigDecimal montantRestant;
    private LocalDateTime dateCreation;
}
