package com.esprit.ms.reservation.Controllers;

import com.esprit.ms.reservation.DTOs.ReservationDTO;
import com.esprit.ms.reservation.client.PaymentClient;
import com.esprit.ms.reservation.services.ReservationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/api/reservations", produces = MediaType.APPLICATION_JSON_VALUE)
public class ReservationRestApi {

    @Autowired
    private ReservationService reservationService;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<ReservationDTO> getAllReservations(@RequestParam(required = false) Long hotelId) {
        return reservationService.getAll(hotelId);
    }

    @GetMapping("/price")
    public Map<String, Object> calculatePrice(
            @RequestParam Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate) {
        return reservationService.calculatePrice(roomId, checkInDate, checkOutDate);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<ReservationDTO> getReservationById(@PathVariable Long id) {
        ReservationDTO r = reservationService.getById(id);
        return r != null ? ResponseEntity.ok(r) : ResponseEntity.notFound().build();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ReservationDTO addReservation(
            @Valid @RequestBody ReservationDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        boolean staff = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> List.of("ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF").contains(a.getAuthority()));
        if (staff && dto.getGuestName() != null && !dto.getGuestName().isBlank()) {
            // Reception booking for a guest at the desk or on the phone: the guest has no
            // account here, so the booking belongs to no one's "Mes réservations"
            dto.setKeycloakId(null);
            dto.setGuestName(dto.getGuestName().trim());
        } else if (jwt != null) {
            dto.setKeycloakId(jwt.getSubject());
            String email = jwt.getClaimAsString("email");
            if (email != null) dto.setGuestEmail(email);
            String name = jwt.getClaimAsString("name");
            if (name != null) dto.setGuestName(name);
        }
        return reservationService.addReservation(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<ReservationDTO> updateReservation(@PathVariable Long id,
                                                             @RequestBody ReservationDTO dto) {
        return ResponseEntity.ok(reservationService.updateReservation(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }

    // ── Status actions ────────────────────────────────────────────────────────

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ReservationDTO confirm(@PathVariable Long id,
                                   @AuthenticationPrincipal Jwt jwt) {
        return reservationService.confirm(id, jwt != null ? jwt.getSubject() : null);
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ReservationDTO cancel(@PathVariable Long id,
                                  @RequestBody(required = false) Map<String, String> body,
                                  @AuthenticationPrincipal Jwt jwt,
                                  Authentication authentication) {
        requireOwnerOrStaff(id, jwt, authentication, "Vous ne pouvez annuler que vos propres réservations");
        String reason = body != null ? body.get("reason") : null;
        return reservationService.cancel(id, reason, jwt != null ? jwt.getSubject() : null);
    }

    // ── Queries ────────────────────────────────────────────────────────────────

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<ReservationDTO> getByCustomer(@PathVariable Long customerId) {
        return reservationService.getByCustomerId(customerId);
    }

    @GetMapping("/keycloak/{keycloakId}")
    @PreAuthorize("isAuthenticated() and (#keycloakId == authentication.name or hasAnyRole('ADMIN','MANAGER','STAFF'))")
    public List<ReservationDTO> getByKeycloakId(@PathVariable String keycloakId) {
        return reservationService.getByKeycloakId(keycloakId);
    }

    @GetMapping("/room/{roomId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<ReservationDTO> getByRoomId(@PathVariable Long roomId) {
        return reservationService.getByRoomId(roomId);
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public Map<String, List<ReservationDTO>> getToday() {
        return reservationService.getToday();
    }

    @GetMapping("/availability")
    public Map<String, Boolean> checkAvailability(
            @RequestParam Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate) {
        boolean available = reservationService.checkAvailability(roomId, checkInDate, checkOutDate);
        return Map.of("available", available);
    }

    // Counts of reservations the front desk can already list (today's arrivals/departures)
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(reservationService.getStats());
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<ReservationDTO> searchReservations(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate) {
        return reservationService.getByDateRange(checkInDate, checkOutDate);
    }

    @GetMapping("/{id}/factures")
    @PreAuthorize("isAuthenticated()")
    public List<PaymentClient.FactureDTO> getFactures(@PathVariable Long id,
                                                      @AuthenticationPrincipal Jwt jwt,
                                                      Authentication authentication) {
        // Guests see the invoices of their own bookings so they can pay them online
        requireOwnerOrStaff(id, jwt, authentication, "Ces factures ne concernent pas vos réservations");
        return reservationService.getFactures(id);
    }

    /** Staff act on any booking; anyone else only on a booking made with their own account. */
    private void requireOwnerOrStaff(Long reservationId, Jwt jwt, Authentication authentication, String refusal) {
        boolean staff = authentication.getAuthorities().stream()
                .anyMatch(a -> List.of("ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF").contains(a.getAuthority()));
        if (staff) return;
        ReservationDTO existing = reservationService.getById(reservationId);
        if (existing == null || jwt == null || !jwt.getSubject().equals(existing.getKeycloakId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, refusal);
        }
    }
}
