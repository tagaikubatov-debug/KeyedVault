package com.example.Assets.service;

import com.example.Assets.auth.AuthorIdGenerator;
import com.example.Assets.auth.CustomUserDetails;
import com.example.Assets.auth.JwtService;
import com.example.Assets.auth.dto.AuthResponse;
import com.example.Assets.auth.dto.LoginRequest;
import com.example.Assets.auth.dto.RegisterRequest;
import com.example.Assets.auth.dto.UserProfileResponse;
import com.example.Assets.model.User;
import com.example.Assets.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        String username = request.getUsername().toLowerCase().trim();

        // Проверяем уникальность email
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Проверяем уникальность username (не забудь добавить этот метод в UserRepository)
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken");
        }

        // Проверяем совпадение паролей перед сохранением
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        String authorId = AuthorIdGenerator.generate(request.getDisplayName(), email);

        // Используем обновленный конструктор User со всеми полями из формы
        User user = new User(
                email,
                username,
                passwordEncoder.encode(request.getPassword()),
                request.getDisplayName(), // Это Full Name из формы
                request.getPhoneNumber(),
                request.getGender()
        );

        user.setAuthorId(authorId);
        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        String loginInput = request.getEmail().toLowerCase().trim(); // Здесь может быть как email, так и username

        // Аутентификация через Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginInput, request.getPassword()));

        // Ищем пользователя по email ИЛИ по username
        User user = userRepository.findByEmail(loginInput)
                .or(() -> userRepository.findByUsername(loginInput))
                .orElseThrow(() -> new IllegalArgumentException("User not found with identifier: " + loginInput));

        return buildAuthResponse(user);
    }

    public UserProfileResponse profile(CustomUserDetails user) {
        // Если тебе нужно возвращать в профиле телефон и гендер, обнови конструктор UserProfileResponse
        return new UserProfileResponse(user.getUsername(), user.getDisplayName(), user.getAuthorId());
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(
                token,
                jwtService.getExpirationMs(),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAuthorId());
    }
}