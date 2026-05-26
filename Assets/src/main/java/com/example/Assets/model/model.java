package com.example.Assets.model;

import java.time.LocalDateTime;

/**
 * Enterprise API Response Wrapper.
 * This standardizes every response sent from the Java Backend to the HTML
 * Frontend.
 */
public class model<T> {

    private boolean success;
    private String message;
    private T payload; // Generic payload can hold an Asset, a List of Assets, or a String hash
    private String timestamp;

    // Empty constructor for JSON mapping
    public model() {
        this.timestamp = LocalDateTime.now().toString();
    }

    // Full constructor
    public model(boolean success, String message, T payload) {
        this.success = success;
        this.message = message;
        this.payload = payload;
        this.timestamp = LocalDateTime.now().toString();
    }

    // --- PRO FEATURE: Static Factory Methods ---
    // These allow the Controller to build responses cleanly in one line of code.

    public static <T> model<T> success(String message, T payload) {
        return new model<>(true, message, payload);
    }

    public static <T> model<T> error(String message) {
        return new model<>(false, message, null);
    }

    // --- GETTERS & SETTERS ---

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getPayload() {
        return payload;
    }

    public void setPayload(T payload) {
        this.payload = payload;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}