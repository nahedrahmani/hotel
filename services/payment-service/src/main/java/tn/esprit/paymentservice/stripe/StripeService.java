package tn.esprit.paymentservice.stripe;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.paymentservice.dto.PaiementDTO;
import tn.esprit.paymentservice.enums.MethodePaiement;
import tn.esprit.paymentservice.repository.FactureRepository;
import tn.esprit.paymentservice.service.PaiementService;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@Slf4j
public class StripeService {

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    // Invoices are in Tunisian dinars, so the charge must be too
    @Value("${stripe.currency:tnd}")
    private String currency;

    // Stripe amounts are in the currency's smallest unit; the dinar has 1000 millimes
    private static final java.util.Set<String> THREE_DECIMALS = java.util.Set.of("bhd", "jod", "kwd", "omr", "tnd");
    private static final java.util.Set<String> ZERO_DECIMALS = java.util.Set.of(
            "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf");

    private long unitsPerMajor() {
        String c = currency.toLowerCase();
        return THREE_DECIMALS.contains(c) ? 1000 : ZERO_DECIMALS.contains(c) ? 1 : 100;
    }

    /** False while the secret key is still the placeholder from .env.example. */
    public boolean isConfigured() {
        return secretKey != null && secretKey.startsWith("sk_") && !secretKey.contains("REPLACE");
    }

    private final FactureRepository factureRepository;
    private final PaiementService paiementService;

    public StripeService(FactureRepository factureRepository, PaiementService paiementService) {
        this.factureRepository = factureRepository;
        this.paiementService = paiementService;
    }

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
        log.info("Stripe initialized (mode: {})", secretKey.startsWith("sk_live") ? "LIVE" : "TEST");
    }

    public CreateIntentResponse createPaymentIntent(Long factureId, BigDecimal montant) throws StripeException {
        if (!isConfigured()) {
            throw new IllegalStateException("Le paiement en ligne n'est pas encore activé. Réglez à la réception.");
        }
        var facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new IllegalArgumentException("Facture introuvable: " + factureId));

        long amount = montant.multiply(BigDecimal.valueOf(unitsPerMajor()))
                .setScale(0, RoundingMode.HALF_UP).longValue();
        // Stripe requires three-decimal currency amounts to end in 0 (no single-millime charges)
        if (unitsPerMajor() == 1000) amount = Math.round(amount / 10.0) * 10;

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency(currency)
                .setDescription("Facture " + facture.getNumero() + " — " + facture.getClientNom())
                .putMetadata("factureId", factureId.toString())
                .putMetadata("factureNumero", facture.getNumero())
                .putMetadata("clientNom", facture.getClientNom())
                .addPaymentMethodType("card")
                .build();

        PaymentIntent intent = PaymentIntent.create(params);
        log.info("Stripe PaymentIntent created: {} for facture {} — {}{}",
                intent.getId(), factureId, montant, currency.toUpperCase());

        return new CreateIntentResponse(intent.getClientSecret(), intent.getId());
    }

    public void handleWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Invalid Stripe webhook signature: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid Stripe signature");
        }

        log.info("Stripe webhook received: {}", event.getType());

        switch (event.getType()) {
            case "payment_intent.succeeded" -> {
                PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject().orElseThrow();
                handlePaymentSucceeded(intent);
            }
            case "payment_intent.payment_failed" -> {
                PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject().orElseThrow();
                log.warn("Payment failed for intent {}: {}", intent.getId(),
                        intent.getLastPaymentError() != null ? intent.getLastPaymentError().getMessage() : "unknown");
            }
            default -> log.debug("Unhandled Stripe event type: {}", event.getType());
        }
    }

    private void handlePaymentSucceeded(PaymentIntent intent) {
        if (intent.getMetadata().get("factureId") == null) {
            log.warn("Stripe webhook: no factureId in metadata for intent {}", intent.getId());
            return;
        }
        PaiementDTO dto = toPaiement(intent, "Paiement Stripe confirmé automatiquement");
        try {
            paiementService.enregistrer(dto);
            log.info("Stripe payment recorded: {} DT for facture {}", dto.getMontant(), dto.getFactureId());
        } catch (Exception e) {
            log.error("Failed to record Stripe payment for facture {}: {}", dto.getFactureId(), e.getMessage());
        }
    }

    /**
     * Records a card payment reported by the browser, but only after confirming it with Stripe.
     * The amount and invoice come from the PaymentIntent itself, never from the request,
     * so a guest cannot mark an invoice as paid without actually paying it.
     */
    public PaiementDTO enregistrerPaiementVerifie(PaiementDTO demande) {
        if (demande.getReference() == null || !demande.getReference().startsWith("pi_")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Référence de paiement Stripe manquante");
        }
        PaymentIntent intent;
        try {
            intent = PaymentIntent.retrieve(demande.getReference());
        } catch (StripeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paiement Stripe introuvable");
        }
        if (!"succeeded".equals(intent.getStatus())) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Le paiement n'a pas abouti");
        }
        if (!String.valueOf(demande.getFactureId()).equals(intent.getMetadata().get("factureId"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ce paiement ne correspond pas à cette facture");
        }
        return paiementService.enregistrer(toPaiement(intent, "Paiement Stripe " + intent.getId()));
    }

    private PaiementDTO toPaiement(PaymentIntent intent, String note) {
        PaiementDTO dto = new PaiementDTO();
        dto.setFactureId(Long.parseLong(intent.getMetadata().get("factureId")));
        dto.setMontant(BigDecimal.valueOf(intent.getAmount()).divide(BigDecimal.valueOf(unitsPerMajor()), 3, RoundingMode.HALF_UP));
        dto.setMethodePaiement(MethodePaiement.CARTE_BANCAIRE);
        dto.setReference(intent.getId());
        dto.setNote(note);
        return dto;
    }
}