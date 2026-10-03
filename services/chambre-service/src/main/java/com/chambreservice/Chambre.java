package com.chambreservice;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chambre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numero;
    private String type;
    private Double prix;
    private Integer capacite;
    private String statut;
    private String description;
    private String photo;
    private Integer etage;
    private Boolean balcon;
    private Boolean climatisation;
    private Boolean television;
    private Boolean wifi;
    private Boolean minibar;
    private Boolean vueMer;
    private Double superficie;

    /** Multi-hotel: which hotel this room belongs to (default 1) */
    @Builder.Default
    @Column(name = "hotel_id")
    private Long hotelId = 1L;

    // ── Dynamic pricing ────────────────────────────────────────────────────────
    /** Multiplier applied on Saturday and Sunday (e.g. 1.2 = +20%) */
    @Builder.Default
    @Column(name = "weekend_multiplier")
    private Double weekendMultiplier = 1.0;

    /** Comma-separated peak month numbers, e.g. "6,7,8,12" */
    @Column(name = "peak_months")
    private String peakMonths;

    /** Multiplier applied during peak months (e.g. 1.3 = +30%) */
    @Builder.Default
    @Column(name = "peak_multiplier")
    private Double peakMultiplier = 1.0;

    // ── Cancellation policy ────────────────────────────────────────────────────
    /** Hours before check-in during which cancellation is free (default 48h) */
    @Builder.Default
    @Column(name = "cancellation_policy_hours")
    private Integer cancellationPolicyHours = 48;

    /** Fee as a percentage of total price applied after free window (default 50%) */
    @Builder.Default
    @Column(name = "cancellation_fee_percent")
    private Double cancellationFeePercent = 50.0;

    /** Hours before check-in within which cancellation is 100% charged (default 24h) */
    @Builder.Default
    @Column(name = "non_refundable_hours")
    private Integer nonRefundableHours = 24;

    @ElementCollection
    @CollectionTable(name = "chambre_produits", joinColumns = @JoinColumn(name = "chambre_id"))
    @Column(name = "produit_id")
    private List<Long> produitIds;

    @OneToMany(mappedBy = "chambre", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reclamation> reclamations;
}
