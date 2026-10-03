package com.clientservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "demandes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Demande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String keycloakId;

    private Long chambreId;
    private Long reservationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DemandeType type;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Priority priority = Priority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DemandeStatut statut = DemandeStatut.OUVERTE;

    private String assignedTo;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateTraitement;

    public enum DemandeType {
        HOUSEKEEPING, ROOM_SERVICE, MAINTENANCE, EXTRA_TOWELS, WAKE_UP_CALL, TRANSPORT, OTHER
    }

    public enum Priority {
        LOW, NORMAL, HIGH, URGENT
    }

    public enum DemandeStatut {
        OUVERTE, EN_COURS, TRAITEE, FERMEE
    }
}
