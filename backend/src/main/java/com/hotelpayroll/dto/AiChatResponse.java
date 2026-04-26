package com.hotelpayroll.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class AiChatResponse {
    String answer;
    List<String> modules;
    String provider;
    String model;
    boolean configured;
}
