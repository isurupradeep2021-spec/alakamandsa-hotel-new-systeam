package com.hotelpayroll.dto;

import com.hotelpayroll.entity.CuisineType;
import com.hotelpayroll.entity.MealService;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class MenuItemResponse {
    private Long id;
    private String name;
    private CuisineType cuisine;
    private BigDecimal price;
    private String description;
    private String badge;
    private MealService mealService;
    private String imageUrl;
    private Boolean available;
    private LocalDateTime createdAt;
}
