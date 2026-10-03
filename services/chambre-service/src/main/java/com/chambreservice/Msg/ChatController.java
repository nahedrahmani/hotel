package com.chambreservice.Msg;


import com.chambreservice.configuration.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:5173}", allowCredentials = "true")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final CloudinaryService cloudinaryService;

    @MessageMapping("/chat")
    public void sendMessage(@Payload MessageDto messageDto) {
        if (messageDto.getChatId() == null || messageDto.getSenderId() == null || messageDto.getReceiverId() == null) {
            return;
        }

        UUID chatId;
        try {
            chatId = UUID.fromString(messageDto.getChatId());
        } catch (IllegalArgumentException e) {
            return;
        }

        Message savedMessage = chatService.saveMessage(chatId, messageDto);

        messagingTemplate.convertAndSend(
                "/topic/messages/" + messageDto.getReceiverId(),
                savedMessage
        );

        messagingTemplate.convertAndSend(
                "/topic/messages/" + messageDto.getSenderId(),
                savedMessage
        );
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public List<Chat> getUserChats(@PathVariable String userId,
                                    @AuthenticationPrincipal Jwt jwt) {
        String callerId = jwt.getSubject();
        if (!callerId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return chatService.getUserChats(userId);
    }

    @GetMapping("/{chatId}/messages")
    @PreAuthorize("isAuthenticated()")
    public List<Message> getChatMessages(@PathVariable UUID chatId,
                                          @AuthenticationPrincipal Jwt jwt) {
        String callerId = jwt.getSubject();
        List<Chat> callerChats = chatService.getUserChats(callerId);
        boolean isParticipant = callerChats.stream()
                .anyMatch(c -> c.getId().equals(chatId));
        if (!isParticipant) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return chatService.getChatMessages(chatId);
    }

    @PostMapping("/create")
    @PreAuthorize("isAuthenticated()")
    public Chat createChat(@RequestParam String senderId,
                            @RequestParam String recipientId,
                            @AuthenticationPrincipal Jwt jwt) {
        String callerId = jwt.getSubject();
        if (!callerId.equals(senderId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return chatService.getOrCreateChat(senderId, recipientId);
    }

    @PutMapping("/messages/{messageId}/read")
    @PreAuthorize("isAuthenticated()")
    public void markAsRead(@PathVariable Long messageId) {
        chatService.markMessageAsRead(messageId);
    }

    @PostMapping("/upload-media")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> uploadMedia(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String mediaUrl = cloudinaryService.uploadFile(file);

        Map<String, String> response = Map.of("mediaFilePath", mediaUrl);
        return ResponseEntity.ok(response);
    }
}
