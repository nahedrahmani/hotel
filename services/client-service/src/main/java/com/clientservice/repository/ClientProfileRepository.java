package com.clientservice.repository;

import com.clientservice.entity.ClientProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClientProfileRepository extends JpaRepository<ClientProfile, Long> {
    Optional<ClientProfile> findByKeycloakId(String keycloakId);
    boolean existsByKeycloakId(String keycloakId);
}
