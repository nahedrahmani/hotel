package tn.esprit.paymentservice.konnect;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.paymentservice.dto.PaiementDTO;
import tn.esprit.paymentservice.entity.Facture;
import tn.esprit.paymentservice.enums.MethodePaiement;
import tn.esprit.paymentservice.enums.StatutFacture;
import tn.esprit.paymentservice.repository.FactureRepository;
import tn.esprit.paymentservice.service.PaiementService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Online payment through Konnect, a Tunisian gateway that charges in dinars (card, wallet, e-DINAR).
 * The guest pays on Konnect's page; an invoice is only marked paid after Konnect itself
 * confirms the payment, never on the word of the browser.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class KonnectService {

    /** Konnect amounts are in millimes. */
    private static final BigDecimal MILLIMES = BigDecimal.valueOf(1000);
    private static final String ORDER_PREFIX = "facture-";

    private final FactureRepository factureRepository;
    private final PaiementService paiementService;
    private final RestClient http = RestClient.create();

    @Value("${konnect.api-key:}")
    private String apiKey;

    @Value("${konnect.wallet-id:}")
    private String walletId;

    @Value("${konnect.base-url:https://api.sandbox.konnect.network/api/v2}")
    private String baseUrl;

    /** Where Konnect sends the guest back; it appends ?payment_ref=… */
    @Value("${konnect.return-url:http://localhost:5173/dashboard/mes-reservations}")
    private String returnUrl;

    /** Optional: a public URL Konnect can call once the payment is done (not reachable on localhost). */
    @Value("${konnect.webhook-url:}")
    private String webhookUrl;

    /** "live" talks to Konnect; "simulation" replaces Konnect's page by the app's own, for demos. */
    @Value("${konnect.mode:live}")
    private String mode;

    @Value("${konnect.simulation-url:http://localhost:5173/dashboard/paiement-simulation}")
    private String simulationUrl;

    /** Simulated payments, shaped like Konnect's answer; kept in memory only. */
    private final Map<String, Map<String, Object>> simulated = new ConcurrentHashMap<>();

    public boolean isSimulation() {
        return "simulation".equalsIgnoreCase(mode);
    }

    public boolean isConfigured() {
        return isSimulation() || (!apiKey.isBlank() && !walletId.isBlank());
    }

    public KonnectPayment initPayment(Long factureId) {
        if (!isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Le paiement en ligne n'est pas encore activé. Réglez à la réception.");
        }
        Facture facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facture introuvable"));
        if (facture.getStatut() == StatutFacture.PAYEE || facture.getStatut() == StatutFacture.ANNULEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette facture n'est plus à régler");
        }
        long millimes = facture.getMontantRestant().multiply(MILLIMES).setScale(0, RoundingMode.HALF_UP).longValue();
        if (millimes <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette facture est déjà réglée");
        }

        if (isSimulation()) {
            String ref = "SIM" + UUID.randomUUID().toString().replace("-", "");
            Map<String, Object> payment = new HashMap<>();
            payment.put("status", "pending");
            payment.put("amount", millimes);
            payment.put("orderId", ORDER_PREFIX + factureId);
            payment.put("description", "Facture " + facture.getNumero() + " - Royal Tulip Korbous Bay");
            simulated.put(ref, payment);
            log.info("Simulated payment {} created for facture {} ({} millimes)", ref, facture.getNumero(), millimes);
            return new KonnectPayment(simulationUrl + "?payment_ref=" + ref, ref);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("receiverWalletId", walletId);
        body.put("token", "TND");
        body.put("amount", millimes);
        body.put("type", "immediate");
        body.put("description", "Facture " + facture.getNumero() + " - Royal Tulip Korbous Bay");
        body.put("acceptedPaymentMethods", List.of("wallet", "bank_card", "e-DINAR"));
        body.put("lifespan", 30);
        body.put("orderId", ORDER_PREFIX + factureId);
        body.put("theme", "light");
        body.put("successUrl", returnUrl + "?paiement=ok");
        body.put("failUrl", returnUrl + "?paiement=echec");
        if (facture.getClientEmail() != null) body.put("email", facture.getClientEmail());
        if (!webhookUrl.isBlank()) body.put("webhook", webhookUrl);

        try {
            KonnectPayment created = http.post().uri(baseUrl + "/payments/init-payment")
                    .header("x-api-key", apiKey)
                    .body(body)
                    .retrieve()
                    .body(KonnectPayment.class);
            log.info("Konnect payment {} created for facture {} ({} millimes)", created.paymentRef(), facture.getNumero(), millimes);
            return created;
        } catch (RestClientException e) {
            log.error("Konnect init-payment failed for facture {}: {}", factureId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Le service de paiement ne répond pas. Réessayez dans un instant.");
        }
    }

    /**
     * Asks Konnect how a payment ended and records it on its invoice when it succeeded.
     * Safe to call several times (return page and webhook): the payment reference is unique.
     */
    @SuppressWarnings("unchecked")
    public PaiementDTO confirm(String paymentRef) {
        if (paymentRef == null || !paymentRef.matches("[A-Za-z0-9]{8,64}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Référence de paiement invalide");
        }
        Map<String, Object> payment = isSimulation() ? simulated.get(paymentRef) : null;
        if (payment == null) try {
            Map<String, Object> res = http.get().uri(baseUrl + "/payments/" + paymentRef)
                    .header("x-api-key", apiKey)
                    .retrieve()
                    .body(Map.class);
            payment = (Map<String, Object>) res.get("payment");
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Paiement introuvable chez Konnect");
        }
        if (!"completed".equals(payment.get("status"))) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Le paiement n'a pas abouti");
        }
        String orderId = String.valueOf(payment.get("orderId"));
        if (!orderId.startsWith(ORDER_PREFIX)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ce paiement ne concerne pas une facture de l'hôtel");
        }

        PaiementDTO dto = new PaiementDTO();
        dto.setFactureId(Long.parseLong(orderId.substring(ORDER_PREFIX.length())));
        // The amount Konnect received, never one sent by the browser
        dto.setMontant(new BigDecimal(String.valueOf(payment.get("amount"))).divide(MILLIMES, 3, RoundingMode.HALF_UP));
        dto.setMethodePaiement(MethodePaiement.KONNECT);
        dto.setReference(paymentRef);
        dto.setNote("Paiement en ligne Konnect");
        PaiementDTO saved = paiementService.enregistrer(dto);
        log.info("Konnect payment {} recorded on facture {}: {} DT", paymentRef, dto.getFactureId(), dto.getMontant());
        return saved;
    }

    /** What the simulated payment page shows. */
    public Map<String, Object> simulatedPayment(String paymentRef) {
        Map<String, Object> payment = isSimulation() ? simulated.get(paymentRef) : null;
        if (payment == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Paiement introuvable");
        return payment;
    }

    /** The simulated page's "Payer" or "Refuser"; returns where to send the guest, as Konnect would. */
    public Map<String, String> finishSimulation(String paymentRef, boolean paid) {
        Map<String, Object> payment = simulatedPayment(paymentRef);
        if (!"pending".equals(payment.get("status"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce paiement est déjà terminé");
        }
        payment.put("status", paid ? "completed" : "failed");
        return Map.of("redirectUrl", returnUrl + "?paiement=" + (paid ? "ok" : "echec") + "&payment_ref=" + paymentRef);
    }

    public record KonnectPayment(String payUrl, String paymentRef) {}
}
