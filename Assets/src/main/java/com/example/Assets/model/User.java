package com.example.Assets.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "username"), // Добавляем уникальность для username
        @UniqueConstraint(columnNames = "author_id")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // НОВОЕ: Юзернейм (уникальный, для авторизации или отображения)
    @Column(unique = true, length = 100)
    private String username;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    // Это твой Full Name из формы
    @Column(length = 100)
    private String displayName;

    // НОВОЕ: Номер телефона
    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    // НОВОЕ: Гендер (MALE, FEMALE, OTHER). В БД сохранится как VARCHAR
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Gender gender;

    /** Immutable owner id stamped on assets and watermarks */
    @Column(name = "author_id", nullable = false, unique = true, updatable = false, length = 80)
    private String authorId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public User() {
    }

    // Обновленный конструктор со всеми полями из формы регистрации
    public User(String email, String username, String passwordHash, String displayName, String phoneNumber, Gender gender) {
        this.email = email.toLowerCase().trim();
        this.username = username.toLowerCase().trim(); // Юзернейм тоже стоит приводить к lowerCase
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.phoneNumber = phoneNumber != null ? phoneNumber.trim() : null;
        this.gender = gender;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ── ГЕТТЕРЫ И СЕТТЕРЫ ────────────────────────────────────────────

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Gender getGender() {
        return gender;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }

    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}