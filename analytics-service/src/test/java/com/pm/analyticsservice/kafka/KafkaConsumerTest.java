package com.pm.analyticsservice.kafka;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import patient.events.PatientEvent;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class KafkaConsumerTest {

    @InjectMocks
    private KafkaConsumer kafkaConsumer;

    @Test
    void consumeEvent_ValidEvent_ProcessesSuccessfully() {
        PatientEvent event = PatientEvent.newBuilder()
                .setPatientId("12345-uuid")
                .setName("John Doe")
                .setEmail("john.doe@example.com")
                .setEventType("PATIENT_CREATED")
                .build();

        byte[] eventBytes = event.toByteArray();

        assertDoesNotThrow(() -> kafkaConsumer.consumeEvent(eventBytes));
    }

    @Test
    void consumeEvent_InvalidEvent_HandlesGracefully() {
        byte[] invalidBytes = "invalid-protobuf-data".getBytes();

        assertDoesNotThrow(() -> kafkaConsumer.consumeEvent(invalidBytes));
    }

    @Test
    void consumeEvent_EmptyEvent_HandlesGracefully() {
        byte[] emptyBytes = new byte[0];

        assertDoesNotThrow(() -> kafkaConsumer.consumeEvent(emptyBytes));
    }
}
