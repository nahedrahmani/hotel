package com.esprit.ms.reservation.events;

import com.esprit.ms.reservation.config.RabbitMQConfig;
import com.esprit.ms.reservation.entities.Reservation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publish(Reservation reservation, ReservationEvent.Type type) {
        publish(reservation, type, null);
    }

    public void publish(Reservation reservation, ReservationEvent.Type type, BigDecimal penalty) {
        try {
            ReservationEvent event = new ReservationEvent(
                    type,
                    reservation.getId(),
                    reservation.getRoomId(),
                    reservation.getHotelId(),
                    reservation.getKeycloakId(),
                    reservation.getGuestEmail(),
                    reservation.getCheckInDate(),
                    reservation.getCheckOutDate(),
                    reservation.getTotalPrice(),
                    penalty,
                    reservation.getCancelReason(),
                    LocalDateTime.now()
            );
            String routingKey = "reservation." + type.name().toLowerCase();
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, routingKey, event);
            log.debug("Published {} event for reservation {}", type, reservation.getId());
        } catch (Exception e) {
            log.warn("Could not publish {} event for reservation {}: {}", type, reservation.getId(), e.getMessage());
        }
    }
}
