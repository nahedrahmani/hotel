package com.chambreservice.dto;

import lombok.Data;

@Data
public class ProduitDTO {
    private Long id;
    private String code;
    private String nom;
    private String description;
    private String categorie;
    private String unite;
    private Double prixUnitaire;
    private Integer seuilMinimum;
    private Integer seuilMaximum;
    private String fournisseur;
}
