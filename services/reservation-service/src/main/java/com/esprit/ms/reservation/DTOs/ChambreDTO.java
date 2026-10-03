package com.esprit.ms.reservation.DTOs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChambreDTO {
    private Long id;
    private String numero;
    private String type;
    private Double prix;
    private Integer capacite;
    private String statut;
    private Integer etage;
    private String photo;
    private Boolean wifi;
    private Boolean climatisation;
    private Boolean balcon;
    private Long hotelId;
    // Dynamic pricing
    private Double weekendMultiplier;
    private String peakMonths;
    private Double peakMultiplier;
    // Cancellation policy
    private Integer cancellationPolicyHours;
    private Double cancellationFeePercent;
    private Integer nonRefundableHours;
}
