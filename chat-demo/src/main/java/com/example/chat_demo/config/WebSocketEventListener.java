package com.example.chat_demo.config;

import com.example.chat_demo.chat.ChatMessage;
import com.example.chat_demo.chat.MessageType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener  {

    private final SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        log.info("Received a new WebSocket connection");

        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        if (headerAccessor.getSessionAttributes() != null) {
            String username = (String) headerAccessor.getSessionAttributes().get("username");

            if (username != null) {
                log.info("User connected: {}", username);

                var chatMessage = ChatMessage.builder()
                        .sender(username)
                        .type(MessageType.JOIN)
                        .build();
                messagingTemplate.convertAndSend("/topic/public", chatMessage);
            } else {
                log.warn("Username not found in session attributes");
            }
        } else {
            log.warn("Session attributes are null");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        log.info("A WebSocket session has been disconnected");

        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        if (headerAccessor.getSessionAttributes() != null) {
            String username = (String) headerAccessor.getSessionAttributes().get("username");

            if (username != null) {
                log.info("User disconnected: {}", username);

                var chatMessage = ChatMessage.builder()
                        .sender(username)
                        .type(MessageType.LEAVE)
                        .build();
                messagingTemplate.convertAndSend("/topic/public", chatMessage);
            }
        } else {
            log.warn("Session attributes are null during disconnection");
        }
    }

}
