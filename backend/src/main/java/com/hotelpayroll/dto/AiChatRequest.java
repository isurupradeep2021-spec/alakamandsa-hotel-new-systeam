package com.hotelpayroll.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AiChatRequest {
    @NotBlank
    private String message;

    private String module;

    @Valid
    private List<AiChatMessage> history = new ArrayList<>();
}
