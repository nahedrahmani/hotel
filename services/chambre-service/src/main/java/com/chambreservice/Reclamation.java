package com.chambreservice;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reclamation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sujet;
    private String description;
    private LocalDateTime dateCreation;
    private String statut;
    private String userId;

    @ManyToOne
    @JoinColumn(name = "chambre_id")
    private Chambre chambre;           // the room concerned by the complaint
}
