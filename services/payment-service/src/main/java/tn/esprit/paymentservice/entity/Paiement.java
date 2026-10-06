package tn.esprit.paymentservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import tn.esprit.paymentservice.enums.MethodePaiement;
import tn.esprit.paymentservice.enums.StatutPaiement;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id", nullable = false)
    private Facture facture;

    @Positive(message = "Le montant doit être positif")
    @NotNull(message = "Le montant est obligatoire")
    @Column(precision = 10, scale = 3)
    private BigDecimal montant;

    // Plain text, not a database enum: a new payment method must not need a schema change
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 30)
    @NotNull(message = "La méthode de paiement est obligatoire")
    private MethodePaiement methodePaiement;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutPaiement statut = StatutPaiement.EN_ATTENTE;

    @Column(unique = true)
    private String reference;

    @Builder.Default
    private LocalDateTime datePaiement = LocalDateTime.now();

    @Column(length = 500)
    private String note;
}
