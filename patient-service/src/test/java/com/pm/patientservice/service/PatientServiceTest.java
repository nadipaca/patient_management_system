package com.pm.patientservice.service;

import com.pm.patientservice.dto.PatientRequestDTO;
import com.pm.patientservice.dto.PatientResponseDTO;
import com.pm.patientservice.exception.EmailAlreadyExistsException;
import com.pm.patientservice.exception.PatientNotFoundException;
import com.pm.patientservice.grpc.BillingServiceGrpcClient;
import com.pm.patientservice.kafka.kafkaProducer;
import com.pm.patientservice.model.Patient;
import com.pm.patientservice.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private BillingServiceGrpcClient billingServiceGrpcClient;

    @Mock
    private kafkaProducer kafkaProducer;

    @InjectMocks
    private PatientService patientService;

    private PatientRequestDTO validRequest;
    private Patient validPatient;

    @BeforeEach
    void setUp() {
        validRequest = new PatientRequestDTO();
        validRequest.setName("John Doe");
        validRequest.setEmail("john.doe@example.com");
        validRequest.setAddress("123 Main St");
        validRequest.setDateOfBirth("1990-01-15");
        validRequest.setRegisteredDate("2026-02-25");

        validPatient = new Patient();
        validPatient.setId(UUID.randomUUID());
        validPatient.setName("John Doe");
        validPatient.setEmail("john.doe@example.com");
        validPatient.setAddress("123 Main St");
        validPatient.setDateOfBirth(LocalDate.of(1990, 1, 15));
        validPatient.setRegisteredDate(LocalDate.of(2026, 2, 25));
    }

    @Test
    void createPatient_Success() {
        when(patientRepository.existsByEmail(validRequest.getEmail())).thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenReturn(validPatient);
        when(billingServiceGrpcClient.createBillingAccount(anyString(), anyString(), anyString(), anyString()))
            .thenReturn(null);
        doNothing().when(kafkaProducer).sendEvent(any(Patient.class));

        PatientResponseDTO response = patientService.createPatient(validRequest);

        assertNotNull(response);
        assertEquals(validPatient.getName(), response.getName());
        assertEquals(validPatient.getEmail(), response.getEmail());
        
        verify(patientRepository).existsByEmail(validRequest.getEmail());
        verify(patientRepository).save(any(Patient.class));
        verify(billingServiceGrpcClient).createBillingAccount(anyString(), anyString(), anyString(), anyString());
        verify(kafkaProducer).sendEvent(any(Patient.class));
    }

    @Test
    void createPatient_EmailExists_ThrowsException() {
        when(patientRepository.existsByEmail(validRequest.getEmail())).thenReturn(true);

        EmailAlreadyExistsException exception = assertThrows(
            EmailAlreadyExistsException.class,
            () -> patientService.createPatient(validRequest)
        );

        assertTrue(exception.getMessage().contains("Email already exists"));
        verify(patientRepository).existsByEmail(validRequest.getEmail());
        verify(patientRepository, never()).save(any(Patient.class));
    }

    @Test
    void updatePatient_Success() {
        UUID patientId = UUID.randomUUID();
        Patient existingPatient = new Patient();
        existingPatient.setId(patientId);
        existingPatient.setName("Old Name");
        existingPatient.setEmail("old.email@example.com");
        existingPatient.setAddress("Old Address");
        existingPatient.setDateOfBirth(LocalDate.of(1985, 5, 10));
        existingPatient.setRegisteredDate(LocalDate.now());

        when(patientRepository.findById(patientId)).thenReturn(Optional.of(existingPatient));
        when(patientRepository.existsByEmailAndIdNot(validRequest.getEmail(), patientId)).thenReturn(false);
        when(patientRepository.save(any(Patient.class))).thenReturn(existingPatient);

        PatientResponseDTO response = patientService.updatePatient(patientId, validRequest);

        assertNotNull(response);
        verify(patientRepository).findById(patientId);
        verify(patientRepository).existsByEmailAndIdNot(validRequest.getEmail(), patientId);
        verify(patientRepository).save(any(Patient.class));
    }

    @Test
    void updatePatient_NotFound_ThrowsException() {
        UUID patientId = UUID.randomUUID();
        when(patientRepository.findById(patientId)).thenReturn(Optional.empty());

        PatientNotFoundException exception = assertThrows(
            PatientNotFoundException.class,
            () -> patientService.updatePatient(patientId, validRequest)
        );

        assertTrue(exception.getMessage().contains("Patient not found"));
        verify(patientRepository).findById(patientId);
        verify(patientRepository, never()).save(any(Patient.class));
    }

    @Test
    void updatePatient_DuplicateEmail_ThrowsException() {
        UUID patientId = UUID.randomUUID();
        Patient existingPatient = new Patient();
        existingPatient.setId(patientId);
        existingPatient.setName("Existing Patient");
        existingPatient.setEmail("existing@example.com");

        when(patientRepository.findById(patientId)).thenReturn(Optional.of(existingPatient));
        when(patientRepository.existsByEmailAndIdNot(validRequest.getEmail(), patientId)).thenReturn(true);

        EmailAlreadyExistsException exception = assertThrows(
            EmailAlreadyExistsException.class,
            () -> patientService.updatePatient(patientId, validRequest)
        );

        assertTrue(exception.getMessage().contains("Email already exists"));
        verify(patientRepository).findById(patientId);
        verify(patientRepository).existsByEmailAndIdNot(validRequest.getEmail(), patientId);
        verify(patientRepository, never()).save(any(Patient.class));
    }

    @Test
    void deletePatient_Success() {
        UUID patientId = UUID.randomUUID();
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(validPatient));
        doNothing().when(patientRepository).delete(validPatient);

        assertDoesNotThrow(() -> patientService.deletePatient(patientId));

        verify(patientRepository).findById(patientId);
        verify(patientRepository).delete(validPatient);
    }

    @Test
    void deletePatient_NotFound_ThrowsException() {
        UUID patientId = UUID.randomUUID();
        when(patientRepository.findById(patientId)).thenReturn(Optional.empty());

        PatientNotFoundException exception = assertThrows(
            PatientNotFoundException.class,
            () -> patientService.deletePatient(patientId)
        );

        assertTrue(exception.getMessage().contains("Patient not found"));
        verify(patientRepository).findById(patientId);
        verify(patientRepository, never()).delete(any(Patient.class));
    }
}
