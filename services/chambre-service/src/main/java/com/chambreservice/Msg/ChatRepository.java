package com.chambreservice.Msg;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatRepository extends JpaRepository<Chat, UUID> {

    @Query("SELECT DISTINCT c FROM Chat c LEFT JOIN FETCH c.messages WHERE c.senderId = :userId OR c.recipientId = :userId ORDER BY c.createdDate DESC")
    List<Chat> findByUserId(@Param("userId") String userId);

    @Query("SELECT DISTINCT c FROM Chat c LEFT JOIN FETCH c.messages WHERE (c.senderId = :senderId AND c.recipientId = :recipientId) OR (c.senderId = :recipientId AND c.recipientId = :senderId)")
    Optional<Chat> findBySenderAndRecipient(@Param("senderId") String senderId, @Param("recipientId") String recipientId);
}
