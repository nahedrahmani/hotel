package com.chambreservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class ChambreStockDTO {
    private Long chambreId;
    private String chambreNom;
    private List<ProduitDTO> produitsAssocies;
    private Double valeurTotale;
    private Integer nombreProduits;
}
