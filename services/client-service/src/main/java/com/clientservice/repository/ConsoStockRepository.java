package com.clientservice.repository;

import com.clientservice.entity.ConsoStock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsoStockRepository extends JpaRepository<ConsoStock, Long> {
    List<ConsoStock> findByReservationId(Long reservationId);
    List<ConsoStock> findByChambreId(Long chambreId);
}
