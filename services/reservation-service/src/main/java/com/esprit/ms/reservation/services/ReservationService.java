package com.esprit.ms.reservation.services;

import com.esprit.ms.reservation.DTOs.ChambreDTO;
import com.esprit.ms.reservation.DTOs.ReservationDTO;
import com.esprit.ms.reservation.client.ChambreClient;
import com.esprit.ms.reservation.client.PaymentClient;
import com.esprit.ms.reservation.entities.Reservation;
import com.esprit.ms.reservation.events.ReservationEvent;
import com.esprit.ms.reservation.events.ReservationEventPublisher;
import com.esprit.ms.reservation.repositories.ReservationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ChambreClient chambreClient;
    private final PaymentClient paymentClient;
    private final NotificationService notificationService;
    private final ReservationEventPublisher eventPublisher;

    public ReservationService(ReservationRepository reservationRepository,
                               ChambreClient chambreClient,
                               PaymentClient paymentClient,
                               NotificationService notificationService,
                               ReservationEventPublisher eventPublisher) {
        this.reservationRepository = reservationRepository;
        this.chambreClient = chambreClient;
        this.paymentClient = paymentClient;
        this.notificationService = notificationService;
        this.eventPublisher = eventPublisher;
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    public List<ReservationDTO> getAll() {
        List<Reservation> all = reservationRepository.findAll();
        Map<Long, ChambreDTO> cache = buildChambreCache(all);
        return all.stream().map(r -> enrich(r, cache)).collect(Collectors.toList());
    }

    public List<ReservationDTO> getAll(Long hotelId) {
        List<Reservation> all = hotelId != null
                ? reservationRepository.findByHotelId(hotelId)
                : reservationRepository.findAll();
        Map<Long, ChambreDTO> cache = buildChambreCache(all);
        return all.stream().map(r -> enrich(r, cache)).collect(Collectors.toList());
    }

    public ReservationDTO getById(Long id) {
        return reservationRepository.findById(id)
                .map(this::enrich)
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found with id: " + id));
    }

    public List<ReservationDTO> getByCustomerId(Long customerId) {
        return reservationRepository.findByCustomerId(customerId).stream()
                .map(this::enrich).collect(Collectors.toList());
    }

    public List<ReservationDTO> getByKeycloakId(String keycloakId) {
        return reservationRepository.findByKeycloakId(keycloakId).stream()
                .map(this::enrich).collect(Collectors.toList());
    }

    public List<ReservationDTO> getByRoomId(Long roomId) {
        return reservationRepository.findByRoomIdOrderByCheckInDateDesc(roomId).stream()
                .map(this::enrich).collect(Collectors.toList());
    }

    public List<ReservationDTO> getByDateRange(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn.isAfter(checkOut)) {
            throw new IllegalArgumentException("Check-in date must be before check-out date");
        }
        return reservationRepository.findByDateRange(checkIn, checkOut).stream()
                .map(this::enrich).collect(Collectors.toList());
    }

    public Map<String, List<ReservationDTO>> getToday() {
        LocalDate today = LocalDate.now();
        Map<String, List<ReservationDTO>> result = new HashMap<>();
        result.put("arrivals",   reservationRepository.findByCheckInDate(today).stream().map(this::enrich).collect(Collectors.toList()));
        result.put("departures", reservationRepository.findByCheckOutDate(today).stream().map(this::enrich).collect(Collectors.toList()));
        return result;
    }

    public boolean checkAvailability(Long roomId, LocalDate checkIn, LocalDate checkOut) {
        return reservationRepository.findOverlapping(roomId, checkIn, checkOut).isEmpty();
    }

    public List<PaymentClient.FactureDTO> getFactures(Long reservationId) {
        try {
            return paymentClient.getFacturesByReservation(reservationId);
        } catch (Exception e) {
            log.warn("Could not fetch factures for reservation {}: {}", reservationId, e.getMessage());
            return List.of();
        }
    }

    /** Returns a dynamic price breakdown for the given room and dates. */
    public Map<String, Object> calculatePrice(Long roomId, LocalDate checkIn, LocalDate checkOut) {
        ChambreDTO chambre = getChambreOrThrow(roomId);
        List<Map<String, Object>> nights = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        LocalDate current = checkIn;
        while (current.isBefore(checkOut)) {
            double price = nightPrice(chambre, current);
            BigDecimal nightTotal = BigDecimal.valueOf(price).setScale(2, RoundingMode.HALF_UP);
            nights.add(Map.of("date", current.toString(), "price", nightTotal));
            total = total.add(nightTotal);
            current = current.plusDays(1);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("total", total.setScale(2, RoundingMode.HALF_UP));
        result.put("nights", nights);
        result.put("currency", "DT");
        return result;
    }

    // ── Mutations ──────────────────────────────────────────────────────────────

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ReservationDTO addReservation(ReservationDTO dto) {
        if (dto.getKeycloakId() == null || dto.getKeycloakId().isBlank()) {
            throw new IllegalArgumentException("keycloakId is required (must be set from JWT)");
        }
        if (dto.getCheckInDate() == null || dto.getCheckOutDate() == null) {
            throw new IllegalArgumentException("Check-in and check-out dates are required");
        }
        if (dto.getCheckInDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Check-in date cannot be in the past");
        }
        if (dto.getCheckOutDate().isBefore(dto.getCheckInDate()) ||
                dto.getCheckOutDate().isEqual(dto.getCheckInDate())) {
            throw new IllegalArgumentException("Check-out date must be after check-in date");
        }

        ChambreDTO chambre = getChambreOrThrow(dto.getRoomId());

        List<Reservation> overlapping = reservationRepository.findOverlapping(
                dto.getRoomId(), dto.getCheckInDate(), dto.getCheckOutDate());
        if (!overlapping.isEmpty()) {
            Reservation conflict = overlapping.get(0);
            throw new IllegalStateException(
                    "Chambre " + dto.getRoomId() + " already booked from " +
                    conflict.getCheckInDate() + " to " + conflict.getCheckOutDate());
        }

        Reservation reservation = toEntity(dto);
        reservation.setCreatedAt(LocalDateTime.now());
        reservation.setUpdatedAt(LocalDateTime.now());
        if (reservation.getStatus() == null) {
            reservation.setStatus(Reservation.ReservationStatus.PENDING);
        }
        if (reservation.getHotelId() == null) {
            reservation.setHotelId(chambre.getHotelId() != null ? chambre.getHotelId() : 1L);
        }
        // Always calculate authoritative price on the backend
        reservation.setTotalPrice(calculateDynamicPrice(chambre, dto.getCheckInDate(), dto.getCheckOutDate()));

        Reservation saved = reservationRepository.save(reservation);
        eventPublisher.publish(saved, ReservationEvent.Type.CREATED);
        return enrich(saved);
    }

    public ReservationDTO updateReservation(Long id, ReservationDTO dto) {
        Reservation existing = reservationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found with id: " + id));

        if (dto.getCheckInDate() != null && dto.getCheckOutDate() != null) {
            List<Reservation> overlapping = reservationRepository.findOverlappingExcluding(
                    dto.getRoomId(), dto.getCheckInDate(), dto.getCheckOutDate(), id);
            if (!overlapping.isEmpty()) {
                Reservation conflict = overlapping.get(0);
                throw new IllegalStateException(
                        "Chambre " + dto.getRoomId() + " already booked from " +
                        conflict.getCheckInDate() + " to " + conflict.getCheckOutDate());
            }
        }

        Reservation.ReservationStatus previousStatus = existing.getStatus();
        existing.setCustomerId(dto.getCustomerId());
        existing.setKeycloakId(dto.getKeycloakId());
        existing.setRoomId(dto.getRoomId());
        existing.setCheckInDate(dto.getCheckInDate());
        existing.setCheckOutDate(dto.getCheckOutDate());
        existing.setNumberOfGuests(dto.getNumberOfGuests());
        existing.setSpecialRequests(dto.getSpecialRequests());
        existing.setReservationType(dto.getReservationType());
        existing.setStatus(dto.getStatus());
        existing.setCancelReason(dto.getCancelReason());
        existing.setTotalPrice(dto.getTotalPrice());
        existing.setDepositPaid(dto.getDepositPaid());
        existing.setUpdatedAt(LocalDateTime.now());

        Reservation updated = reservationRepository.save(existing);
        syncChambreStatut(updated, previousStatus);
        return enrich(updated);
    }

    public ReservationDTO confirm(Long id, String modifiedBy) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found: " + id));

        if (reservation.getStatus() != Reservation.ReservationStatus.PENDING &&
            reservation.getStatus() != Reservation.ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("Cannot confirm reservation in status: " + reservation.getStatus());
        }

        Reservation.ReservationStatus previous = reservation.getStatus();
        reservation.setStatus(Reservation.ReservationStatus.CONFIRMED);
        reservation.setLastModifiedBy(modifiedBy);
        reservation.setUpdatedAt(LocalDateTime.now());
        Reservation saved = reservationRepository.save(reservation);
        syncChambreStatut(saved, previous);
        autoCreateBrouillonFacture(saved);
        notificationService.sendConfirmation(saved);
        eventPublisher.publish(saved, ReservationEvent.Type.CONFIRMED);
        return enrich(saved);
    }

    public ReservationDTO cancel(Long id, String reason, String modifiedBy) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Reservation not found: " + id));

        if (reservation.getStatus() == Reservation.ReservationStatus.CHECKED_OUT ||
            reservation.getStatus() == Reservation.ReservationStatus.CANCELLED) {
            throw new IllegalStateException("Cannot cancel reservation in status: " + reservation.getStatus());
        }

        BigDecimal penalty = calculateCancellationPenalty(reservation);

        Reservation.ReservationStatus previous = reservation.getStatus();
        reservation.setStatus(Reservation.ReservationStatus.CANCELLED);
        reservation.setCancelReason(reason);
        reservation.setLastModifiedBy(modifiedBy);
        reservation.setUpdatedAt(LocalDateTime.now());
        Reservation saved = reservationRepository.save(reservation);
        syncChambreStatut(saved, previous);
        notificationService.sendCancellation(saved, penalty);
        eventPublisher.publish(saved, ReservationEvent.Type.CANCELLED, penalty);

        ReservationDTO result = enrich(saved);
        result.setCancellationPenalty(penalty);
        return result;
    }

    public void deleteReservation(Long id) {
        if (!reservationRepository.existsById(id)) {
            throw new EntityNotFoundException("Reservation not found with id: " + id);
        }
        reservationRepository.deleteById(id);
    }

    public Reservation save(Reservation reservation) {
        return reservationRepository.save(reservation);
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    public Map<String, Object> getStats() {
        List<Reservation> all = reservationRepository.findAll();
        LocalDate today = LocalDate.now();

        Map<String, Long> byType = new HashMap<>();
        for (Reservation r : all) {
            if (r.getReservationType() != null) {
                byType.merge(r.getReservationType().name(), 1L, Long::sum);
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total",          (long) all.size());
        stats.put("pending",        count(all, Reservation.ReservationStatus.PENDING));
        stats.put("confirmed",      count(all, Reservation.ReservationStatus.CONFIRMED));
        stats.put("checkedIn",      count(all, Reservation.ReservationStatus.CHECKED_IN));
        stats.put("cancelled",      count(all, Reservation.ReservationStatus.CANCELLED));
        stats.put("todayCheckIns",  all.stream().filter(r -> today.equals(r.getCheckInDate())).count());
        stats.put("todayCheckOuts", all.stream().filter(r -> today.equals(r.getCheckOutDate())).count());
        stats.put("byType", byType);
        return stats;
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private long count(List<Reservation> list, Reservation.ReservationStatus status) {
        return list.stream().filter(r -> status == r.getStatus()).count();
    }

    private ChambreDTO getChambreOrThrow(Long roomId) {
        if (roomId == null) throw new IllegalArgumentException("roomId is required");
        try {
            return chambreClient.getChambreById(roomId);
        } catch (Exception e) {
            throw new IllegalArgumentException("Chambre introuvable avec l'id: " + roomId);
        }
    }

    /** Returns the nightly price for a given date applying weekend and peak multipliers. */
    private double nightPrice(ChambreDTO chambre, LocalDate date) {
        if (chambre.getPrix() == null) return 0;
        double price = chambre.getPrix();
        DayOfWeek day = date.getDayOfWeek();
        if ((day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY)
                && chambre.getWeekendMultiplier() != null && chambre.getWeekendMultiplier() > 1.0) {
            price *= chambre.getWeekendMultiplier();
        }
        if (chambre.getPeakMonths() != null && !chambre.getPeakMonths().isBlank()) {
            Set<Integer> peakSet = Arrays.stream(chambre.getPeakMonths().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty())
                    .flatMap(s -> { try { return java.util.stream.Stream.of(Integer.parseInt(s)); } catch (NumberFormatException e) { return java.util.stream.Stream.empty(); } })
                    .collect(Collectors.toSet());
            if (peakSet.contains(date.getMonthValue())
                    && chambre.getPeakMultiplier() != null && chambre.getPeakMultiplier() > 1.0) {
                price *= chambre.getPeakMultiplier();
            }
        }
        return price;
    }

    private BigDecimal calculateDynamicPrice(ChambreDTO chambre, LocalDate checkIn, LocalDate checkOut) {
        if (chambre == null || chambre.getPrix() == null || checkIn == null || checkOut == null) return null;
        double total = checkIn.datesUntil(checkOut).mapToDouble(d -> nightPrice(chambre, d)).sum();
        return BigDecimal.valueOf(total).setScale(2, RoundingMode.HALF_UP);
    }

    /** Computes the cancellation penalty based on the room's policy and hours until check-in. */
    private BigDecimal calculateCancellationPenalty(Reservation reservation) {
        if (reservation.getTotalPrice() == null || reservation.getCheckInDate() == null) {
            return BigDecimal.ZERO;
        }
        ChambreDTO chambre = null;
        try {
            chambre = chambreClient.getChambreById(reservation.getRoomId());
        } catch (Exception e) {
            log.debug("Could not fetch chambre for cancellation policy: {}", e.getMessage());
        }

        int freeBefore = chambre != null && chambre.getCancellationPolicyHours() != null
                ? chambre.getCancellationPolicyHours() : 48;
        double feePercent = chambre != null && chambre.getCancellationFeePercent() != null
                ? chambre.getCancellationFeePercent() : 50.0;
        int nonRefundable = chambre != null && chambre.getNonRefundableHours() != null
                ? chambre.getNonRefundableHours() : 24;

        long hoursUntil = ChronoUnit.HOURS.between(LocalDateTime.now(),
                reservation.getCheckInDate().atTime(14, 0));

        if (hoursUntil >= freeBefore) return BigDecimal.ZERO;
        if (hoursUntil <= nonRefundable) return reservation.getTotalPrice();
        return reservation.getTotalPrice()
                .multiply(BigDecimal.valueOf(feePercent / 100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /** Syncs chambre statut when reservation status changes. */
    private void syncChambreStatut(Reservation reservation, Reservation.ReservationStatus previousStatus) {
        if (reservation.getRoomId() == null) return;
        if (reservation.getStatus() == previousStatus) return;

        // The room's statut is its physical state right now, so only arrivals and departures
        // change it. Future bookings are handled by the date-based availability check: marking
        // the room "réservée" on confirmation (or "disponible" on cancellation) would mislabel
        // a room that another guest is occupying today.
        String newStatut = switch (reservation.getStatus()) {
            case CHECKED_IN  -> "occupée";
            case CHECKED_OUT -> "à_nettoyer";          // triggers housekeeping workflow
            case CANCELLED   -> previousStatus == Reservation.ReservationStatus.CHECKED_IN ? "à_nettoyer" : null;
            default -> null;
        };

        if (newStatut == null) return;

        try {
            chambreClient.updateStatut(reservation.getRoomId(), Map.of("statut", newStatut));
            log.info("Chambre {} statut → {}", reservation.getRoomId(), newStatut);
        } catch (Exception e) {
            log.warn("Could not sync chambre {} statut: {}", reservation.getRoomId(), e.getMessage());
        }

        ReservationEvent.Type evtType = switch (reservation.getStatus()) {
            case CHECKED_IN  -> ReservationEvent.Type.CHECKED_IN;
            case CHECKED_OUT -> ReservationEvent.Type.CHECKED_OUT;
            case NO_SHOW     -> ReservationEvent.Type.NO_SHOW;
            default          -> null;
        };
        if (evtType != null) eventPublisher.publish(reservation, evtType);
    }

    private Map<Long, ChambreDTO> buildChambreCache(List<Reservation> reservations) {
        Map<Long, ChambreDTO> cache = new HashMap<>();
        reservations.stream()
                .map(Reservation::getRoomId)
                .filter(Objects::nonNull)
                .distinct()
                .forEach(roomId -> {
                    try {
                        cache.put(roomId, chambreClient.getChambreById(roomId));
                    } catch (Exception e) {
                        log.debug("Could not fetch chambre {} for cache: {}", roomId, e.getMessage());
                    }
                });
        return cache;
    }

    private ReservationDTO enrich(Reservation entity, Map<Long, ChambreDTO> cache) {
        ReservationDTO dto = toDTO(entity);
        if (entity.getRoomId() != null) dto.setChambre(cache.get(entity.getRoomId()));
        return dto;
    }

    private ReservationDTO enrich(Reservation entity) {
        ReservationDTO dto = toDTO(entity);
        if (entity.getRoomId() != null) {
            try {
                dto.setChambre(chambreClient.getChambreById(entity.getRoomId()));
            } catch (Exception e) {
                log.debug("Could not fetch chambre {} details: {}", entity.getRoomId(), e.getMessage());
            }
        }
        return dto;
    }

    private static final BigDecimal TVA_HEBERGEMENT = BigDecimal.valueOf(19);
    private static final java.time.format.DateTimeFormatter DATE_FR = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private void autoCreateBrouillonFacture(Reservation reservation) {
        try {
            List<PaymentClient.FactureDTO> existing = paymentClient.getFacturesByReservation(reservation.getId());
            if (!existing.isEmpty()) return;

            PaymentClient.FactureCreateDTO facture = new PaymentClient.FactureCreateDTO();
            facture.setReservationId(reservation.getId());
            facture.setClientId(reservation.getCustomerId());
            // payment-service requires a client name; fall back to the email for older bookings
            facture.setClientNom(reservation.getGuestName() != null ? reservation.getGuestName()
                    : reservation.getGuestEmail() != null ? reservation.getGuestEmail() : "Client");
            facture.setClientEmail(reservation.getGuestEmail());
            facture.setTypeFacture("HEBERGEMENT");
            facture.setDateEmission(LocalDate.now());
            facture.setDateEcheance(reservation.getCheckInDate());

            if (reservation.getTotalPrice() != null) {
                PaymentClient.LigneDTO ligne = new PaymentClient.LigneDTO();
                ligne.setDescription("Séjour du " + reservation.getCheckInDate().format(DATE_FR) + " au " + reservation.getCheckOutDate().format(DATE_FR));
                ligne.setQuantite(1);
                // Room prices are quoted to guests VAT included; payment-service derives HT and
                // TVA from that amount, so the invoice total is exactly the price the guest saw.
                ligne.setPrixUnitaire(reservation.getTotalPrice());
                ligne.setTauxTva(TVA_HEBERGEMENT);
                ligne.setPrixTtc(true);
                facture.setLignes(List.of(ligne));
            } else {
                facture.setLignes(List.of());   // always non-null — FactureService loops over this
            }

            paymentClient.createFacture(facture);
            log.info("Auto-created BROUILLON facture for reservation {}", reservation.getId());
        } catch (Exception e) {
            log.warn("Could not auto-create facture for reservation {}: {}", reservation.getId(), e.getMessage());
        }
    }

    private ReservationDTO toDTO(Reservation entity) {
        if (entity == null) return null;
        ReservationDTO dto = new ReservationDTO();
        dto.setId(entity.getId());
        dto.setCustomerId(entity.getCustomerId());
        dto.setKeycloakId(entity.getKeycloakId());
        dto.setRoomId(entity.getRoomId());
        dto.setHotelId(entity.getHotelId());
        dto.setCheckInDate(entity.getCheckInDate());
        dto.setCheckOutDate(entity.getCheckOutDate());
        dto.setNumberOfGuests(entity.getNumberOfGuests());
        dto.setSpecialRequests(entity.getSpecialRequests());
        dto.setReservationType(entity.getReservationType());
        dto.setStatus(entity.getStatus());
        dto.setCancelReason(entity.getCancelReason());
        dto.setTotalPrice(entity.getTotalPrice());
        dto.setDepositPaid(entity.getDepositPaid());
        dto.setGuestEmail(entity.getGuestEmail());
        dto.setGuestName(entity.getGuestName());
        dto.setLastModifiedBy(entity.getLastModifiedBy());
        return dto;
    }

    private Reservation toEntity(ReservationDTO dto) {
        if (dto == null) return null;
        Reservation entity = new Reservation();
        entity.setId(dto.getId());
        entity.setCustomerId(dto.getCustomerId());
        entity.setKeycloakId(dto.getKeycloakId());
        entity.setRoomId(dto.getRoomId());
        entity.setHotelId(dto.getHotelId());
        entity.setCheckInDate(dto.getCheckInDate());
        entity.setCheckOutDate(dto.getCheckOutDate());
        entity.setNumberOfGuests(dto.getNumberOfGuests());
        entity.setSpecialRequests(dto.getSpecialRequests());
        entity.setReservationType(dto.getReservationType());
        entity.setStatus(dto.getStatus());
        entity.setCancelReason(dto.getCancelReason());
        entity.setTotalPrice(dto.getTotalPrice());
        entity.setDepositPaid(dto.getDepositPaid());
        entity.setGuestEmail(dto.getGuestEmail());
        entity.setGuestName(dto.getGuestName());
        entity.setLastModifiedBy(dto.getLastModifiedBy());
        return entity;
    }
}
