package com.esprit.ms.reservation.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transport")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String typeVehicule;

    @NotBlank
    private String chauffeurNom;

    @NotBlank
    private String immatriculation;

    @Positive
    private int capacite;

    @NotNull
    @Positive
    private BigDecimal tarif;

    @NotBlank
    private String pointDepart;

    @NotBlank
    private String destination;

    @NotNull
    @Future
    private LocalDateTime dateDepart;

    private LocalDateTime dateArrivee;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    private StatutTransport statut;

    public enum StatutTransport {
        EN_ATTENTE,
        EN_COURS,
        TERMINE,
        ANNULE
    }
}
