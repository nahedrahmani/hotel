package tn.esprit.paymentservice.service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.paymentservice.dto.FactureDTO;
import tn.esprit.paymentservice.dto.LigneFactureDTO;
import tn.esprit.paymentservice.dto.PaiementDTO;
import tn.esprit.paymentservice.entity.Facture;
import tn.esprit.paymentservice.entity.LigneFacture;
import tn.esprit.paymentservice.entity.Paiement;
import tn.esprit.paymentservice.enums.StatutFacture;
import tn.esprit.paymentservice.enums.TypeFacture;
import tn.esprit.paymentservice.repository.FactureRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FactureService {

    private final FactureRepository factureRepository;

    public List<FactureDTO> getAll() {
        return factureRepository.findAll().stream().map(this::toDTO).toList();
    }

    public FactureDTO getById(Long id) {
        return toDTO(findOrThrow(id));
    }

    public List<FactureDTO> getByStatut(StatutFacture statut) {
        return factureRepository.findByStatut(statut).stream().map(this::toDTO).toList();
    }

    public List<FactureDTO> getByClient(Long clientId) {
        return factureRepository.findByClientId(clientId).stream().map(this::toDTO).toList();
    }

    public List<FactureDTO> getByReservation(Long reservationId) {
        return factureRepository.findByReservationId(reservationId).stream().map(this::toDTO).toList();
    }

    public List<FactureDTO> search(String query) {
        return factureRepository.search(query).stream().map(this::toDTO).toList();
    }

    public List<FactureDTO> getByPeriode(LocalDate debut, LocalDate fin) {
        return factureRepository.findByDateEmissionBetween(debut, fin).stream().map(this::toDTO).toList();
    }

    public FactureDTO create(FactureDTO dto) {
        String numero = genererNumero();
        Facture facture = Facture.builder()
                .numero(numero)
                .reservationId(dto.getReservationId())
                .clientId(dto.getClientId())
                .clientNom(dto.getClientNom())
                .clientEmail(dto.getClientEmail())
                .clientTelephone(dto.getClientTelephone())
                .clientAdresse(dto.getClientAdresse())
                .typeFacture(dto.getTypeFacture() != null ? dto.getTypeFacture() : TypeFacture.HEBERGEMENT)
                .dateEmission(dto.getDateEmission() != null ? dto.getDateEmission() : LocalDate.now())
                .dateEcheance(dto.getDateEcheance())
                .statut(StatutFacture.BROUILLON)
                .notes(dto.getNotes())
                .build();

        Facture saved = factureRepository.save(facture);

        if (dto.getLignes() != null) {
            for (LigneFactureDTO ligneDTO : dto.getLignes()) {
                LigneFacture ligne = LigneFacture.builder()
                        .facture(saved)
                        .description(ligneDTO.getDescription())
                        .quantite(ligneDTO.getQuantite())
                        .prixUnitaire(ligneDTO.getPrixUnitaire())
                        .tauxTva(ligneDTO.getTauxTva())
                        .prixTtc(ligneDTO.getPrixTtc())
                        .build();
                saved.getLignes().add(ligne);
            }
        }

        return toDTO(factureRepository.save(saved));
    }

    public FactureDTO update(Long id, FactureDTO dto) {
        Facture facture = findOrThrow(id);
        if (facture.getStatut() == StatutFacture.PAYEE || facture.getStatut() == StatutFacture.ANNULEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Impossible de modifier une facture payée ou annulée");
        }
        facture.setClientNom(dto.getClientNom());
        facture.setClientEmail(dto.getClientEmail());
        facture.setClientTelephone(dto.getClientTelephone());
        facture.setClientAdresse(dto.getClientAdresse());
        facture.setTypeFacture(dto.getTypeFacture());
        facture.setDateEcheance(dto.getDateEcheance());
        facture.setNotes(dto.getNotes());

        facture.getLignes().clear();
        if (dto.getLignes() != null) {
            for (LigneFactureDTO ligneDTO : dto.getLignes()) {
                LigneFacture ligne = LigneFacture.builder()
                        .facture(facture)
                        .description(ligneDTO.getDescription())
                        .quantite(ligneDTO.getQuantite())
                        .prixUnitaire(ligneDTO.getPrixUnitaire())
                        .tauxTva(ligneDTO.getTauxTva())
                        .prixTtc(ligneDTO.getPrixTtc())
                        .build();
                facture.getLignes().add(ligne);
            }
        }
        return toDTO(factureRepository.save(facture));
    }

    /** Adds an extra (minibar, room service) to the open stay invoice of a reservation. */
    public FactureDTO ajouterLigneSejour(Long reservationId, LigneFactureDTO dto) {
        Facture facture = factureRepository.findByReservationId(reservationId).stream()
                .filter(f -> f.getStatut() != StatutFacture.PAYEE && f.getStatut() != StatutFacture.ANNULEE)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "Aucune facture ouverte pour la réservation " + reservationId));
        facture.getLignes().add(LigneFacture.builder()
                .facture(facture)
                .description(dto.getDescription())
                .quantite(dto.getQuantite())
                .prixUnitaire(dto.getPrixUnitaire())
                .tauxTva(dto.getTauxTva())
                .prixTtc(dto.getPrixTtc())
                .build());
        factureRepository.save(facture);
        mettreAJourStatut(facture.getId());
        return toDTO(findOrThrow(facture.getId()));
    }

    public FactureDTO emettre(Long id) {
        Facture facture = findOrThrow(id);
        if (facture.getLignes().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible d'émettre une facture sans lignes");
        }
        if (facture.getStatut() != StatutFacture.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La facture a déjà été émise");
        }
        facture.setStatut(StatutFacture.EMISE);
        if (facture.getDateEcheance() == null) {
            facture.setDateEcheance(LocalDate.now().plusDays(30));
        } else if (facture.getDateEcheance().isBefore(LocalDate.now())) {
            // A stay invoice is due at check-in but issued at check-out: it cannot be late on issue
            facture.setDateEcheance(LocalDate.now());
        }
        factureRepository.save(facture);
        // Payments taken before issuing (a deposit) count straight away
        mettreAJourStatut(id);
        return toDTO(findOrThrow(id));
    }

    public FactureDTO annuler(Long id) {
        Facture facture = findOrThrow(id);
        if (facture.getStatut() == StatutFacture.PAYEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Impossible d'annuler une facture déjà payée");
        }
        facture.setStatut(StatutFacture.ANNULEE);
        return toDTO(factureRepository.save(facture));
    }

    public void mettreAJourStatut(Long id) {
        Facture facture = findOrThrow(id);
        if (facture.getStatut() == StatutFacture.ANNULEE || facture.getStatut() == StatutFacture.BROUILLON) return;

        java.math.BigDecimal restant = facture.getMontantRestant();
        java.math.BigDecimal total = facture.getTotalTTC();

        if (restant.compareTo(java.math.BigDecimal.ZERO) == 0) {
            facture.setStatut(StatutFacture.PAYEE);
        } else if (restant.compareTo(total) < 0) {
            facture.setStatut(StatutFacture.PARTIELLEMENT_PAYEE);
        } else if (facture.getDateEcheance() != null && LocalDate.now().isAfter(facture.getDateEcheance())) {
            facture.setStatut(StatutFacture.EN_RETARD);
        }
        factureRepository.save(facture);
    }

    public void delete(Long id) {
        Facture facture = findOrThrow(id);
        if (facture.getStatut() != StatutFacture.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seules les factures brouillon peuvent être supprimées");
        }
        factureRepository.deleteById(id);
    }

    private String genererNumero() {
        int annee = LocalDate.now().getYear();
        long count = factureRepository.count() + 1;
        return String.format("FAC-%d-%05d", annee, count);
    }

    private Facture findOrThrow(Long id) {
        return factureRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Facture introuvable: " + id));
    }

    public FactureDTO toDTO(Facture f) {
        List<LigneFactureDTO> lignes = f.getLignes().stream().map(l ->
                LigneFactureDTO.builder()
                        .id(l.getId()).description(l.getDescription())
                        .quantite(l.getQuantite()).prixUnitaire(l.getPrixUnitaire())
                        .tauxTva(l.getTauxTva()).prixTtc(l.getPrixTtc()).montantHT(l.getMontantHT())
                        .montantTva(l.getMontantTva()).montantTTC(l.getMontantTTC())
                        .build()
        ).collect(Collectors.toList());

        List<PaiementDTO> paiements = f.getPaiements().stream().map(p ->
                PaiementDTO.builder()
                        .id(p.getId()).factureId(f.getId())
                        .factureNumero(f.getNumero()).montant(p.getMontant())
                        .methodePaiement(p.getMethodePaiement()).statut(p.getStatut())
                        .reference(p.getReference()).datePaiement(p.getDatePaiement())
                        .note(p.getNote()).build()
        ).collect(Collectors.toList());

        return FactureDTO.builder()
                .id(f.getId()).numero(f.getNumero())
                .reservationId(f.getReservationId()).clientId(f.getClientId())
                .clientNom(f.getClientNom()).clientEmail(f.getClientEmail())
                .clientTelephone(f.getClientTelephone()).clientAdresse(f.getClientAdresse())
                .typeFacture(f.getTypeFacture()).dateEmission(f.getDateEmission())
                .dateEcheance(f.getDateEcheance()).lignes(lignes).paiements(paiements)
                .statut(f.getStatut()).notes(f.getNotes())
                .sousTotal(f.getSousTotal()).totalTva(f.getTotalTva())
                .totalTTC(f.getTotalTTC()).montantPaye(f.getMontantPaye())
                .montantRestant(f.getMontantRestant()).dateCreation(f.getDateCreation())
                .build();
    }
}
