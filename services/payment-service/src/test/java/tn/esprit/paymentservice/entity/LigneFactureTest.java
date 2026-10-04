package tn.esprit.paymentservice.entity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LigneFactureTest {

    private static LigneFacture ligne(String prix, boolean ttc) {
        return LigneFacture.builder().description("Séjour").quantite(1)
                .prixUnitaire(new BigDecimal(prix)).tauxTva(BigDecimal.valueOf(19)).prixTtc(ttc).build();
    }

    @Test
    void ttcLineTotalIsExactlyTheQuotedPriceForEveryAmountUpTo5000Dinars() {
        for (int halves = 2; halves <= 10_000; halves++) {
            String quoted = BigDecimal.valueOf(halves).divide(BigDecimal.valueOf(2), 3, RoundingMode.UNNECESSARY).toPlainString();
            LigneFacture l = ligne(quoted, true);
            assertEquals(0, l.getMontantTTC().compareTo(new BigDecimal(quoted)), "TTC for " + quoted);
            assertEquals(0, l.getMontantHT().add(l.getMontantTva()).compareTo(l.getMontantTTC()), "HT + TVA for " + quoted);
        }
    }

    @Test
    void ttcLineSplitsAStayPrice() {
        LigneFacture l = ligne("960.000", true);
        assertEquals(new BigDecimal("806.723"), l.getMontantHT());
        assertEquals(new BigDecimal("153.277"), l.getMontantTva());
        assertEquals(new BigDecimal("960.000"), l.getMontantTTC());
    }

    @Test
    void htLinesAreUnchanged() {
        LigneFacture l = ligne("100.000", false);
        assertEquals(new BigDecimal("100.000"), l.getMontantHT());
        assertEquals(new BigDecimal("19.000"), l.getMontantTva());
        assertEquals(new BigDecimal("119.000"), l.getMontantTTC());
    }
}
