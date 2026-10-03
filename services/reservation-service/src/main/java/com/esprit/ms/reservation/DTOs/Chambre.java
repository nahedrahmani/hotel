// src/main/java/com/reservationservice/client/Chambre.java
package com.esprit.ms.reservation.DTOs;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Chambre {
    private Long id;
    private String number;
    private String type;
    private Double price;
    private Integer capacity;
    private Boolean available;
    private List<String> amenities;
    private String image;
    private String description;

    // Constructors
    public Chambre() {}

    public Chambre(Long id, String number, String type, Double price, Integer capacity,
                   Boolean available, List<String> amenities, String image, String description) {
        this.id = id;
        this.number = number;
        this.type = type;
        this.price = price;
        this.capacity = capacity;
        this.available = available;
        this.amenities = amenities;
        this.image = image;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }

    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }

    public List<String> getAmenities() { return amenities; }
    public void setAmenities(List<String> amenities) { this.amenities = amenities; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}