package com.chambreservice.Msg;

import java.time.LocalDateTime;
import java.util.UUID;

/** A guest's conversation with the reception, as listed in the inbox. */
public record ConversationDto(
        UUID id,
        String guestId,
        String guestName,
        String lastMessage,
        LocalDateTime lastMessageAt,
        long unread
) {}
