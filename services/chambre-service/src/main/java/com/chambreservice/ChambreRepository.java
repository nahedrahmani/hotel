package com.chambreservice;


import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChambreRepository extends JpaRepository<Chambre, Long> {
    List<Chambre> findByStatut(String statut);
    List<Chambre> findByHotelId(Long hotelId);
    List<Chambre> findByStatutAndHotelId(String statut, Long hotelId);
}