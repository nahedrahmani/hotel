package tn.esprit.stockservice.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.stockservice.enums.CategorieStock;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProduitDTO {
    private Long id;
    
    @NotBlank(message = "Le code est obligatoire")
    private String code;
    
    @NotBlank(message = "Le nom est obligatoire")
    private String nom;
    
    private String description;
    
    @NotNull(message = "La catégorie est obligatoire")
    private CategorieStock categorie;
    
    @NotBlank(message = "L'unité est obligatoire")
    private String unite;
    
    @Positive(message = "Le prix doit être positif")
    private Double prixUnitaire;
    
    @Min(value = 0, message = "Le seuil minimum doit être >= 0")
    private Integer seuilMinimum;
    
    @Min(value = 0, message = "Le seuil maximum doit être >= 0")
    private Integer seuilMaximum;
    
    private String fournisseur;
}
