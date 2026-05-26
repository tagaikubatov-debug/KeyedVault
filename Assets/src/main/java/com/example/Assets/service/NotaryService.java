package com.example.Assets.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Service
public class NotaryService {

    private static final Logger log = LoggerFactory.getLogger(NotaryService.class);

    @Value("${ai.engine.url:http://localhost:8001}")
    private String aiEngineUrl;

    // Claude + RAG: до 150 сек, берём 180 с запасом
    private static final int REQUEST_TIMEOUT_SEC = 180;
    private static final int CONNECT_TIMEOUT_SEC = 15;

    private final HttpClient httpClient;
    private final ObjectMapper json;

    public NotaryService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(CONNECT_TIMEOUT_SEC))
                .build();
        this.json = new ObjectMapper();
    }

    // ── Notary ───────────────────────────────────────────────────────────────
    public Map<String, Object> generateNotaryDocument(
            String description, String authorId, String assetHash) {
        String body = toJson(Map.of(
                "description", description,
                "author_id",   authorId,
                "asset_hash",  assetHash != null ? assetHash : ""
        ));
        Map<String, Object> result = postJson(aiEngineUrl + "/notary/generate", body);
        if ("SUCCESS".equals(result.get("status"))) {
            saveChatHistory(authorId,
                    "notary: " + description,
                    (String) result.getOrDefault("document", ""));
        }
        return result;
    }

    // ── PDF export ───────────────────────────────────────────────────────────
    public byte[] exportPdf(String text, String filename) throws Exception {
        String body = toJson(Map.of(
                "text",     text,
                "filename", filename != null ? filename : "document.pdf"
        ));
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(aiEngineUrl + "/notary/export-pdf"))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();
        HttpResponse<byte[]> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofByteArray());
        if (resp.statusCode() != 200) {
            throw new RuntimeException("PDF engine error " + resp.statusCode()
                    + ": " + new String(resp.body(), StandardCharsets.UTF_8));
        }
        return resp.body();
    }

    // ── Advocate ─────────────────────────────────────────────────────────────
    public Map<String, Object> askLegalAdvisor(
            String question, String context, String language, String authorId) {
        // "kz" → "ky" (кыргызский, не казахский)
        String lang = "kz".equals(language) ? "ky" : (language != null ? language : "ru");
        String body = toJson(Map.of(
                "question", question,
                "context",  context != null ? context : "",
                "language", lang
        ));
        Map<String, Object> result = postJson(aiEngineUrl + "/legal/ask", body);
        if ("SUCCESS".equals(result.get("status"))) {
            saveChatHistory(authorId, question, (String) result.getOrDefault("answer", ""));
        }
        return result;
    }

    // Перегрузка для обратной совместимости (без authorId)
    public Map<String, Object> askLegalAdvisor(String question, String context, String language) {
        return askLegalAdvisor(question, context, language, "ANONYMOUS");
    }

    // ── Plagiarism ───────────────────────────────────────────────────────────
    public Map<String, Object> checkPlagiarism(MultipartFile fileA, MultipartFile fileB) {
        return postMultipart(aiEngineUrl + "/plagiarism/check",
                Map.of("file_a", fileA, "file_b", fileB));
    }

    // ── Health ───────────────────────────────────────────────────────────────
    public boolean isAiEngineAlive() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(aiEngineUrl + "/health"))
                    .timeout(Duration.ofSeconds(5))
                    .GET().build();
            return httpClient.send(req, HttpResponse.BodyHandlers.ofString()).statusCode() == 200;
        } catch (Exception e) {
            log.warn("AI Engine недоступен: {}", e.getMessage());
            return false;
        }
    }

    // ── Chat history (thread-safe file append) ────────────────────────────────
    public synchronized void saveChatHistory(String authorId, String question, String answer) {
        File file = new File("chat_history.json");
        List<Map<String, Object>> history = new ArrayList<>();
        if (file.exists()) {
            try {
                history = json.readValue(file,
                        json.getTypeFactory().constructCollectionType(List.class, Map.class));
            } catch (IOException e) {
                log.warn("Не удалось прочитать историю чата: {}", e.getMessage());
            }
        }
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("authorId",  authorId);
        entry.put("question",  question);
        entry.put("answer",    answer);
        entry.put("timestamp", System.currentTimeMillis());
        history.add(entry);
        try {
            json.writerWithDefaultPrettyPrinter().writeValue(file, history);
        } catch (IOException e) {
            log.error("Не удалось сохранить историю чата: {}", e.getMessage());
        }
    }

    public synchronized List<Map<String, Object>> getChatHistory(String authorId) {
        File file = new File("chat_history.json");
        if (!file.exists()) return List.of();
        try {
            List<Map<String, Object>> all = json.readValue(file,
                    json.getTypeFactory().constructCollectionType(List.class, Map.class));
            List<Map<String, Object>> result = new ArrayList<>();
            for (Map<String, Object> e : all) {
                if (authorId.equals(e.get("authorId"))) result.add(e);
            }
            return result;
        } catch (IOException e) {
            log.warn("Ошибка чтения истории: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    private Map<String, Object> postJson(String url, String body) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(REQUEST_TIMEOUT_SEC))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                log.error("AI Engine вернул {}: {}", resp.statusCode(), resp.body());
                return errorMap("AI Engine error " + resp.statusCode() + ": " + resp.body());
            }
            return jsonToMap(resp.body());
        } catch (Exception e) {
            log.error("Ошибка запроса к {}: {}", url, e.getMessage());
            return errorMap("AI Engine недоступен: " + e.getMessage());
        }
    }

    private Map<String, Object> postMultipart(String url, Map<String, MultipartFile> files) {
        try {
            String boundary = "----KeyedBoundary" + System.currentTimeMillis();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            for (Map.Entry<String, MultipartFile> e : files.entrySet()) {
                String name  = e.getKey();
                MultipartFile f = e.getValue();
                String fname = f.getOriginalFilename() != null ? f.getOriginalFilename() : "image.png";
                baos.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
                baos.write(("Content-Disposition: form-data; name=\"" + name
                        + "\"; filename=\"" + fname + "\"\r\n").getBytes(StandardCharsets.UTF_8));
                baos.write(("Content-Type: " + f.getContentType() + "\r\n\r\n")
                        .getBytes(StandardCharsets.UTF_8));
                baos.write(f.getBytes());
                baos.write("\r\n".getBytes(StandardCharsets.UTF_8));
            }
            baos.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(REQUEST_TIMEOUT_SEC))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(baos.toByteArray()))
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) return errorMap("Plagiarism error " + resp.statusCode());
            return jsonToMap(resp.body());
        } catch (Exception e) {
            log.error("Multipart error: {}", e.getMessage());
            return errorMap("Ошибка антиплагиата: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> jsonToMap(String s) {
        try { return json.readValue(s, Map.class); }
        catch (Exception e) { return errorMap("Некорректный ответ AI Engine"); }
    }

    private String toJson(Map<String, Object> data) {
        try { return json.writeValueAsString(data); }
        catch (Exception e) { throw new RuntimeException("JSON error", e); }
    }

    private Map<String, Object> errorMap(String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("status",  "ERROR");
        m.put("message", msg);
        return m;
    }
}
