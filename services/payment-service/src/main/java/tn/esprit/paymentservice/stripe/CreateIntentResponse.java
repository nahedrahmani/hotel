package tn.esprit.paymentservice.stripe;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreateIntentResponse {
    private String clientSecret;
    private String paymentIntentId;
}