package com.example.Assets.service;

import com.example.Assets.model.Asset;
import com.example.Assets.model.model;
import com.example.Assets.repository.AssetRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@Service
public class AService {
    private static final Logger log = LoggerFactory.getLogger(AService.class);

    private final AssetRepository assetRepository;

    private final String WORKSPACE = System.getProperty("user.dir") + File.separator + "KeyedVault";
    private final String ORIGINALS_DIR = WORKSPACE + File.separator + "Originals";
    private final String PROTECTED_DIR = WORKSPACE + File.separator + "Protected";

    private static final Set<String> IMAGE_EXTENSIONS = Set.of(".png", ".jpg", ".jpeg", ".bmp", ".webp");
    private final String pythonScriptsDir = resolvePythonScriptsDir();

    @Autowired
    public AService(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    private static String resolvePythonScriptsDir() {
        String userDir = System.getProperty("user.dir");
        File inAssets = new File(userDir, "Assets");
        return inAssets.exists() ? inAssets.getAbsolutePath() : userDir;
    }

    private static String pythonCommand() {
        return System.getProperty("os.name").toLowerCase(Locale.ROOT).contains("win") ? "python" : "python3";
    }

    @PostConstruct
    public void initVault() {
        try {
            Files.createDirectories(Paths.get(ORIGINALS_DIR));
            Files.createDirectories(Paths.get(PROTECTED_DIR));
        } catch (IOException e) {
            log.error("Не удалось создать директории хранилища: {}", e.getMessage());
        }
    }

    public List<Asset> getLedgerForAuthor(String authorId) {
        return assetRepository.findByAuthorId(authorId);
    }

    // --- Метод для MainController (потоковое чтение в контроллере через FileSystemResource) ---
    // Сам метод теперь возвращает null, если файл не найден, логика отдачи лежит в контроллере
    public byte[] getFileByHash(String hash, String authorId) {
        // Логика оставлена для совместимости, но для больших файлов используй
        // FileSystemResource в контроллере, как мы и сделали ранее.
        return null;
    }

    public model<Asset> processAndProtectAsset(MultipartFile file, String authorId) {
        if (file == null || file.isEmpty()) return model.error("Файл пуст.");

        try {
            String originalFileName = file.getOriginalFilename();
            String fileHash = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

            Path originalPath = Paths.get(ORIGINALS_DIR, fileHash + "_" + originalFileName);
            Files.copy(file.getInputStream(), originalPath, StandardCopyOption.REPLACE_EXISTING);

            // 1. Проверка на дубликаты
            if (isImage(originalFileName)) {
                String pHash = generatePHash(originalPath.toAbsolutePath().toString());
                if (assetRepository.existsBypHash(pHash)) {
                    Files.deleteIfExists(originalPath);
                    return model.error("SECURITY ALERT: Этот актив уже защищен!");
                }
            }

            // 2. Вызов Python Engine
            Path protectedPath = Paths.get(PROTECTED_DIR, "KEYED_" + fileHash + "_" + originalFileName);
            ProcessBuilder pb = new ProcessBuilder(
                    pythonCommand(),
                    pythonScriptsDir + File.separator + "watermark_engine.py",
                    originalPath.toAbsolutePath().toString(),
                    protectedPath.toAbsolutePath().toString(),
                    authorId,
                    fileHash
            );

            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Читаем логи процесса для отладки
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) { log.debug("Python: {}", line); }
            }

            if (process.waitFor() == 0) {
                Asset newAsset = new Asset(fileHash, originalFileName, authorId);
                assetRepository.save(newAsset);
                return model.success("Актив успешно защищен.", newAsset);
            } else {
                Files.deleteIfExists(originalPath);
                return model.error("Ошибка при обработке водяного знака.");
            }
        } catch (Exception e) {
            log.error("Критическая ошибка процесса: ", e);
            return model.error("Ошибка: " + e.getMessage());
        }
    }

    private String generatePHash(String path) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(pythonCommand(), pythonScriptsDir + File.separator + "phash_engine.py", path);
        Process p = pb.start();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
            String line = reader.readLine();
            if (line != null && line.startsWith("PHASH_RESULT=")) return line.replace("PHASH_RESULT=", "").trim();
        }
        throw new Exception("pHash engine error");
    }

    private boolean isImage(String fileName) {
        return fileName != null && IMAGE_EXTENSIONS.stream().anyMatch(fileName.toLowerCase()::endsWith);
    }
}