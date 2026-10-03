package tn.esprit.paymentservice.stripe;

import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment/stripe")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class StripeController {

    private final StripeService stripeService;

    @PostMapping("/create-intent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createIntent(@Valid @RequestBody CreateIntentRequest req) {
        try {
            CreateIntentResponse response = stripeService.createPaymentIntent(
                    req.getFactureId(), req.getMontant());
            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            log.error("Stripe error creating intent: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Erreur Stripe: " + e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // No @PreAuthorize — SecurityConfig grants permitAll() for this endpoint.
    // Stripe's servers POST here with a signed payload; they cannot send a JWT.
    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            stripeService.handleWebhook(payload, sigHeader);
            return ResponseEntity.ok("received");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
