package tn.esprit.paymentservice.konnect;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.paymentservice.dto.PaiementDTO;

import java.util.Map;

@RestController
@RequestMapping("/api/payment/konnect")
@RequiredArgsConstructor
@Slf4j
public class KonnectController {

    private final KonnectService konnectService;

    /** Whether guests can pay online, so the app only offers it when the keys are set. */
    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Boolean> status() {
        return Map.of("enabled", konnectService.isConfigured(), "simulation", konnectService.isSimulation());
    }

    /** Starts an online payment of an invoice's balance; the browser then goes to payUrl. */
    @PostMapping("/init")
    @PreAuthorize("isAuthenticated()")
    public KonnectService.KonnectPayment init(@RequestBody Map<String, Long> body) {
        return konnectService.initPayment(body.get("factureId"));
    }

    /** Called by the app when Konnect sends the guest back. */
    @PostMapping("/confirm")
    @PreAuthorize("isAuthenticated()")
    public PaiementDTO confirm(@RequestBody Map<String, String> body) {
        return konnectService.confirm(body.get("paymentRef"));
    }

    // Simulation mode only (demos): the app's stand-in for Konnect's payment page
    @GetMapping("/simulation/{paymentRef}")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> simulatedPayment(@PathVariable String paymentRef) {
        return konnectService.simulatedPayment(paymentRef);
    }

    @PostMapping("/simulation/{paymentRef}")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> finishSimulation(@PathVariable String paymentRef, @RequestBody Map<String, Boolean> body) {
        return konnectService.finishSimulation(paymentRef, Boolean.TRUE.equals(body.get("paid")));
    }

    // No login: Konnect's servers call this (GET ?payment_ref=…). The payment is checked with Konnect anyway.
    @GetMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestParam("payment_ref") String paymentRef) {
        try {
            konnectService.confirm(paymentRef);
        } catch (Exception e) {
            log.warn("Konnect webhook for {} not recorded: {}", paymentRef, e.getMessage());
        }
        return ResponseEntity.ok().build();
    }
}
