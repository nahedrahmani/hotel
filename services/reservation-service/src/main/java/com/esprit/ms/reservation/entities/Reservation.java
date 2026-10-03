package com.esprit.ms.reservation.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id")
    private Long customerId;

    /** Keycloak sub — the authenticated user who owns this reservation */
    @Column(name = "keycloak_id")
    private String keycloakId;

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "hotel_id")
    private Long hotelId = 1L;

    @Column(name = "check_in_date")
    private LocalDate checkInDate;

    @Column(name = "check_out_date")
    private LocalDate checkOutDate;

    @Column(name = "number_of_guests")
    private Integer numberOfGuests;

    @Column(length = 1000)
    private String specialRequests;

    @Enumerated(EnumType.STRING)
    @Column(name = "reservation_type")
    private ReservationType reservationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ReservationStatus status;

    @Column(name = "cancel_reason", length = 500)
    private String cancelReason;

    @Column(name = "total_price", precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "deposit_paid", precision = 10, scale = 2)
    private BigDecimal depositPaid;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** Guest email — captured from JWT at booking time for notifications */
    @Column(name = "guest_email")
    private String guestEmail;

    /** Guest full name — captured from JWT at booking time, used on invoices */
    @Column(name = "guest_name")
    private String guestName;

    /** Keycloak sub of the staff member who last modified this record */
    @Column(name = "last_modified_by")
    private String lastModifiedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ReservationType {
        ONLINE, ON_SITE, PHONE, AGENCY
    }

    public enum ReservationStatus {
        PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW
    }
}
