package tn.esprit.stockservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import tn.esprit.stockservice.enums.CategorieStock;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Produit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private String nom;

    private String description;

    @Enumerated(EnumType.STRING)
    private CategorieStock categorie;

    private String unite;

    @NotNull
    @Positive
    @Column(nullable = false)
    private Double prixUnitaire;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer seuilMinimum;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer seuilMaximum;

    private String fournisseur;

    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        dateModification = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();
    }
}
