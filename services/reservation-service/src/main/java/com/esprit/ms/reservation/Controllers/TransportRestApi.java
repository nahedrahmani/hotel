package com.esprit.ms.reservation.Controllers;

import com.esprit.ms.reservation.entities.Transport;
import com.esprit.ms.reservation.services.TransportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transports")
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class TransportRestApi {

    @Autowired
    private TransportService transportService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public Transport createTransport(@Valid @RequestBody Transport transport) {
        return transportService.createTransport(transport);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<Transport> getAllTransports() {
        return transportService.getAllTransports();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<Transport> getTransportById(@PathVariable Long id) {
        return transportService.getTransportById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Transport updateTransport(@PathVariable Long id, @Valid @RequestBody Transport transportDetails) {
        return transportService.updateTransport(id, transportDetails);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteTransport(@PathVariable Long id) {
        transportService.deleteTransport(id);
        return ResponseEntity.noContent().build();
    }
}
