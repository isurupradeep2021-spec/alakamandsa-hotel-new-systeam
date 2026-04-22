package com.hotelpayroll.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CuisineType cuisine;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false, length = 1000)
    private String description;

    private String badge;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MealService mealService;

    @Column(length = 255)
    private String imageFileName;

    @Column(nullable = false)
    @Builder.Default
    private Boolean available = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
