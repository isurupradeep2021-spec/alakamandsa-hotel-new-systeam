package com.hotelpayroll.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AiChatMessage {
    @NotBlank
    private String role;

    @NotBlank
    private String content;
}
