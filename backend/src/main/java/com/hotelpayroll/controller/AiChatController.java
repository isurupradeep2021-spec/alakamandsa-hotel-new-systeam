package com.hotelpayroll.controller;

import com.hotelpayroll.dto.AiChatRequest;
import com.hotelpayroll.dto.AiChatResponse;
import com.hotelpayroll.service.AiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/ask")
    public ResponseEntity<AiChatResponse> ask(@Valid @RequestBody AiChatRequest request,
                                              Authentication authentication) {
        return ResponseEntity.ok(aiChatService.chat(request, authentication.getName()));
    }
}
