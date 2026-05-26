package com.example.Assets.controller;

import com.example.Assets.auth.CustomUserDetails;
import com.example.Assets.model.Asset;
import com.example.Assets.model.model;
import com.example.Assets.repository.AssetRepository;
import com.example.Assets.service.AService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/local")
public class MainController {

    private final AService aService;
    private final AssetRepository assetRepository;

    // Путь к защищенной директории, где лежат обработанные ИИ файлы
    private final Path protectedDir = Paths.get(
            System.getProperty("user.dir"), "KeyedVault", "Protected");

    public MainController(AService aService, AssetRepository assetRepository) {
        this.aService = aService;
        this.assetRepository = assetRepository;
    }

    // ── Ledger: Получение списка файлов пользователя ────────────────────────
    @GetMapping("/ledger")
    public ResponseEntity<List<Asset>> getLedger(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(aService.getLedgerForAuthor(user.getAuthorId()));
    }

    // ── Process: Загрузка и защита актива (через Python-движки) ──────────────
    @PostMapping("/process")
    public ResponseEntity<model<Asset>> processFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails user) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(model.error("Файл не может быть пустым"));
        }

        model<Asset> result = aService.processAndProtectAsset(file, user.getAuthorId());

        if (result.isSuccess()) {
            return ResponseEntity.ok(result);
        }

        // Логика кодов ответов для фронтенда
        String msg = result.getMessage() != null ? result.getMessage().toLowerCase() : "";
        HttpStatus status = msg.contains("identical") || msg.contains("already") || msg.contains("duplicate")
                ? HttpStatus.CONFLICT
                : msg.contains("empty") ? HttpStatus.BAD_REQUEST
                : HttpStatus.INTERNAL_SERVER_ERROR;

        return ResponseEntity.status(status).body(result);
    }


}