package com.esprit.ms.reservation.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationEvent {

    public enum Type {
        CREATED, CONFIRMED, CANCELLED, CHECKED_IN, CHECKED_OUT, NO_SHOW
    }

    private Type eventType;
    private Long reservationId;
    private Long roomId;
    private Long hotelId;
    private String keycloakId;
    private String guestEmail;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private BigDecimal totalPrice;
    private BigDecimal cancellationPenalty;
    private String cancelReason;
    private LocalDateTime occurredAt;
}
