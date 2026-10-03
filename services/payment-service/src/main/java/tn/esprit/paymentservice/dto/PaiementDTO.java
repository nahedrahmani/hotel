package tn.esprit.paymentservice.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.paymentservice.enums.MethodePaiement;
import tn.esprit.paymentservice.enums.StatutPaiement;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaiementDTO {
    private Long id;

    @NotNull(message = "L'ID de la facture est obligatoire")
    private Long factureId;

    private String factureNumero;

    @Positive(message = "Le montant doit être positif")
    @NotNull(message = "Le montant est obligatoire")
    private BigDecimal montant;

    @NotNull(message = "La méthode de paiement est obligatoire")
    private MethodePaiement methodePaiement;

    private StatutPaiement statut;
    private String reference;
    private LocalDateTime datePaiement;
    private String note;
}
