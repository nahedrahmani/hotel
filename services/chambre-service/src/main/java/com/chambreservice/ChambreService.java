package com.chambreservice;

import com.chambreservice.configuration.CloudinaryService;
import com.chambreservice.service.StockIntegrationService;
import com.chambreservice.dto.ProduitDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChambreService {

    @Autowired
    private ChambreRepository chambreRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private StockIntegrationService stockIntegrationService;

    public List<Chambre> getAllChambres() {
        return chambreRepository.findAll();
    }

    public List<Chambre> getByHotelId(Long hotelId) {
        return chambreRepository.findByHotelId(hotelId);
    }

    public List<Chambre> getChambresANettoyer(Long hotelId) {
        return hotelId != null
                ? chambreRepository.findByStatutAndHotelId("à_nettoyer", hotelId)
                : chambreRepository.findByStatut("à_nettoyer");
    }

    public Chambre marquerPropre(Long id) {
        return updateStatut(id, "disponible");
    }

    public Chambre updatePolitique(Long id, java.util.Map<String, Object> body) {
        Chambre chambre = chambreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chambre not found with id " + id));
        if (body.containsKey("weekendMultiplier"))       chambre.setWeekendMultiplier(toDouble(body.get("weekendMultiplier")));
        if (body.containsKey("peakMonths"))              chambre.setPeakMonths((String) body.get("peakMonths"));
        if (body.containsKey("peakMultiplier"))          chambre.setPeakMultiplier(toDouble(body.get("peakMultiplier")));
        if (body.containsKey("cancellationPolicyHours")) chambre.setCancellationPolicyHours(toInt(body.get("cancellationPolicyHours")));
        if (body.containsKey("cancellationFeePercent"))  chambre.setCancellationFeePercent(toDouble(body.get("cancellationFeePercent")));
        if (body.containsKey("nonRefundableHours"))      chambre.setNonRefundableHours(toInt(body.get("nonRefundableHours")));
        return chambreRepository.save(chambre);
    }

    private Double  toDouble(Object v) { return (v == null || v.toString().isBlank()) ? null : Double.parseDouble(v.toString()); }
    private Integer toInt(Object v)    { return (v == null || v.toString().isBlank()) ? null : Integer.parseInt(v.toString()); }

    public Optional<Chambre> getChambreById(Long id) {
        return chambreRepository.findById(id);
    }

    public Chambre createChambre(Chambre chambre, MultipartFile photo) {
        if (photo != null && !photo.isEmpty()) {
            String imageUrl = cloudinaryService.uploadFile(photo);
            chambre.setPhoto(imageUrl);
        }
        return chambreRepository.save(chambre);
    }

    public Chambre updateChambre(Long id, Chambre chambreDetails, MultipartFile photo) {
        Chambre chambre = chambreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chambre not found with id " + id));

        chambre.setNumero(chambreDetails.getNumero());
        chambre.setType(chambreDetails.getType());
        chambre.setPrix(chambreDetails.getPrix());
        chambre.setCapacite(chambreDetails.getCapacite());
        chambre.setStatut(chambreDetails.getStatut());
        chambre.setDescription(chambreDetails.getDescription());
        chambre.setEtage(chambreDetails.getEtage());
        chambre.setBalcon(chambreDetails.getBalcon());
        chambre.setClimatisation(chambreDetails.getClimatisation());
        chambre.setTelevision(chambreDetails.getTelevision());
        chambre.setWifi(chambreDetails.getWifi());
        chambre.setMinibar(chambreDetails.getMinibar());
        chambre.setVueMer(chambreDetails.getVueMer());
        chambre.setSuperficie(chambreDetails.getSuperficie());
        if (chambreDetails.getHotelId() != null) chambre.setHotelId(chambreDetails.getHotelId());
        // Pricing and cancellation policy are owned by PATCH /{id}/politique; editing the
        // room's description must not reset them to null.

        if (photo != null && !photo.isEmpty()) {
            String imageUrl = cloudinaryService.uploadFile(photo);
            chambre.setPhoto(imageUrl);
        }

        return chambreRepository.save(chambre);
    }

    public Chambre updateStatut(Long id, String statut) {
        Chambre chambre = chambreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chambre not found with id " + id));
        chambre.setStatut(statut);
        return chambreRepository.save(chambre);
    }

    public void deleteChambre(Long id) {
        if (!chambreRepository.existsById(id)) {
            throw new RuntimeException("Chambre not found with id: " + id);
        }
        chambreRepository.deleteById(id);
    }

    public Chambre addProduitToChambre(Long chambreId, Long produitId) {
        Chambre chambre = chambreRepository.findById(chambreId)
                .orElseThrow(() -> new RuntimeException("Chambre not found"));

        ProduitDTO produit = stockIntegrationService.getProduitById(produitId);
        if (produit == null) {
            throw new RuntimeException("Produit not found with id: " + produitId);
        }

        if (chambre.getProduitIds() == null) {
            chambre.setProduitIds(new ArrayList<>());
        }
        if (!chambre.getProduitIds().contains(produitId)) {
            chambre.getProduitIds().add(produitId);
        }
        return chambreRepository.save(chambre);
    }

    public Chambre removeProduitFromChambre(Long chambreId, Long produitId) {
        Chambre chambre = chambreRepository.findById(chambreId)
                .orElseThrow(() -> new RuntimeException("Chambre not found"));
        if (chambre.getProduitIds() != null) {
            chambre.getProduitIds().remove(produitId);
        }
        return chambreRepository.save(chambre);
    }

    public List<ProduitDTO> getProduitsByChambre(Long chambreId) {
        Chambre chambre = chambreRepository.findById(chambreId)
                .orElseThrow(() -> new RuntimeException("Chambre not found"));
        if (chambre.getProduitIds() == null || chambre.getProduitIds().isEmpty()) {
            return new ArrayList<>();
        }
        return chambre.getProduitIds().stream()
                .map(stockIntegrationService::getProduitById)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
}
