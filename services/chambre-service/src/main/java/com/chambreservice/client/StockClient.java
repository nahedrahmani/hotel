package com.chambreservice.client;

import com.chambreservice.dto.ProduitDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@FeignClient(name = "stock-service")
public interface StockClient {

    @GetMapping("/api/stock/produits")
    List<ProduitDTO> getAllProduits();

    @GetMapping("/api/stock/produits/{id}")
    ProduitDTO getProduitById(@PathVariable Long id);

    @GetMapping("/api/stock/produits/categorie/{categorie}")
    List<ProduitDTO> getProduitsByCategorie(@PathVariable String categorie);

    @GetMapping("/api/stock/stats/valeur")
    Map<String, Double> getValeurTotale();
}
