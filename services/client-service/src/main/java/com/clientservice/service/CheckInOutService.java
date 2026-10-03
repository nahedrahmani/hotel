package com.clientservice.service;

import com.clientservice.client.PaymentClient;
import com.clientservice.client.ReservationClient;
import com.clientservice.entity.CheckInRecord;
import com.clientservice.repository.CheckInRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheckInOutService {

    private final CheckInRecordRepository recordRepository;
    private final ReservationClient reservationClient;
    private final PaymentClient paymentClient;
    private final ConsoStockService consoStockService;

    public CheckInRecord checkIn(Long reservationId, String keycloakId,
                                  Boolean documentVerified, String notes) {
        ReservationClient.ReservationDTO reservation = fetchAndValidate(reservationId);

        if (!"CONFIRMED".equals(reservation.getStatus()) && !"PENDING".equals(reservation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La réservation doit être CONFIRMED ou PENDING pour effectuer un check-in (statut actuel: "
                            + reservation.getStatus() + ")");
        }

        reservation.setStatus("CHECKED_IN");
        reservationClient.update(reservationId, reservation);

        CheckInRecord record = CheckInRecord.builder()
                .reservationId(reservationId)
                .keycloakId(keycloakId)
                .chambreId(reservation.getRoomId())
                .type(CheckInRecord.RecordType.CHECKIN)
                .actualTime(LocalDateTime.now())
                .documentVerified(documentVerified != null ? documentVerified : false)
                .notes(notes)
                .build();
        return recordRepository.save(record);
    }

    public CheckInRecord checkOut(Long reservationId, String keycloakId, String notes) {
        ReservationClient.ReservationDTO reservation = fetchAndValidate(reservationId);

        if (!"CHECKED_IN".equals(reservation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La réservation doit être CHECKED_IN pour effectuer un check-out (statut actuel: "
                            + reservation.getStatus() + ")");
        }

        reservation.setStatus("CHECKED_OUT");
        reservationClient.update(reservationId, reservation);

        CheckInRecord record = CheckInRecord.builder()
                .reservationId(reservationId)
                .keycloakId(keycloakId)
                .chambreId(reservation.getRoomId())
                .type(CheckInRecord.RecordType.CHECKOUT)
                .actualTime(LocalDateTime.now())
                .documentVerified(true)
                .notes(notes)
                .build();
        CheckInRecord saved = recordRepository.save(record);

        // Record stock consumption for minibar/room products, then finalize invoice
        consoStockService.enregistrerConsoParDefaut(reservationId, reservation.getRoomId());
        finaliserFacture(reservationId);
        return saved;
    }

    public List<CheckInRecord> getByReservation(Long reservationId) {
        return recordRepository.findByReservationIdOrderByActualTimeDesc(reservationId);
    }

    public List<CheckInRecord> getByClient(String keycloakId) {
        return recordRepository.findByKeycloakIdOrderByActualTimeDesc(keycloakId);
    }

    /** Emits the BROUILLON invoice at checkout so the guest can be charged. */
    private void finaliserFacture(Long reservationId) {
        try {
            List<PaymentClient.FactureDTO> factures = paymentClient.getByReservation(reservationId);
            factures.stream()
                    .filter(f -> "BROUILLON".equals(f.getStatut()))
                    .forEach(f -> {
                        try {
                            paymentClient.emettre(f.getId());
                            log.info("Facture {} émise au checkout de la réservation {}", f.getId(), reservationId);
                        } catch (Exception e) {
                            log.warn("Could not emettre facture {} at checkout: {}", f.getId(), e.getMessage());
                        }
                    });
        } catch (Exception e) {
            log.warn("Could not finalize factures for reservation {} at checkout: {}", reservationId, e.getMessage());
        }
    }

    private ReservationClient.ReservationDTO fetchAndValidate(Long reservationId) {
        try {
            return reservationClient.getById(reservationId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Réservation introuvable: " + reservationId);
        }
    }
}
