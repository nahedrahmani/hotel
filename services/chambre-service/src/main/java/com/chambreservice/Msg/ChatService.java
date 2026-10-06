package com.chambreservice.Msg;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    /** Recipient id of the shared reception inbox, read by all staff. */
    public static final String RECEPTION = "reception";

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    public Optional<Chat> findChat(UUID chatId) {
        return chatRepository.findById(chatId);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Chat openGuestConversation(String guestId, String guestName) {
        Chat chat = chatRepository.findBySenderAndRecipient(guestId, RECEPTION).orElseGet(() -> {
            Chat c = new Chat();
            c.setSenderId(guestId);
            c.setRecipientId(RECEPTION);
            return c;
        });
        // Keep the name current so the inbox shows what the guest is called today
        chat.setGuestName(guestName);
        return chatRepository.save(chat);
    }

    public Optional<ConversationDto> guestConversation(String guestId) {
        return chatRepository.findBySenderAndRecipient(guestId, RECEPTION).map(c -> toConversation(c, guestId));
    }

    public List<ConversationDto> receptionConversations() {
        return chatRepository.findByUserId(RECEPTION).stream()
                .map(c -> toConversation(c, RECEPTION))
                .sorted(Comparator.comparing(ConversationDto::lastMessageAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private ConversationDto toConversation(Chat chat, String reader) {
        List<Message> messages = messageRepository.findByChatIdOrderByCreatedDateDesc(chat.getId());
        Message last = messages.isEmpty() ? null : messages.get(0);
        long unread = messages.stream()
                .filter(m -> reader.equals(m.getReceiverId()) && m.getState() != MessageState.SEEN)
                .count();
        LocalDateTime at = last != null ? last.getCreatedDate() : chat.getCreatedDate();
        return new ConversationDto(chat.getId(), chat.getSenderId(), chat.getGuestName(),
                last != null ? last.getContent() : null, at, unread);
    }

    public Message saveMessage(Chat chat, String senderId, String receiverId, String content) {
        Message message = new Message();
        message.setChat(chat);
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setContent(content);
        message.setType(MessageType.TEXT);
        message.setState(MessageState.SENT);
        return messageRepository.save(message);
    }

    public List<Message> getChatMessages(UUID chatId) {
        return messageRepository.findByChatIdOrderByCreatedDateDesc(chatId);
    }

    @Transactional
    public void markReceivedAsSeen(UUID chatId, String reader) {
        messageRepository.findByChatIdOrderByCreatedDateDesc(chatId).stream()
                .filter(m -> reader.equals(m.getReceiverId()) && m.getState() != MessageState.SEEN)
                .forEach(m -> m.setState(MessageState.SEEN));
    }
}
