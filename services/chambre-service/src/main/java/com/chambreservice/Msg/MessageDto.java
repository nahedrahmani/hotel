package com.chambreservice.Msg;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageDto {
    private String chatId;
    private String senderId;
    private String receiverId;
    private String content;
    private MessageType type;
    private String mediaFilePath;
    private LocalDateTime createdDate; // Fixed typo: was CreatedDate
}