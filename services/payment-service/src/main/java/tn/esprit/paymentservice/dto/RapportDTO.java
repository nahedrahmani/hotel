package tn.esprit.paymentservice.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RapportDTO {
    private String periode;
    private BigDecimal chiffreAffaires;
    private BigDecimal totalTva;
    private BigDecimal totalHT;
    private long nombreFactures;
    private long nombrePayees;
    private long nombreImpayees;
    private long nombreEnRetard;
    private BigDecimal montantImpaye;
    private Map<String, BigDecimal> revenueParMethode;
    private Map<String, BigDecimal> revenueParType;
    private Map<String, BigDecimal> revenueParMois;
}
