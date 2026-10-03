package tn.esprit.paymentservice.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneFactureDTO {
    private Long id;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    @Positive(message = "La quantité doit être positive")
    @NotNull
    private Integer quantite;

    @Positive(message = "Le prix unitaire doit être positif")
    @NotNull
    private BigDecimal prixUnitaire;

    @Builder.Default
    private BigDecimal tauxTva = BigDecimal.valueOf(19);

    private BigDecimal montantHT;
    private BigDecimal montantTva;
    private BigDecimal montantTTC;
}
