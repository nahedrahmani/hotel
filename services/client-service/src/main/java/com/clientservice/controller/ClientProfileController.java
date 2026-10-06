package com.clientservice.controller;

import com.clientservice.entity.CheckInRecord;
import com.clientservice.entity.ClientDocument;
import com.clientservice.entity.ClientProfile;
import com.clientservice.service.ClientProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientProfileController {

    private final ClientProfileService profileService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<ClientProfile> getAll() {
        return profileService.getAll();
    }

    @GetMapping("/{keycloakId}")
    @PreAuthorize("isAuthenticated() and (#keycloakId == authentication.name or hasAnyRole('ADMIN','MANAGER','STAFF'))")
    public ClientProfile getByKeycloakId(@PathVariable String keycloakId, Authentication authentication) {
        // A guest who never filled in preferences still "has" a profile: an empty one, not a 404
        if (keycloakId.equals(authentication.getName())) {
            ClientProfile own = profileService.findByKeycloakId(keycloakId).orElseGet(() -> {
                ClientProfile empty = new ClientProfile();
                empty.setKeycloakId(keycloakId);
                return empty;
            });
            if (isFrontDesk(authentication)) return own;
            ClientProfile view = new ClientProfile();
            org.springframework.beans.BeanUtils.copyProperties(own, view);
            view.setNotes(null);
            return view;
        }
        ClientProfile profile = profileService.getByKeycloakId(keycloakId);
        // Internal staff notes are not shown to the guest. The entity is detached so the copy is not saved.
        if (!isFrontDesk(authentication)) {
            ClientProfile view = new ClientProfile();
            org.springframework.beans.BeanUtils.copyProperties(profile, view);
            view.setNotes(null);
            return view;
        }
        return profile;
    }

    @GetMapping("/{keycloakId}/history")
    @PreAuthorize("isAuthenticated() and (#keycloakId == authentication.name or hasAnyRole('ADMIN','MANAGER','STAFF'))")
    public List<CheckInRecord> getHistory(@PathVariable String keycloakId) {
        return profileService.getHistory(keycloakId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ClientProfile createOrUpdate(@RequestBody ClientProfile profile,
                                         @AuthenticationPrincipal Jwt jwt,
                                         Authentication authentication) {
        // Front-desk staff file profiles for the guest they name; a guest only ever for themselves
        if (!isFrontDesk(authentication) || profile.getKeycloakId() == null || profile.getKeycloakId().isBlank()) {
            profile.setKeycloakId(jwt.getSubject());
        }
        keepStaffNotes(profile, authentication);
        return profileService.createOrUpdate(profile);
    }

    @PutMapping("/{keycloakId}")
    @PreAuthorize("isAuthenticated()")
    public ClientProfile update(
            @PathVariable String keycloakId,
            @RequestBody ClientProfile profile,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {
        String callerId = jwt.getSubject();
        if (!keycloakId.equals(callerId) && !isFrontDesk(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        profile.setKeycloakId(keycloakId);
        keepStaffNotes(profile, authentication);
        return profileService.createOrUpdate(profile);
    }

    @DeleteMapping("/{keycloakId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String keycloakId) {
        profileService.delete(keycloakId);
        return ResponseEntity.noContent().build();
    }

    // ── Documents ──────────────────────────────────────────────────────────────

    @GetMapping("/{keycloakId}/documents")
    @PreAuthorize("isAuthenticated() and (#keycloakId == authentication.name or hasAnyRole('ADMIN','MANAGER','STAFF'))")
    public List<ClientDocument> getDocuments(@PathVariable String keycloakId) {
        return profileService.getDocuments(keycloakId);
    }

    @PostMapping(value = "/{keycloakId}/documents", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated() and (#keycloakId == authentication.name or hasAnyRole('ADMIN','MANAGER','STAFF'))")
    public ClientDocument uploadDocument(
            @PathVariable String keycloakId,
            @RequestParam("type") ClientDocument.DocumentType type,
            @RequestParam(value = "documentNumber", required = false) String documentNumber,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam("file") MultipartFile file) {
        return profileService.uploadDocument(keycloakId, type, documentNumber, expiryDate, file);
    }

    @DeleteMapping("/{keycloakId}/documents/{docId}")
    @PreAuthorize("isAuthenticated() and (#keycloakId == authentication.name or hasAnyRole('ADMIN','MANAGER','STAFF'))")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable String keycloakId,
            @PathVariable Long docId) {
        profileService.deleteDocument(keycloakId, docId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Notes are the staff's internal remarks about a guest: a guest saving their own
     * preferences must neither see them overwritten with nothing nor write them.
     */
    private void keepStaffNotes(ClientProfile profile, Authentication authentication) {
        if (isFrontDesk(authentication)) return;
        String existing = profileService.findByKeycloakId(profile.getKeycloakId())
                .map(ClientProfile::getNotes).orElse(null);
        profile.setNotes(existing);
    }

    /** Same roles that may already list and read every client profile. */
    private static boolean isFrontDesk(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));
    }
}
