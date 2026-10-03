package com.chambreservice;

import com.chambreservice.Reclamation;

import com.chambreservice.Msg.UserClient;
import com.chambreservice.Msg.UserDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReclamationService {

    @Autowired
    private ReclamationRepository reclamationRepository;

    @Autowired
    private UserClient userClient;

    public List<Reclamation> getAllReclamations() {
        return reclamationRepository.findAll();
    }

    public Optional<Reclamation> getReclamationById(Long id) {
        return reclamationRepository.findById(id);
    }

    public List<Reclamation> getReclamationsByChambre(Long chambreId) {
        return reclamationRepository.findByChambreId(chambreId);
    }

    public Reclamation createReclamation(Reclamation reclamation) {
        UserDto user;
        try {
            user = userClient.getUserById(reclamation.getUserId());
        } catch (Exception e) {
            throw new RuntimeException("User service unavailable or user not found with ID: " + reclamation.getUserId());
        }
        if (user == null) {
            throw new RuntimeException("User not found with ID: " + reclamation.getUserId());
        }

        reclamation.setDateCreation(java.time.LocalDateTime.now());
        reclamation.setStatut("ouverte");
        return reclamationRepository.save(reclamation);
    }

    public Reclamation updateReclamation(Long id, Reclamation reclamationDetails) {
        Reclamation reclamation = reclamationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reclamation not found with id " + id));

        reclamation.setSujet(reclamationDetails.getSujet());
        reclamation.setDescription(reclamationDetails.getDescription());
        reclamation.setStatut(reclamationDetails.getStatut());
        reclamation.setChambre(reclamationDetails.getChambre());

        if (reclamationDetails.getUserId() != null) {
            try {
                UserDto updatedUser = userClient.getUserById(reclamationDetails.getUserId());
                if (updatedUser == null) {
                    throw new RuntimeException("User not found with ID: " + reclamationDetails.getUserId());
                }
            } catch (RuntimeException e) {
                throw e;
            } catch (Exception e) {
                throw new RuntimeException("User service unavailable or user not found with ID: " + reclamationDetails.getUserId());
            }
            reclamation.setUserId(reclamationDetails.getUserId());
        }

        return reclamationRepository.save(reclamation);
    }

    public void deleteReclamation(Long id) {
        if (!reclamationRepository.existsById(id)) {
            throw new RuntimeException("Reclamation not found with id: " + id);
        }
        reclamationRepository.deleteById(id);
    }
}
