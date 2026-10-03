package tn.esprit.paymentservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import tn.esprit.paymentservice.enums.StatutFacture;
import tn.esprit.paymentservice.enums.TypeFacture;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "factures")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numero;

    // External references (IDs from other services)
    private Long reservationId;
    private Long clientId;

    @NotBlank(message = "Le nom du client est obligatoire")
    private String clientNom;

    private String clientEmail;
    private String clientTelephone;
    private String clientAdresse;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TypeFacture typeFacture = TypeFacture.HEBERGEMENT;

    @NotNull(message = "La date d'émission est obligatoire")
    private LocalDate dateEmission;

    private LocalDate dateEcheance;

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<LigneFacture> lignes = new ArrayList<>();

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private List<Paiement> paiements = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutFacture statut = StatutFacture.BROUILLON;

    @Column(length = 500)
    private String notes;

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

    public BigDecimal getSousTotal() {
        return lignes.stream()
                .map(LigneFacture::getMontantHT)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
    }

    public BigDecimal getTotalTva() {
        return lignes.stream()
                .map(LigneFacture::getMontantTva)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
    }

    public BigDecimal getTotalTTC() {
        return lignes.stream()
                .map(LigneFacture::getMontantTTC)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
    }

    public BigDecimal getMontantPaye() {
        return paiements.stream()
                .filter(p -> p.getStatut() == tn.esprit.paymentservice.enums.StatutPaiement.CONFIRME)
                .map(Paiement::getMontant)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(3, RoundingMode.HALF_UP);
    }

    public BigDecimal getMontantRestant() {
        return getTotalTTC().subtract(getMontantPaye()).max(BigDecimal.ZERO);
    }
}
