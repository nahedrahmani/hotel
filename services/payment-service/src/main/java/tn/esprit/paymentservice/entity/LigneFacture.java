package tn.esprit.paymentservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Table(name = "lignes_facture")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneFacture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id", nullable = false)
    private Facture facture;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    @Positive(message = "La quantité doit être positive")
    private Integer quantite;

    @Positive(message = "Le prix unitaire doit être positif")
    @Column(precision = 10, scale = 3)
    private BigDecimal prixUnitaire;

    @DecimalMin("0.0") @DecimalMax("100.0")
    @Builder.Default
    private BigDecimal tauxTva = BigDecimal.valueOf(19);

    /**
     * True when prixUnitaire already includes VAT (consumer prices, e.g. a hotel stay).
     * The line total is then exactly the quoted price and HT/TVA are derived from it;
     * otherwise prixUnitaire is HT and VAT is added on top. Null on older rows = HT.
     */
    private Boolean prixTtc;

    private boolean isPrixTtc() {
        return Boolean.TRUE.equals(prixTtc);
    }

    private BigDecimal montantSaisi() {
        if (prixUnitaire == null || quantite == null) return BigDecimal.ZERO;
        return prixUnitaire.multiply(BigDecimal.valueOf(quantite)).setScale(3, RoundingMode.HALF_UP);
    }

    public BigDecimal getMontantHT() {
        if (!isPrixTtc()) return montantSaisi();
        return montantSaisi().multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(100).add(tauxTva), 3, RoundingMode.HALF_UP);
    }

    public BigDecimal getMontantTva() {
        if (isPrixTtc()) return montantSaisi().subtract(getMontantHT());
        return getMontantHT().multiply(tauxTva).divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP);
    }

    public BigDecimal getMontantTTC() {
        if (isPrixTtc()) return montantSaisi();
        return getMontantHT().add(getMontantTva()).setScale(3, RoundingMode.HALF_UP);
    }
}
