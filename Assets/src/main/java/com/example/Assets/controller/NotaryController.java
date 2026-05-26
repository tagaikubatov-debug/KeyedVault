package com.example.Assets.controller;

import com.example.Assets.auth.CustomUserDetails;
import com.example.Assets.service.NotaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class NotaryController {

    private final NotaryService notaryService;

    @Autowired
    public NotaryController(NotaryService notaryService) {
        this.notaryService = notaryService;
    }

    // 1. Нотариус — генерация документа
    @PostMapping("/notary/generate")
    public ResponseEntity<Map<String, Object>> generateNotaryDoc(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails user) {

        String description = body.getOrDefault("description", "").trim();
        String authorId    = user != null ? user.getAuthorId()
                           : body.getOrDefault("authorId", "ANONYMOUS");
        String assetHash   = body.getOrDefault("assetHash", "");

        if (description.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR", "message", "Поле 'description' обязательно"));
        }
        return toResponse(notaryService.generateNotaryDocument(description, authorId, assetHash));
    }

    // 2. PDF экспорт
    @PostMapping("/notary/export-pdf")
    public ResponseEntity<?> exportPdf(@RequestBody Map<String, String> body) {
        String text     = body.getOrDefault("text",     "").trim();
        String filename = body.getOrDefault("filename", "document.pdf");

        if (text.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR", "message", "Поле 'text' обязательно"));
        }
        try {
            byte[] pdfBytes = notaryService.exportPdf(text, filename);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of(
                    "status", "ERROR", "message", "PDF не удался: " + e.getMessage()));
        }
    }

    // 3. Адвокат — с реальным authorId из JWT
    @PostMapping("/legal/ask")
    public ResponseEntity<Map<String, Object>> askLegal(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails user) {

        String question = body.getOrDefault("question", "").trim();
        String context  = body.getOrDefault("context",  "");
        String language = body.getOrDefault("language", "ru");
        String authorId = user != null ? user.getAuthorId() : "ANONYMOUS";

        if (question.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR", "message", "Поле 'question' обязательно"));
        }
        return toResponse(notaryService.askLegalAdvisor(question, context, language, authorId));
    }

    // 4. CLIP Антиплагиат
    @PostMapping("/plagiarism/check")
    public ResponseEntity<Map<String, Object>> checkPlagiarism(
            @RequestParam("file_a") MultipartFile fileA,
            @RequestParam("file_b") MultipartFile fileB) {

        if (fileA.isEmpty() || fileB.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR", "message", "Оба файла обязательны"));
        }
        return toResponse(notaryService.checkPlagiarism(fileA, fileB));
    }

    // 5. История чатов (для будущего UI)
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @AuthenticationPrincipal CustomUserDetails user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(notaryService.getChatHistory(user.getAuthorId()));
    }

    // 6. Health check
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean alive = notaryService.isAiEngineAlive();
        return ResponseEntity.ok(Map.of(
                "spring_backend",   "UP",
                "python_ai_engine", alive ? "UP" : "DOWN",
                "message",          alive ? "Все системы работают" : "Python AI недоступен"
        ));
    }

    private ResponseEntity<Map<String, Object>> toResponse(Map<String, Object> result) {
        boolean ok = "SUCCESS".equals(result.get("status"));
        return ok ? ResponseEntity.ok(result) : ResponseEntity.status(502).body(result);
    }
}
