package com.example.Assets.repository;

import com.example.Assets.model.Asset;

import org.jspecify.annotations.Nullable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    // 1. PRO FEATURE: Find a specific asset by its unique cryptographic hash.
    // We use Optional<> to prevent NullPointerExceptions if the file doesn't exist.
    Optional<Asset> findByAssetHash(String assetHash);

    // 2. PRO FEATURE: Retrieve the entire history of assets protected by a specific
    // author.
    // Essential for building a user dashboard later.
    List<Asset> findByAuthorId(String authorId);

    // 3. SECURITY GUARDRAIL: Quickly check if a hash already exists in the ledger.
    // This is much faster and uses less memory than loading the entire Asset
    // object.
    boolean existsByAssetHash(String assetHash);

    // 4. VISUAL GUARDRAIL (Google Lens style): Check if visually identical file
    // exists
    // Prevents duplicates based on perceptual hashing (pHash)
    boolean existsBypHash(String pHash);

    List findAll();

    Asset save(Asset newAsset);
}