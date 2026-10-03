package tn.esprit.stockservice.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MouvementStockDTO {
    @NotNull(message = "L'ID du produit est obligatoire")
    private Long produitId;

    @Positive(message = "La quantité doit être positive")
    private Integer quantite;

    @NotBlank(message = "Le motif est obligatoire")
    private String motif;

    private String utilisateurId;
}
