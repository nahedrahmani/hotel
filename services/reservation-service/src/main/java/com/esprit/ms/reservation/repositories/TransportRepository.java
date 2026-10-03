package com.esprit.ms.reservation.repositories;

import com.esprit.ms.reservation.entities.Transport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportRepository extends JpaRepository<Transport, Long> {
}
