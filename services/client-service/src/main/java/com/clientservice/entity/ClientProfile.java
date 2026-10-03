package com.clientservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "client_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String keycloakId;

    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String nationality;
    private String language;

    // Room preferences
    @Enumerated(EnumType.STRING)
    private BedType bedType;

    private Integer preferredFloor;
    private Boolean smokingRoom;

    @Column(length = 1000)
    private String specialRequests;

    // Internal staff notes
    @Column(length = 2000)
    private String notes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum BedType {
        SINGLE, DOUBLE, TWIN, KING, SUITE
    }
}
