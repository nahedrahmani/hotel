package com.esprit.ms.reservation.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE    = "hotel.reservations";
    public static final String QUEUE_EVENTS = "reservation.events";
    public static final String ROUTING_KEY  = "reservation.#";

    @Bean
    TopicExchange reservationExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    Queue reservationEventsQueue() {
        return QueueBuilder.durable(QUEUE_EVENTS).build();
    }

    @Bean
    Binding binding(Queue reservationEventsQueue, TopicExchange reservationExchange) {
        return BindingBuilder.bind(reservationEventsQueue).to(reservationExchange).with(ROUTING_KEY);
    }

    @Bean
    Jackson2JsonMessageConverter messageConverter() {
        ObjectMapper mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return new Jackson2JsonMessageConverter(mapper);
    }

    @Bean
    RabbitTemplate rabbitTemplate(ConnectionFactory cf, Jackson2JsonMessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(cf);
        template.setMessageConverter(converter);
        return template;
    }
}
