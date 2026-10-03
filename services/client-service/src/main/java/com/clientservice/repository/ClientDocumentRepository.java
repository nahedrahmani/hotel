package com.clientservice.repository;

import com.clientservice.entity.ClientDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClientDocumentRepository extends JpaRepository<ClientDocument, Long> {
    List<ClientDocument> findByKeycloakId(String keycloakId);
    void deleteByKeycloakId(String keycloakId);
}
