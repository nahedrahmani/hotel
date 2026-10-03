package com.chambreservice.Msg;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final UserClient userClient;
    private final MessageRepository messageRepository;

    public List<Chat> getUserChats(String userId) {
        return chatRepository.findByUserId(userId);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Chat getOrCreateChat(String senderId, String recipientId) {
        return chatRepository.findBySenderAndRecipient(senderId, recipientId)
                .orElseGet(() -> {
                    Chat chat = new Chat();
                    chat.setSenderId(senderId);
                    chat.setRecipientId(recipientId);
                    return chatRepository.save(chat);
                });
    }

    public String getChatName(Chat chat, String currentUserId) {
        try {
            UserDto sender = userClient.getUserById(chat.getSenderId());
            UserDto recipient = userClient.getUserById(chat.getRecipientId());

            if (recipient.getId().equals(currentUserId)) {
                return sender.getFirstName() + " " + sender.getLastName();
            }
            return recipient.getFirstName() + " " + recipient.getLastName();
        } catch (Exception e) {
            return chat.getSenderId().equals(currentUserId)
                    ? chat.getRecipientId()
                    : chat.getSenderId();
        }
    }

    public Message saveMessage(UUID chatId, MessageDto dto) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found"));

        Message message = new Message();
        message.setChat(chat);
        message.setSenderId(dto.getSenderId());
        message.setReceiverId(dto.getReceiverId());
        message.setContent(dto.getContent());
        message.setType(dto.getType());
        message.setMediaFilePath(dto.getMediaFilePath());
        message.setState(MessageState.SENT);

        return messageRepository.save(message);
    }

    public List<Message> getChatMessages(UUID chatId) {
        return messageRepository.findByChatIdOrderByCreatedDateDesc(chatId);
    }

    public void markMessageAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setState(MessageState.SEEN);
        messageRepository.save(message);
    }
}
