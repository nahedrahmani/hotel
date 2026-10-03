package com.clientservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "conso_stock")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsoStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long reservationId;

    @Column(nullable = false)
    private Long chambreId;

    @Column(nullable = false)
    private Long produitId;

    private String produitNom;

    @Column(nullable = false)
    private Integer quantite;

    /** Unit price at time of consumption (snapshot) */
    @Column(precision = 10, scale = 2)
    private BigDecimal prixUnitaire;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dateConsommation;
}
