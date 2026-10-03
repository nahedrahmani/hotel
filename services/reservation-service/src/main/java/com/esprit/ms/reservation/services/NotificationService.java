package com.esprit.ms.reservation.services;

import com.esprit.ms.reservation.entities.Reservation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;

    @Value("${notification.from:noreply@hotel.example}")
    private String from;

    @Value("${notification.enabled:false}")
    private boolean enabled;

    public NotificationService(@Nullable @Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
        if (mailSender == null) {
            log.info("JavaMailSender not configured — email notifications disabled");
        }
    }

    public void sendConfirmation(Reservation reservation) {
        if (!enabled || mailSender == null || reservation.getGuestEmail() == null) return;
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(reservation.getGuestEmail());
            msg.setSubject("Confirmation de votre réservation #" + reservation.getId());
            msg.setText("""
                    Bonjour,

                    Votre réservation a été confirmée.

                    Détails :
                      Réservation n° : %d
                      Chambre        : %d
                      Arrivée        : %s
                      Départ         : %s
                      Montant total  : %s DT

                    Nous vous souhaitons un agréable séjour.

                    L'équipe de l'hôtel
                    """.formatted(
                    reservation.getId(),
                    reservation.getRoomId(),
                    reservation.getCheckInDate(),
                    reservation.getCheckOutDate(),
                    reservation.getTotalPrice() != null ? reservation.getTotalPrice() : "—"
            ));
            mailSender.send(msg);
            log.info("Confirmation email sent to {} for reservation {}", reservation.getGuestEmail(), reservation.getId());
        } catch (Exception e) {
            log.warn("Could not send confirmation email for reservation {}: {}", reservation.getId(), e.getMessage());
        }
    }

    public void sendCancellation(Reservation reservation, BigDecimal penalty) {
        if (!enabled || mailSender == null || reservation.getGuestEmail() == null) return;
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(reservation.getGuestEmail());
            msg.setSubject("Annulation de votre réservation #" + reservation.getId());
            String penaltyLine = (penalty != null && penalty.compareTo(BigDecimal.ZERO) > 0)
                    ? "\n  Pénalité d'annulation : " + penalty + " DT\n"
                    : "\n  Aucune pénalité appliquée.\n";
            msg.setText("""
                    Bonjour,

                    Votre réservation #%d a été annulée.
                    %s
                    Si vous avez des questions, contactez notre équipe.

                    L'équipe de l'hôtel
                    """.formatted(reservation.getId(), penaltyLine));
            mailSender.send(msg);
            log.info("Cancellation email sent to {} for reservation {}", reservation.getGuestEmail(), reservation.getId());
        } catch (Exception e) {
            log.warn("Could not send cancellation email for reservation {}: {}", reservation.getId(), e.getMessage());
        }
    }
}
