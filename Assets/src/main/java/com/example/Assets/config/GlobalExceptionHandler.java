package com.example.Assets.config;

import com.example.Assets.model.model;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Bean Validation (@Valid) — возвращаем первую ошибку понятным сообщением
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<model<Void>> handleValidation(MethodArgumentNotValidException ex) {
        // Первая ошибка поля — самая важная для пользователя
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(model.error(message));
    }

    // Превышение размера файла
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<model<Void>> handleMaxUpload(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(model.error("File too large. Maximum size is 50 MB."));
    }

    // Любые IllegalArgumentException из сервисов
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<model<Void>> handleIllegalArg(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(model.error(ex.getMessage()));
    }

    // Fallback — все остальные необработанные
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", "Internal server error: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
