package com.pm.authservice.service;

import com.pm.authservice.dto.LoginRequestDTO;
import com.pm.authservice.model.User;
import com.pm.authservice.util.JwtUtil;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private LoginRequestDTO loginRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setPassword("$2a$10$hashedPassword");
        testUser.setRole("USER");

        loginRequest = new LoginRequestDTO();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");
    }

    @Test
    void authenticate_ValidCredentials_ReturnsToken() {
        when(userService.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPassword())).thenReturn(true);
        when(jwtUtil.generateToken(testUser.getEmail(), testUser.getRole())).thenReturn("mock.jwt.token");

        Optional<String> token = authService.authenticate(loginRequest);

        assertTrue(token.isPresent());
        assertEquals("mock.jwt.token", token.get());
        verify(userService).findByEmail(loginRequest.getEmail());
        verify(passwordEncoder).matches(loginRequest.getPassword(), testUser.getPassword());
        verify(jwtUtil).generateToken(testUser.getEmail(), testUser.getRole());
    }

    @Test
    void authenticate_InvalidPassword_ReturnsEmpty() {
        when(userService.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPassword())).thenReturn(false);

        Optional<String> token = authService.authenticate(loginRequest);

        assertFalse(token.isPresent());
        verify(userService).findByEmail(loginRequest.getEmail());
        verify(passwordEncoder).matches(loginRequest.getPassword(), testUser.getPassword());
        verify(jwtUtil, never()).generateToken(anyString(), anyString());
    }

    @Test
    void authenticate_UserNotFound_ReturnsEmpty() {
        when(userService.findByEmail(loginRequest.getEmail())).thenReturn(Optional.empty());

        Optional<String> token = authService.authenticate(loginRequest);

        assertFalse(token.isPresent());
        verify(userService).findByEmail(loginRequest.getEmail());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(jwtUtil, never()).generateToken(anyString(), anyString());
    }

    @Test
    void validateToken_Valid_ReturnsTrue() {
        String validToken = "valid.jwt.token";
        doNothing().when(jwtUtil).validateToken(validToken);

        boolean isValid = authService.validateToken(validToken);

        assertTrue(isValid);
        verify(jwtUtil).validateToken(validToken);
    }

    @Test
    void validateToken_Invalid_ReturnsFalse() {
        String invalidToken = "invalid.jwt.token";
        doThrow(new JwtException("Invalid token")).when(jwtUtil).validateToken(invalidToken);

        boolean isValid = authService.validateToken(invalidToken);

        assertFalse(isValid);
        verify(jwtUtil).validateToken(invalidToken);
    }
}
