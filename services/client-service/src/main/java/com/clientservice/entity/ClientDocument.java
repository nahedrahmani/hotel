package com.clientservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "client_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String keycloakId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType type;

    private String documentNumber;
    private LocalDate expiryDate;

    @Column(nullable = false)
    private String cloudinaryUrl;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    public enum DocumentType {
        PASSPORT, ID_CARD, VISA, OTHER
    }
}
