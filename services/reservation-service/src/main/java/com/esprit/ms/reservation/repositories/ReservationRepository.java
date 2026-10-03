package com.esprit.ms.reservation.repositories;

import com.esprit.ms.reservation.entities.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByCustomerId(Long customerId);
    List<Reservation> findByCustomerIdAndHotelId(Long customerId, Long hotelId);

    List<Reservation> findByKeycloakId(String keycloakId);
    List<Reservation> findByKeycloakIdAndHotelId(String keycloakId, Long hotelId);

    List<Reservation> findByHotelId(Long hotelId);

    List<Reservation> findByRoomIdOrderByCheckInDateDesc(Long roomId);

    @Query("SELECT r FROM Reservation r WHERE " +
            "(r.checkInDate BETWEEN :startDate AND :endDate OR " +
            "r.checkOutDate BETWEEN :startDate AND :endDate OR " +
            "(r.checkInDate <= :startDate AND r.checkOutDate >= :endDate))")
    List<Reservation> findByDateRange(@Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate);

    /** Today's expected arrivals */
    List<Reservation> findByCheckInDate(LocalDate date);

    /** Today's expected departures */
    List<Reservation> findByCheckOutDate(LocalDate date);

    /**
     * Overlap check — excludes CANCELLED and NO_SHOW so those reservations
     * do not block a room from being re-booked.
     */
    @Query("SELECT r FROM Reservation r WHERE r.roomId = :roomId " +
            "AND r.status NOT IN (com.esprit.ms.reservation.entities.Reservation.ReservationStatus.CANCELLED, " +
            "                     com.esprit.ms.reservation.entities.Reservation.ReservationStatus.NO_SHOW) " +
            "AND r.checkInDate < :newCheckOut " +
            "AND r.checkOutDate > :newCheckIn")
    List<Reservation> findOverlapping(
            @Param("roomId") Long roomId,
            @Param("newCheckIn") LocalDate newCheckIn,
            @Param("newCheckOut") LocalDate newCheckOut
    );

    @Query("SELECT r FROM Reservation r WHERE r.roomId = :roomId " +
            "AND r.id != :excludeId " +
            "AND r.status NOT IN (com.esprit.ms.reservation.entities.Reservation.ReservationStatus.CANCELLED, " +
            "                     com.esprit.ms.reservation.entities.Reservation.ReservationStatus.NO_SHOW) " +
            "AND r.checkInDate < :newCheckOut " +
            "AND r.checkOutDate > :newCheckIn")
    List<Reservation> findOverlappingExcluding(
            @Param("roomId") Long roomId,
            @Param("newCheckIn") LocalDate newCheckIn,
            @Param("newCheckOut") LocalDate newCheckOut,
            @Param("excludeId") Long excludeId
    );
}
