package tn.esprit.paymentservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Brings databases created by older versions up to date. Hibernate's "update" adds tables and
 * columns but never changes an existing column, and older versions stored the payment method as
 * a database enum that refuses any method added since (such as KONNECT).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SchemaUpgrade implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        Integer enumColumns = jdbc.queryForObject("""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'PAIEMENTS' AND COLUMN_NAME = 'METHODE_PAIEMENT' AND DATA_TYPE = 'ENUM'""",
                Integer.class);
        if (enumColumns != null && enumColumns > 0) {
            jdbc.execute("ALTER TABLE PAIEMENTS ALTER COLUMN METHODE_PAIEMENT VARCHAR(30)");
            log.info("Payment method column changed from a fixed list to text");
        }
    }
}
