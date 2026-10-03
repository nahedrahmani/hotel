package tn.esprit.paymentservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tn.esprit.paymentservice.dto.PaiementDTO;
import tn.esprit.paymentservice.service.PaiementService;
import tn.esprit.paymentservice.stripe.StripeService;

import java.util.List;

@RestController
@RequestMapping("/api/payment/paiements")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}")
public class PaiementController {

    private final PaiementService paiementService;
    private final StripeService stripeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<PaiementDTO> getAll() {
        return paiementService.getAll();
    }

    @GetMapping("/facture/{factureId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<PaiementDTO> getByFacture(@PathVariable Long factureId) {
        return paiementService.getByFacture(factureId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public PaiementDTO enregistrer(@Valid @RequestBody PaiementDTO dto, Authentication authentication) {
        boolean staff = authentication.getAuthorities().stream()
                .anyMatch(a -> List.of("ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF").contains(a.getAuthority()));
        // Staff record cash/transfer payments at the desk; guests only through a verified Stripe payment
        return staff ? paiementService.enregistrer(dto) : stripeService.enregistrerPaiementVerifie(dto);
    }

    @PatchMapping("/{id}/rembourser")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public PaiementDTO rembourser(@PathVariable Long id) {
        return paiementService.rembourser(id);
    }
}
