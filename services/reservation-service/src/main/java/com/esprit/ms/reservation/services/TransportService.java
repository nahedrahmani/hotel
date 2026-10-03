package com.esprit.ms.reservation.services;

import com.esprit.ms.reservation.entities.Transport;
import com.esprit.ms.reservation.repositories.TransportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class TransportService {

    @Autowired
    private TransportRepository transportRepository;

    // Ajouter un transport
    public Transport createTransport(Transport transport) {
        return transportRepository.save(transport);
    }

    // Lister tous les transports
    public List<Transport> getAllTransports() {
        return transportRepository.findAll();
    }

    // Récupérer un transport par ID
    public Optional<Transport> getTransportById(Long id) {
        return transportRepository.findById(id);
    }

    // Mettre à jour un transport
    public Transport updateTransport(Long id, Transport transportDetails) {
        Transport transport = transportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transport non trouvé avec id : " + id));

        transport.setTypeVehicule(transportDetails.getTypeVehicule());
        transport.setChauffeurNom(transportDetails.getChauffeurNom());
        transport.setImmatriculation(transportDetails.getImmatriculation());
        transport.setCapacite(transportDetails.getCapacite());
        transport.setTarif(transportDetails.getTarif());
        transport.setPointDepart(transportDetails.getPointDepart());
        transport.setDestination(transportDetails.getDestination());
        transport.setDateDepart(transportDetails.getDateDepart());
        transport.setDateArrivee(transportDetails.getDateArrivee());
        transport.setStatut(transportDetails.getStatut());

        return transportRepository.save(transport);
    }

    public void deleteTransport(Long id) {
        if (!transportRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Transport non trouvé avec id : " + id);
        }
        transportRepository.deleteById(id);
    }
}
