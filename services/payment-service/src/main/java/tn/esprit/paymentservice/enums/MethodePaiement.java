package tn.esprit.paymentservice.enums;

public enum MethodePaiement {
    CARTE_BANCAIRE,
    PAYPAL,
    ESPECES,
    VIREMENT_BANCAIRE,
    CHEQUE,
    /** Online through the Konnect gateway (card, wallet, e-DINAR) */
    KONNECT
}
