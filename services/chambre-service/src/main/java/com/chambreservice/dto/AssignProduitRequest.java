package com.chambreservice.dto;

import lombok.Data;

@Data
public class AssignProduitRequest {
    private Long chambreId;
    private Long produitId;
    private Integer quantite;
}
