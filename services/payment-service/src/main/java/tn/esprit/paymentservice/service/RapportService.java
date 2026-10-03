package tn.esprit.paymentservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.paymentservice.dto.RapportDTO;
import tn.esprit.paymentservice.entity.Facture;
import tn.esprit.paymentservice.enums.StatutFacture;
import tn.esprit.paymentservice.enums.TypeFacture;
import tn.esprit.paymentservice.repository.FactureRepository;
import tn.esprit.paymentservice.repository.PaiementRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RapportService {

    private final FactureRepository factureRepository;
    private final PaiementRepository paiementRepository;

    public RapportDTO genererRapport(LocalDate debut, LocalDate fin) {
        LocalDateTime debutDT = debut.atStartOfDay();
        LocalDateTime finDT = fin.atTime(23, 59, 59);

        List<Facture> factures = factureRepository.findByDateEmissionBetween(debut, fin);

        long nombreFactures = factures.size();
        long nombrePayees = factures.stream().filter(f -> f.getStatut() == StatutFacture.PAYEE).count();
        long nombreImpayees = factures.stream().filter(f ->
                f.getStatut() == StatutFacture.EMISE ||
                f.getStatut() == StatutFacture.PARTIELLEMENT_PAYEE ||
                f.getStatut() == StatutFacture.EN_RETARD).count();
        long nombreEnRetard = factures.stream().filter(f -> f.getStatut() == StatutFacture.EN_RETARD).count();

        BigDecimal chiffreAffaires = paiementRepository.sumRevenuePeriode(debutDT, finDT);
        BigDecimal montantImpaye = factures.stream()
                .filter(f -> f.getStatut() != StatutFacture.ANNULEE && f.getStatut() != StatutFacture.PAYEE)
                .map(Facture::getMontantRestant)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTTC = factures.stream()
                .filter(f -> f.getStatut() != StatutFacture.ANNULEE)
                .map(Facture::getTotalTTC)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTva = factures.stream()
                .filter(f -> f.getStatut() != StatutFacture.ANNULEE)
                .map(Facture::getTotalTva)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalHT = totalTTC.subtract(totalTva);

        // Revenue par méthode de paiement
        Map<String, BigDecimal> revenueParMethode = new HashMap<>();
        List<Object[]> parMethode = paiementRepository.revenueParMethode(debutDT, finDT);
        for (Object[] row : parMethode) {
            revenueParMethode.put(row[0].toString(), (BigDecimal) row[1]);
        }

        // Revenue par type de facture
        Map<String, BigDecimal> revenueParType = factures.stream()
                .filter(f -> f.getStatut() != StatutFacture.ANNULEE)
                .collect(Collectors.groupingBy(
                        f -> f.getTypeFacture() != null ? f.getTypeFacture().name() : TypeFacture.DIVERS.name(),
                        Collectors.reducing(BigDecimal.ZERO, Facture::getMontantPaye, BigDecimal::add)
                ));

        // Revenue par mois (pour le graphique)
        Map<String, BigDecimal> revenueParMois = new TreeMap<>();
        DateTimeFormatter moisFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        factures.stream()
                .filter(f -> f.getStatut() != StatutFacture.ANNULEE && f.getDateEmission() != null)
                .forEach(f -> revenueParMois.merge(
                        f.getDateEmission().format(moisFmt),
                        f.getMontantPaye(),
                        BigDecimal::add
                ));

        return RapportDTO.builder()
                .periode(debut.toString() + " / " + fin.toString())
                .chiffreAffaires(chiffreAffaires)
                .totalTva(totalTva)
                .totalHT(totalHT)
                .nombreFactures(nombreFactures)
                .nombrePayees(nombrePayees)
                .nombreImpayees(nombreImpayees)
                .nombreEnRetard(nombreEnRetard)
                .montantImpaye(montantImpaye)
                .revenueParMethode(revenueParMethode)
                .revenueParType(revenueParType)
                .revenueParMois(revenueParMois)
                .build();
    }
}
