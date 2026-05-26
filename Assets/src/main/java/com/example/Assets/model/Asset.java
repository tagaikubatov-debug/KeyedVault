package com.example.Assets.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assets_ledger")
public class Asset {

    // Primary Key (Auto-incremented by the database)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // updatable = false ensures no one can accidentally overwrite the DNA Hash
    // later
    @Column(nullable = false, unique = true, updatable = false, length = 50)
    private String assetHash;

    @Column(nullable = false, updatable = false)
    private String originalFileName;

    @Column(nullable = false, updatable = false)
    private String authorId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime protectedAt;

    // --- НОВОЕ ПОЛЕ ДЛЯ ВИЗУАЛЬНОГО ХЭША (pHash) ---
    @Column(name = "p_hash")
    private String pHash;

    // Empty constructor is strictly required by Spring/Hibernate to build the
    // entity
    public Asset() {
    }

    // Constructor for the Controller to use
    public Asset(String assetHash, String originalFileName, String authorId) {
        this.assetHash = assetHash;
        this.originalFileName = originalFileName;
        this.authorId = authorId;
    }

    // Magic Method: Hibernate automatically triggers this right before saving to
    // SQL.
    // This ensures perfect server-time accuracy for your ledger.
    @PrePersist
    protected void onCreate() {
        this.protectedAt = LocalDateTime.now();
    }

    // --- GETTERS ---

    public Long getId() {
        return id;
    }

    public String getAssetHash() {
        return assetHash;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public String getAuthorId() {
        return authorId;
    }

    public LocalDateTime getProtectedAt() {
        return protectedAt;
    }

    // --- НОВЫЙ ГЕТТЕР И СЕТТЕР ДЛЯ pHash ---
    public String getPHash() {
        return pHash;
    }

    public void setPHash(String pHash) {
        this.pHash = pHash;
    }

    public void setStatus(String string) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'setStatus'");
    }
}