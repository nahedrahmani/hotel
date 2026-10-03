package tn.esprit.paymentservice.stripe;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateIntentRequest {
    @NotNull
    private Long factureId;

    @NotNull
    @Positive
    private BigDecimal montant;
}