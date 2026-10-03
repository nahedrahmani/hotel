package com.clientservice.repository;

import com.clientservice.entity.CheckInRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CheckInRecordRepository extends JpaRepository<CheckInRecord, Long> {
    List<CheckInRecord> findByReservationIdOrderByActualTimeDesc(Long reservationId);
    List<CheckInRecord> findByKeycloakIdOrderByActualTimeDesc(String keycloakId);
    Optional<CheckInRecord> findTopByReservationIdAndTypeOrderByActualTimeDesc(
            Long reservationId, CheckInRecord.RecordType type);
}
