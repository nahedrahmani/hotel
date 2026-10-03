package com.clientservice.service;

import com.clientservice.entity.CheckInRecord;
import com.clientservice.entity.ClientDocument;
import com.clientservice.entity.ClientProfile;
import com.clientservice.repository.CheckInRecordRepository;
import com.clientservice.repository.ClientDocumentRepository;
import com.clientservice.repository.ClientProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientProfileService {

    private final ClientProfileRepository profileRepository;
    private final ClientDocumentRepository documentRepository;
    private final CheckInRecordRepository checkInRecordRepository;
    private final CloudinaryService cloudinaryService;

    public List<ClientProfile> getAll() {
        return profileRepository.findAll();
    }

    public ClientProfile getByKeycloakId(String keycloakId) {
        return profileRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found: " + keycloakId));
    }

    public ClientProfile createOrUpdate(ClientProfile incoming) {
        return profileRepository.findByKeycloakId(incoming.getKeycloakId())
                .map(existing -> {
                    existing.setFirstName(incoming.getFirstName());
                    existing.setLastName(incoming.getLastName());
                    existing.setEmail(incoming.getEmail());
                    existing.setPhone(incoming.getPhone());
                    existing.setNationality(incoming.getNationality());
                    existing.setLanguage(incoming.getLanguage());
                    existing.setBedType(incoming.getBedType());
                    existing.setPreferredFloor(incoming.getPreferredFloor());
                    existing.setSmokingRoom(incoming.getSmokingRoom());
                    existing.setSpecialRequests(incoming.getSpecialRequests());
                    existing.setNotes(incoming.getNotes());
                    return profileRepository.save(existing);
                })
                .orElseGet(() -> profileRepository.save(incoming));
    }

    @Transactional
    public void delete(String keycloakId) {
        ClientProfile profile = getByKeycloakId(keycloakId);
        documentRepository.deleteByKeycloakId(keycloakId);
        profileRepository.delete(profile);
    }

    // ── Documents ──────────────────────────────────────────────────────────────

    public List<ClientDocument> getDocuments(String keycloakId) {
        return documentRepository.findByKeycloakId(keycloakId);
    }

    public ClientDocument uploadDocument(String keycloakId,
                                         ClientDocument.DocumentType type,
                                         String documentNumber,
                                         String expiryDateStr,
                                         MultipartFile file) {
        String url = cloudinaryService.uploadFile(file);
        ClientDocument doc = ClientDocument.builder()
                .keycloakId(keycloakId)
                .type(type)
                .documentNumber(documentNumber)
                .expiryDate(expiryDateStr != null && !expiryDateStr.isBlank()
                        ? LocalDate.parse(expiryDateStr) : null)
                .cloudinaryUrl(url)
                .build();
        return documentRepository.save(doc);
    }

    public void deleteDocument(String keycloakId, Long docId) {
        ClientDocument doc = documentRepository.findById(docId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
        if (!doc.getKeycloakId().equals(keycloakId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Document does not belong to this client");
        }
        documentRepository.delete(doc);
    }

    // ── Stay history ───────────────────────────────────────────────────────────

    public List<CheckInRecord> getHistory(String keycloakId) {
        return checkInRecordRepository.findByKeycloakIdOrderByActualTimeDesc(keycloakId);
    }
}
