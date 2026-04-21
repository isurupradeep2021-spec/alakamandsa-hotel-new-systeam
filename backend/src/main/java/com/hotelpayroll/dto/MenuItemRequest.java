package com.hotelpayroll.dto;

import com.hotelpayroll.entity.CuisineType;
import com.hotelpayroll.entity.MealService;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MenuItemRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 120, message = "Name must be between 2 and 120 characters")
    private String name;

    @NotNull(message = "Cuisine is required")
    private CuisineType cuisine;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Price format is invalid")
    private BigDecimal price;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;

    @Size(max = 100, message = "Badge cannot exceed 100 characters")
    @Pattern(
            regexp = "^[A-Za-z0-9 .,'&()/+-]*$",
            message = "Badge contains unsupported characters"
    )
    private String badge;

    @NotNull(message = "Meal service is required")
    private MealService mealService;

    @NotNull(message = "Availability is required")
    private Boolean available;
}
