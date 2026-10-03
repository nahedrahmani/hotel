package com.esprit.ms.reservation.DTOs;

import com.esprit.ms.reservation.entities.Transport;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransportDTO {

    private Long id;

    private String typeVehicule;       // ex: "Taxi", "Navette", "Voiture privée"
    private String chauffeurNom;
    private String immatriculation;
    private int capacite;
    private BigDecimal tarif;          // prix du trajet

    private String pointDepart;
    private String destination;
    private LocalDateTime dateDepart;
    private LocalDateTime dateArrivee;

    private Transport.StatutTransport statut; // EN_ATTENTE, EN_COURS, TERMINE, ANNULE
}
