package com.esprit.ms.reservation.DTOs;

import com.esprit.ms.reservation.entities.Reservation.ReservationStatus;
import com.esprit.ms.reservation.entities.Reservation.ReservationType;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ReservationDTO {

    private Long id;

    @JsonProperty("customerId")
    private Long customerId;

    /** Keycloak sub — links the reservation to the authenticated user */
    @JsonProperty("keycloakId")
    private String keycloakId;

    @NotNull
    @JsonProperty("roomId")
    private Long roomId;

    @JsonProperty("hotelId")
    private Long hotelId;

    @NotNull
    @JsonProperty("checkInDate")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate checkInDate;

    @NotNull
    @JsonProperty("checkOutDate")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate checkOutDate;

    @NotNull
    @Positive
    @JsonProperty("numberOfGuests")
    private Integer numberOfGuests;

    @JsonProperty("specialRequests")
    private String specialRequests;

    @JsonProperty("reservationType")
    private ReservationType reservationType;

    @JsonProperty("status")
    private ReservationStatus status;

    @JsonProperty("cancelReason")
    private String cancelReason;

    @JsonProperty("totalPrice")
    private BigDecimal totalPrice;

    @JsonProperty("depositPaid")
    private BigDecimal depositPaid;

    /** Penalty computed at cancellation time based on the room's cancellation policy */
    @JsonProperty("cancellationPenalty")
    private BigDecimal cancellationPenalty;

    @JsonProperty("guestEmail")
    private String guestEmail;

    @JsonProperty("guestName")
    private String guestName;

    @JsonProperty("lastModifiedBy")
    private String lastModifiedBy;

    /** Enriched room details — populated from chambre-service, read-only on input */
    @JsonProperty("chambre")
    private ChambreDTO chambre;

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getKeycloakId() { return keycloakId; }
    public void setKeycloakId(String keycloakId) { this.keycloakId = keycloakId; }

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }

    public LocalDate getCheckInDate() { return checkInDate; }
    public void setCheckInDate(LocalDate checkInDate) { this.checkInDate = checkInDate; }

    public LocalDate getCheckOutDate() { return checkOutDate; }
    public void setCheckOutDate(LocalDate checkOutDate) { this.checkOutDate = checkOutDate; }

    public Integer getNumberOfGuests() { return numberOfGuests; }
    public void setNumberOfGuests(Integer numberOfGuests) { this.numberOfGuests = numberOfGuests; }

    public String getSpecialRequests() { return specialRequests; }
    public void setSpecialRequests(String specialRequests) { this.specialRequests = specialRequests; }

    public ReservationType getReservationType() { return reservationType; }
    public void setReservationType(ReservationType reservationType) { this.reservationType = reservationType; }

    public ReservationStatus getStatus() { return status; }
    public void setStatus(ReservationStatus status) { this.status = status; }

    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public BigDecimal getDepositPaid() { return depositPaid; }
    public void setDepositPaid(BigDecimal depositPaid) { this.depositPaid = depositPaid; }

    public BigDecimal getCancellationPenalty() { return cancellationPenalty; }
    public void setCancellationPenalty(BigDecimal cancellationPenalty) { this.cancellationPenalty = cancellationPenalty; }

    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }

    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }

    public String getLastModifiedBy() { return lastModifiedBy; }
    public void setLastModifiedBy(String lastModifiedBy) { this.lastModifiedBy = lastModifiedBy; }

    public ChambreDTO getChambre() { return chambre; }
    public void setChambre(ChambreDTO chambre) { this.chambre = chambre; }
}
