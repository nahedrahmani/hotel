package tn.esprit.stockservice.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockDTO {
    private Long id;
    private Long produitId;
    private String produitNom;
    private Integer quantiteDisponible;
    private Integer quantiteReservee;
    private String emplacement;
    private Boolean enRupture;
}
