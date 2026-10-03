package tn.esprit.stockservice.entity;

import jakarta.persistence.*;
import lombok.*;
import tn.esprit.stockservice.enums.TypeMouvement;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MouvementStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long produitId;

    @Enumerated(EnumType.STRING)
    private TypeMouvement typeMouvement;

    private Integer quantite;
    private String motif;
    private String utilisateurId;
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
    }
}
