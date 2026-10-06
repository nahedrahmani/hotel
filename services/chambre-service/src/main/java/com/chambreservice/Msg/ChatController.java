package com.chambreservice.Msg;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Guest ↔ reception messaging. A guest has one conversation with the shared "reception"
 * inbox; every staff member can read it and replies as the reception. The sender of a
 * message is always taken from the token, never from the request.
 */
@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private static final Set<String> STAFF = Set.of("ROLE_ADMIN", "ROLE_MANAGER", "ROLE_STAFF");

    private final ChatService chatService;

    private static boolean isStaff(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> STAFF.contains(a.getAuthority()));
    }

    /** Staff inbox: every guest conversation with the reception, most recent first. */
    @GetMapping("/reception")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public List<ConversationDto> receptionInbox() {
        return chatService.receptionConversations();
    }

    /** The calling guest's conversation with the reception (204 when they never wrote). */
    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ConversationDto> mine(@AuthenticationPrincipal Jwt jwt) {
        return chatService.guestConversation(jwt.getSubject())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{chatId}/messages")
    @PreAuthorize("isAuthenticated()")
    public List<Message> messages(@PathVariable UUID chatId, @AuthenticationPrincipal Jwt jwt, Authentication auth) {
        return chatService.getChatMessages(requireAccess(chatId, jwt, auth).getId());
    }

    /**
     * Sends a message. A guest writes in their own conversation (created on the first
     * message); staff answer in a reception conversation as "reception".
     */
    @PostMapping("/messages")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    public Message send(@RequestBody Map<String, String> body, @AuthenticationPrincipal Jwt jwt, Authentication auth) {
        String content = body.getOrDefault("content", "").trim();
        if (content.isEmpty() || content.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le message doit contenir entre 1 et 2000 caractères.");
        }
        String chatId = body.get("chatId");
        if (chatId == null) {
            // A guest's first message opens their conversation with the reception
            String name = jwt.getClaimAsString("name");
            Chat chat = chatService.openGuestConversation(jwt.getSubject(), name != null ? name : jwt.getClaimAsString("preferred_username"));
            return chatService.saveMessage(chat, jwt.getSubject(), ChatService.RECEPTION, content);
        }
        Chat chat = requireAccess(UUID.fromString(chatId), jwt, auth);
        boolean asReception = !chat.getSenderId().equals(jwt.getSubject());
        return asReception
                ? chatService.saveMessage(chat, ChatService.RECEPTION, chat.getSenderId(), content)
                : chatService.saveMessage(chat, jwt.getSubject(), ChatService.RECEPTION, content);
    }

    /** Marks as seen the messages the caller's side received in this conversation. */
    @PutMapping("/{chatId}/read")
    @PreAuthorize("isAuthenticated()")
    public void markRead(@PathVariable UUID chatId, @AuthenticationPrincipal Jwt jwt, Authentication auth) {
        Chat chat = requireAccess(chatId, jwt, auth);
        String reader = chat.getSenderId().equals(jwt.getSubject()) ? jwt.getSubject() : ChatService.RECEPTION;
        chatService.markReceivedAsSeen(chat.getId(), reader);
    }

    /** The guest who owns the conversation, or any staff member for a reception conversation. */
    private Chat requireAccess(UUID chatId, Jwt jwt, Authentication auth) {
        Chat chat = chatService.findChat(chatId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation introuvable"));
        boolean owner = chat.getSenderId().equals(jwt.getSubject());
        boolean reception = ChatService.RECEPTION.equals(chat.getRecipientId()) && isStaff(auth);
        if (!owner && !reception) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        return chat;
    }
}
