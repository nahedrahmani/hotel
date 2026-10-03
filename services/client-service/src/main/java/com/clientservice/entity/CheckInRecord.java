package com.clientservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "checkin_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckInRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long reservationId;

    @Column(nullable = false)
    private String keycloakId;

    private Long chambreId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecordType type;

    private LocalDateTime actualTime;
    private Boolean documentVerified;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum RecordType {
        CHECKIN, CHECKOUT
    }
}
