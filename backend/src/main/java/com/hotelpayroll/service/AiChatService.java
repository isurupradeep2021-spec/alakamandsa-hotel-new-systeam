package com.hotelpayroll.service;

import com.hotelpayroll.dto.AiChatRequest;
import com.hotelpayroll.dto.AiChatResponse;

public interface AiChatService {
    AiChatResponse chat(AiChatRequest request, String username);
}
