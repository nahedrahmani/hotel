package tn.esprit.paymentservice.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.paymentservice.dto.PaiementDTO;
import tn.esprit.paymentservice.entity.Facture;
import tn.esprit.paymentservice.entity.Paiement;
import tn.esprit.paymentservice.enums.StatutFacture;
import tn.esprit.paymentservice.enums.StatutPaiement;
import tn.esprit.paymentservice.repository.FactureRepository;
import tn.esprit.paymentservice.repository.PaiementRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final FactureRepository factureRepository;
    private final FactureService factureService;

    public List<PaiementDTO> getByFacture(Long factureId) {
        return paiementRepository.findByFactureId(factureId).stream().map(this::toDTO).toList();
    }

    public List<PaiementDTO> getAll() {
        return paiementRepository.findAll().stream().map(this::toDTO).toList();
    }

    public PaiementDTO enregistrer(PaiementDTO dto) {
        // Idempotency: Stripe webhooks can fire more than once for the same intent.
        // If a payment with this reference already exists, return it unchanged.
        if (dto.getReference() != null) {
            Optional<Paiement> existing = paiementRepository.findByReference(dto.getReference());
            if (existing.isPresent()) {
                return toDTO(existing.get());
            }
        }

        Facture facture = factureRepository.findById(dto.getFactureId())
                .orElseThrow(() -> new EntityNotFoundException("Facture introuvable: " + dto.getFactureId()));

        if (facture.getStatut() == StatutFacture.ANNULEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Impossible de payer une facture annulée");
        }
        if (facture.getStatut() == StatutFacture.PAYEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette facture est déjà entièrement payée");
        }
        if (dto.getMontant().compareTo(facture.getMontantRestant()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("Le montant (%.3f DT) dépasse le restant dû (%.3f DT)",
                            dto.getMontant(), facture.getMontantRestant()));
        }

        Paiement paiement = Paiement.builder()
                .facture(facture)
                .montant(dto.getMontant())
                .methodePaiement(dto.getMethodePaiement())
                .statut(StatutPaiement.CONFIRME)
                .reference(dto.getReference() != null ? dto.getReference() : genererReference(dto))
                .datePaiement(LocalDateTime.now())
                .note(dto.getNote())
                .build();

        paiementRepository.save(paiement);
        factureService.mettreAJourStatut(facture.getId());

        return toDTO(paiement);
    }

    public PaiementDTO rembourser(Long id) {
        Paiement paiement = paiementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Paiement introuvable: " + id));
        if (paiement.getStatut() != StatutPaiement.CONFIRME) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seuls les paiements confirmés peuvent être remboursés");
        }
        paiement.setStatut(StatutPaiement.REMBOURSE);
        paiementRepository.save(paiement);
        factureService.mettreAJourStatut(paiement.getFacture().getId());
        return toDTO(paiement);
    }

    private String genererReference(PaiementDTO dto) {
        String prefix = switch (dto.getMethodePaiement()) {
            case CARTE_BANCAIRE -> "CB";
            case PAYPAL -> "PP";
            case ESPECES -> "ESP";
            case VIREMENT_BANCAIRE -> "VIR";
            case CHEQUE -> "CHQ";
        };
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private PaiementDTO toDTO(Paiement p) {
        return PaiementDTO.builder()
                .id(p.getId()).factureId(p.getFacture().getId())
                .factureNumero(p.getFacture().getNumero())
                .montant(p.getMontant()).methodePaiement(p.getMethodePaiement())
                .statut(p.getStatut()).reference(p.getReference())
                .datePaiement(p.getDatePaiement()).note(p.getNote())
                .build();
    }
}
