package tn.esprit.stockservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long produitId;

    private Integer quantiteDisponible;
    private Integer quantiteReservee;
    private String emplacement;
    private LocalDateTime dateInventaire;

    @PrePersist
    protected void onCreate() {
        dateInventaire = LocalDateTime.now();
    }
}
